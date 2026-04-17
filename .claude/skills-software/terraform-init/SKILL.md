---
name: terraform-init
description: "Genera infra Terraform para stack Educabot (AWS por default): VPC, EKS, RDS Postgres, ElastiCache Redis, S3, IAM/IRSA, ACM, Route53. Módulos reutilizables + remote state en S3 + DynamoDB lock. Usar para: terraform, infra, IaC, AWS, EKS, RDS, VPC."
argument-hint: "[provider: aws|gcp] [project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# terraform-init — Terraform Infrastructure Scaffolder

Genera un repo de **Terraform** production-ready para infra Educabot en AWS (default) o GCP. Multi-env con workspaces o directorios separados.

## Cuándo usar

- Nuevo proyecto que necesita infra desde cero
- Migrar infra clickeada a IaC
- Agregar un nuevo env (staging/prod) al repo existente
- Empaquetar un patrón como módulo reutilizable

## Principios

1. **Remote state obligatorio** — S3 + DynamoDB lock (AWS) o GCS (GCP)
2. **Módulos reutilizables** — VPC, EKS, RDS van como módulos
3. **Un state por environment** — NO un state monolítico
4. **No hardcodear** — variables + tfvars por env
5. **Outputs explícitos** — lo que consumen otros stacks va como output
6. **`terraform fmt` + `tflint` + `tfsec`** en CI
7. **Plan en PR, apply desde main** (o manual con approval)
8. **Versiones pineadas** en providers y módulos
9. **Tags obligatorios** en todo recurso (cost allocation)

## Preguntas previas

1. **Cloud target**: AWS (default) / GCP / multi-cloud
2. **Region primaria**: `us-east-1` / `sa-east-1` (LATAM) / otra
3. **Envs**: dev / staging / prod (¿cuáles?)
4. **Workloads**: EKS / ECS / Cloud Run / VM pura
5. **DB**: RDS Postgres / Aurora / Cloud SQL
6. **State backend existente?** S3 bucket + DDB table ya creados?
7. **Dominios/DNS**: Route53 hosted zone ya existe?

---

## 1. Estructura del repo

```
infra/
├── README.md
├── .terraform-version          # tfenv / asdf
├── .tflint.hcl
├── bootstrap/                  # crea state backend (1 sola vez)
│   ├── main.tf
│   └── outputs.tf
├── modules/                    # módulos reusables
│   ├── vpc/
│   ├── eks/
│   ├── rds/
│   ├── redis/
│   └── s3-bucket/
├── envs/
│   ├── staging/
│   │   ├── main.tf
│   │   ├── backend.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars
│   └── production/
│       └── ...
└── .github/workflows/
    ├── terraform-plan.yml
    └── terraform-apply.yml
```

---

## 2. Bootstrap — remote state (run once)

`bootstrap/main.tf`:

```hcl
terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.70" }
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project   = "educabot"
      ManagedBy = "terraform"
      Repo      = "infra"
    }
  }
}

resource "aws_s3_bucket" "tfstate" {
  bucket = "educabot-tfstate-${var.account_id}"
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "tflock" {
  name         = "educabot-tflock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute { name = "LockID", type = "S" }
}
```

---

## 3. Backend config — `envs/staging/backend.tf`

```hcl
terraform {
  backend "s3" {
    bucket         = "educabot-tfstate-123456789012"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "educabot-tflock"
    encrypt        = true
  }
}
```

---

## 4. Env staging — `envs/staging/main.tf`

Usa módulos públicos maintained (`terraform-aws-modules`) o módulos custom.

```hcl
terraform {
  required_version = ">= 1.9"
  required_providers {
    aws        = { source = "hashicorp/aws",        version = "~> 5.70" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.32" }
    helm       = { source = "hashicorp/helm",       version = "~> 2.15" }
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project     = "educabot"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  name = "educabot-${var.environment}"
  azs  = slice(data.aws_availability_zones.available.names, 0, 3)
}

data "aws_availability_zones" "available" { state = "available" }

# ─── VPC ─────────────────────────────────────────────
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.13"

  name = "${local.name}-vpc"
  cidr = "10.0.0.0/16"
  azs  = local.azs

  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment != "production"
  enable_dns_hostnames = true
  enable_dns_support   = true

  public_subnet_tags  = { "kubernetes.io/role/elb"          = 1 }
  private_subnet_tags = { "kubernetes.io/role/internal-elb" = 1 }
}

# ─── EKS ─────────────────────────────────────────────
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.24"

  cluster_name    = local.name
  cluster_version = "1.30"

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    default = {
      min_size     = 2
      max_size     = 5
      desired_size = 2
      instance_types = ["t3.large"]
      capacity_type  = var.environment == "production" ? "ON_DEMAND" : "SPOT"
    }
  }

  enable_cluster_creator_admin_permissions = true

  cluster_addons = {
    coredns                = {}
    kube-proxy             = {}
    vpc-cni                = {}
    aws-ebs-csi-driver     = {}
  }
}

# ─── RDS Postgres ────────────────────────────────────
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.10"

  identifier = "${local.name}-pg"
  engine               = "postgres"
  engine_version       = "16.4"
  family               = "postgres16"
  major_engine_version = "16"
  instance_class       = var.environment == "production" ? "db.t4g.medium" : "db.t4g.small"

  allocated_storage     = 20
  max_allocated_storage = 100

  db_name  = "app"
  username = "app"
  manage_master_user_password = true

  multi_az               = var.environment == "production"
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = var.environment == "production" ? 14 : 3
  deletion_protection     = var.environment == "production"
  skip_final_snapshot     = var.environment != "production"

  performance_insights_enabled = true
}

resource "aws_security_group" "rds" {
  name   = "${local.name}-rds"
  vpc_id = module.vpc.vpc_id
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }
}

# ─── Redis (ElastiCache) ─────────────────────────────
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.name}-redis"
  description                = "Redis ${var.environment}"
  engine                     = "redis"
  engine_version             = "7.1"
  node_type                  = "cache.t4g.small"
  num_cache_clusters         = var.environment == "production" ? 2 : 1
  automatic_failover_enabled = var.environment == "production"
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name}-redis"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "redis" {
  name   = "${local.name}-redis"
  vpc_id = module.vpc.vpc_id
  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }
}

# ─── S3 (assets) ─────────────────────────────────────
module "assets" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.2"

  bucket = "${local.name}-assets"
  versioning = { enabled = true }
  server_side_encryption_configuration = {
    rule = { apply_server_side_encryption_by_default = { sse_algorithm = "AES256" } }
  }
}

# ─── Route53 ─────────────────────────────────────────
data "aws_route53_zone" "main" { name = "educabot.com" }

# ─── ACM cert ────────────────────────────────────────
module "cert" {
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 5.1"

  domain_name       = "${var.environment}.educabot.com"
  zone_id           = data.aws_route53_zone.main.zone_id
  validation_method = "DNS"
  subject_alternative_names = ["*.${var.environment}.educabot.com"]
  wait_for_validation = true
}
```

