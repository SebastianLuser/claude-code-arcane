---
name: terraform-init
description: "Terraform infrastructure scaffolding: project structure, remote state, modules, CI/CD, naming, anti-patterns"
argument-hint: "[provider: aws|gcp] [project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# terraform-init — Terraform Infrastructure Scaffolder

Generate production-ready Terraform for AWS (default) or GCP. Multi-env with separate directories.

## Principles

1. **Remote state mandatory** — S3 + DynamoDB lock (AWS) or GCS (GCP)
2. **Reusable modules** — VPC, EKS/GKE, RDS/Cloud SQL as modules
3. **One state per environment** — never a monolithic multi-env state
4. **No hardcoding** — variables + tfvars per env
5. **Explicit outputs** — what other stacks consume goes as output
6. **`terraform fmt` + `tflint` + `tfsec`** in CI
7. **Plan on PR, apply from main** (or manual with approval)
8. **Pinned versions** on providers and modules
9. **Mandatory tags** on every resource (cost allocation via `default_tags`)

## Discovery questions

1. Cloud target: AWS (default) / GCP / multi-cloud
2. Primary region and env list (dev / staging / prod)
3. Workloads: EKS / ECS / Cloud Run / VM
4. Database: RDS Postgres / Aurora / Cloud SQL
5. State backend already created?
6. DNS: Route53 / Cloud DNS zone exists?

## Project structure

```
infra/
  bootstrap/           # creates state backend (run once)
  modules/             # reusable modules (vpc, eks, rds, redis, s3)
  envs/
    staging/           # main.tf, backend.tf, variables.tf, outputs.tf, terraform.tfvars
    production/
  .github/workflows/   # terraform-plan.yml, terraform-apply.yml
```

## State management

| Decision | Guideline |
|----------|-----------|
| Backend | S3 + DynamoDB lock (AWS), GCS (GCP) — never local |
| State bucket | Versioning ON, encryption ON, public access blocked |
| Key pattern | `<env>/terraform.tfstate` |
| Locking | Always — DynamoDB (AWS) or GCS native (GCP) |
| Workspaces vs dirs | Prefer separate dirs per env for isolation |

## Module design criteria

- Use official maintained modules first (`terraform-aws-modules/*`)
- Custom modules when official ones don't fit or for org-specific patterns
- Pin module versions — never reference `main` branch
- Every module: clear inputs (variables), outputs, README

## Naming conventions

- Resources: `<project>-<env>-<resource>` (e.g., `myapp-staging-vpc`)
- Data sources for lookups (zones, AMIs) — never hardcode IDs
- `for_each` over `count` — deletions don't break state ordering

## CI/CD workflow

| Event | Action |
|-------|--------|
| PR touching `infra/**` | `terraform fmt -check`, `tflint`, `tfsec`, `terraform plan` |
| Merge to main | `terraform apply` with environment approval gate |

Plan artifacts uploaded per env. Apply requires manual approval for production.

## Security checklist

- [ ] State bucket: versioning, encryption, no public access
- [ ] Providers pinned (`~> major.minor`)
- [ ] No secrets in `variables.tf` defaults
- [ ] Sensitive outputs marked `sensitive = true`
- [ ] Deletion protection ON for prod databases
- [ ] Multi-AZ enabled for prod
- [ ] Security groups: no `allow_all` / `0.0.0.0/0` ingress
- [ ] IAM: least privilege, prefer IRSA/Workload Identity

## Anti-patterns

- Local state committed to repo
- Single monolithic state across all environments
- `terraform apply` from laptop to production
- Providers without version pin — silent breaking changes
- Secrets in variable defaults or unmasked outputs
- `count` where `for_each` should be used
- Hardcoded resource IDs instead of data source lookups
- No locking on state — concurrent applies corrupt state
- Monolithic config files — split by resource type as they grow
