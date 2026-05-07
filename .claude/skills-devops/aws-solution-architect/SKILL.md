---
name: aws-solution-architect
description: "Design AWS architectures with CloudFormation/CDK IaC, serverless patterns, cost optimization, and CI/CD for Lambda, API Gateway, DynamoDB, ECS, and Aurora."
category: "devops"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# AWS Solution Architect

Design scalable, cost-effective AWS architectures for startups with infrastructure-as-code templates.

---

## Workflow

### Step 1: Gather Requirements

Collect application specifications:
- Application type (web app, mobile backend, data pipeline, SaaS)
- Expected users and requests per second
- Budget constraints (monthly spend limit)
- Team size and AWS experience level
- Compliance requirements (GDPR, HIPAA, SOC 2)
- Availability requirements (SLA, RPO/RTO)

### Step 2: Design Architecture

Select from recommended patterns:
- **Serverless Web**: S3 + CloudFront + API Gateway + Lambda + DynamoDB
- **Event-Driven Microservices**: EventBridge + Lambda + SQS + Step Functions
- **Three-Tier**: ALB + ECS Fargate + Aurora + ElastiCache
- **GraphQL Backend**: AppSync + Lambda + DynamoDB + Cognito

See `references/architecture_patterns.md` for detailed pattern specifications with service stacks, CloudFormation templates, and cost estimates.

**Validation checkpoint:** Confirm the recommended pattern matches the team's operational maturity and compliance requirements before proceeding.

### Step 3: Generate IaC Templates

```bash
python scripts/serverless_stack.py --app-name my-app --region us-east-1
```

Generates production-ready CloudFormation YAML (SAM), CDK TypeScript, or Terraform HCL. See `references/architecture_patterns.md` for full template examples including API Gateway, Cognito, IAM roles, and CloudWatch logging.

### Step 4: Review Costs

```bash
python scripts/cost_optimizer.py --resources current_setup.json --monthly-spend 2000
```

Output includes monthly cost breakdown by service, right-sizing recommendations, Savings Plans opportunities, and potential monthly savings.

### Step 5: Deploy

```bash
# CloudFormation
aws cloudformation create-stack --stack-name my-app-stack \
  --template-body file://template.yaml --capabilities CAPABILITY_IAM

# CDK
cdk deploy

# Terraform
terraform init && terraform apply
```

### Step 6: Validate and Handle Failures

```bash
aws cloudformation describe-stacks --stack-name my-app-stack
```

**Common failure causes:**
- IAM permission errors -- verify `--capabilities CAPABILITY_IAM` and role trust policies
- Resource limit exceeded -- request quota increase via Service Quotas console
- Invalid template syntax -- run `aws cloudformation validate-template` before deploying

---

## Tools

### architecture_designer.py
Generates architecture patterns based on requirements.

```bash
python scripts/architecture_designer.py --input requirements.json --output design.json
```

### serverless_stack.py
Creates serverless CloudFormation templates with API Gateway, Lambda, DynamoDB, Cognito, IAM, and CloudWatch.

```bash
python scripts/serverless_stack.py --app-name my-app --region us-east-1
```

### cost_optimizer.py
Analyzes costs and recommends optimizations: idle removal, right-sizing, reserved capacity, storage tier transitions.

```bash
python scripts/cost_optimizer.py --resources inventory.json --monthly-spend 5000
```

---

## Quick Start

| Scenario | Architecture | Estimated Cost |
|----------|-------------|----------------|
| MVP Backend (<1k users) | Lambda + API Gateway + DynamoDB + Cognito + S3/CloudFront | $20-50/mo |
| Scaling SaaS (50k users) | ECS Fargate + Aurora Serverless + ElastiCache + CodePipeline | $500-2000/mo |
| Cost Optimization | Right-sizing + Savings Plans + storage lifecycle | Target 30% savings |
| IaC Generation | VPC + ALB + ECS Fargate + Aurora + IAM | Full template |

---

## Reference Documentation

| Document | Contents |
|----------|----------|
| `references/architecture_patterns.md` | 6 patterns: serverless, microservices, three-tier, data processing, GraphQL, multi-region |
| `references/service_selection.md` | Decision matrices for compute, database, storage, messaging |
| `references/best_practices.md` | Serverless design, cost optimization, security hardening, scalability |