---

## 5. Variables y outputs

`envs/staging/variables.tf`:

```hcl
variable "region"      { type = string, default = "us-east-1" }
variable "environment" { type = string, default = "staging" }
```

`envs/staging/terraform.tfvars`:

```hcl
region      = "us-east-1"
environment = "staging"
```

`envs/staging/outputs.tf`:

```hcl
output "vpc_id"           { value = module.vpc.vpc_id }
output "cluster_name"     { value = module.eks.cluster_name }
output "cluster_endpoint" { value = module.eks.cluster_endpoint }
output "rds_endpoint"     { value = module.rds.db_instance_address, sensitive = true }
output "redis_endpoint"   { value = aws_elasticache_replication_group.redis.primary_endpoint_address, sensitive = true }
```

---

## 6. CI/CD — `.github/workflows/terraform-plan.yml`

```yaml
name: Terraform Plan

on:
  pull_request:
    paths: ['infra/**']

permissions:
  id-token: write
  contents: read
  pull-requests: write

jobs:
  plan:
    strategy:
      matrix: { env: [staging, production] }
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: infra/envs/${{ matrix.env }} } }
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.TF_PLAN_ROLE }}
          aws-region: us-east-1
      - uses: hashicorp/setup-terraform@v3
        with: { terraform_version: 1.9.8 }
      - run: terraform fmt -check -recursive
        working-directory: infra
      - uses: terraform-linters/setup-tflint@v4
      - run: tflint --recursive
        working-directory: infra
      - uses: aquasecurity/tfsec-action@v1
      - run: terraform init
      - run: terraform plan -out=tfplan -no-color
      - uses: actions/upload-artifact@v4
        with: { name: tfplan-${{ matrix.env }}, path: infra/envs/${{ matrix.env }}/tfplan }
```

`terraform-apply.yml` corre desde main con `environment: production` (required reviewers) y consume el artifact de plan.

---

## 7. Convenciones

- **Módulos oficiales primero** (`terraform-aws-modules/*`) antes de reinventar
- **Un archivo por recurso lógico** cuando crezcan (`rds.tf`, `eks.tf`)
- **Data sources** para lookups (zone, AMIs), no hardcodear IDs
- **`for_each` > `count`** (deletes no rompen el resto del state)
- **Secrets desde `manage_master_user_password`** (RDS) o Secrets Manager
- **Tags vía `default_tags` en provider** — no tagear recurso por recurso

---

## 8. Checklist

- [ ] Remote state configurado (S3 + DDB lock)
- [ ] State bucket con versioning + encryption + block public
- [ ] Providers pineados (~> version)
- [ ] `terraform fmt`, `tflint`, `tfsec` en CI
- [ ] PR = plan automatic, apply manual desde main
- [ ] Module versions pineadas
- [ ] Tags obligatorios en default_tags
- [ ] Secrets managed (no hardcoded, no en outputs sin `sensitive`)
- [ ] Deletion protection en prod RDS
- [ ] Multi-AZ en prod

---

## 9. Anti-patterns

- ❌ State local committeado al repo
- ❌ Un state gigante multi-env
- ❌ `terraform apply` desde laptop a prod
- ❌ Providers sin version pin → breaking changes silenciosos
- ❌ Secrets en `variables.tf` con default
- ❌ Outputs con datos sensibles sin `sensitive = true`
- ❌ `count` donde debería ir `for_each`
- ❌ `allow_all = true` en security groups

---

## Output final

```
✅ infra/ scaffoldeado
   - bootstrap/ (state backend)
   - modules/ (vpc, eks, rds, redis, s3)
   - envs/staging + envs/production
   - CI workflows (plan en PR, apply con approval)

Próximos pasos:
  cd infra/bootstrap && terraform init && terraform apply
  cd ../envs/staging && terraform init && terraform plan
  # Revisar plan, luego apply con approval en GH Actions
```

## Delegación

**Coordinar con:** `cloud-architect`, `sre-lead`, `platform-lead`
**Reporta a:** `cloud-architect`

**Skills relacionadas:**
- `/k8s-deploy` — workloads que corren en el EKS que crea este módulo
- `/ci-cd-setup` — pipelines de terraform plan/apply
- `/docker-setup` — images consumidas por esos workloads
