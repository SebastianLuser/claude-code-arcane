---
name: gcp-cloud-architect
description: "Design and operate GCP: architectures with Terraform IaC, Cloud Run, BigQuery pipelines, cost optimization and Cloud Build CI/CD, plus day-2 operations for IAM and Secret Manager, Cloud Run, functions, Cloud SQL, Compute Engine, networking and audit logs."
argument-hint: ""
category: "devops"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# GCP Cloud Architect

Design scalable, cost-effective Google Cloud architectures for startups and enterprises with infrastructure-as-code templates.

---

## Workflow

### Step 1: Gather Requirements

Collect application specifications:
- Application type (web app, mobile backend, data pipeline, SaaS)
- Expected users and requests per second
- Budget constraints (monthly spend limit)
- Team size and GCP experience level
- Compliance requirements (GDPR, HIPAA, SOC 2)
- Availability requirements (SLA, RPO/RTO)

### Step 2: Design Architecture

Select from recommended patterns:
- **Serverless Web**: Cloud Storage + Cloud CDN + Cloud Run + Firestore
- **Microservices on GKE**: GKE Autopilot + Cloud SQL + Memorystore + Pub/Sub
- **Serverless Data Pipeline**: Pub/Sub + Dataflow + BigQuery + Looker
- **ML Platform**: Vertex AI + Cloud Storage + BigQuery + Cloud Functions

See `references/architecture_patterns.md` for detailed pattern specifications with service stacks, Terraform configs, and cost estimates.

**Validation checkpoint:** Confirm the recommended pattern matches the team's operational maturity and compliance requirements before proceeding.

### Step 3: Estimate Cost

```bash
python scripts/cost_optimizer.py --resources current_setup.json --monthly-spend 2000
```

Output includes monthly cost breakdown, right-sizing recommendations, committed use discount opportunities, and sustained use discount analysis. Use the [GCP Pricing Calculator](https://cloud.google.com/products/calculator) for detailed estimates.

### Step 4: Generate IaC

```bash
python scripts/deployment_manager.py --app-name my-app --pattern serverless_web --region us-central1
```

Generates production-ready Terraform HCL and gcloud CLI scripts. See `references/architecture_patterns.md` for full template examples including Cloud CDN, Identity Platform, IAM, and Cloud Monitoring.

### Step 5: Configure CI/CD

Set up automated deployment with Cloud Build or GitHub Actions. See `references/best_practices.md` for cloudbuild.yaml templates and trigger configuration.

### Step 6: Security Review

Verify security configuration:
- IAM roles follow least privilege (prefer predefined over basic roles)
- Service accounts use Workload Identity for GKE
- VPC Service Controls for sensitive APIs
- Cloud KMS for customer-managed encryption
- Cloud Audit Logs enabled for all admin activity
- Secret Manager for all credentials

---

## Tools

### architecture_designer.py
Recommends GCP services based on workload requirements.

```bash
python scripts/architecture_designer.py --input requirements.json --output design.json
```

### cost_optimizer.py
Analyzes GCP resources for cost savings: idle removal, right-sizing, committed use discounts, storage transitions.

```bash
python scripts/cost_optimizer.py --resources inventory.json --monthly-spend 5000
```

### deployment_manager.py
Generates gcloud CLI scripts and Terraform configurations.

```bash
python scripts/deployment_manager.py --app-name my-app --pattern serverless_web --region us-central1
```

---

## Quick Start

| Scenario | Architecture | Estimated Cost |
|----------|-------------|----------------|
| Web App on Cloud Run (<1k users) | Cloud Run + Firestore + Identity Platform + Cloud CDN | $15-40/mo |
| Microservices SaaS (50k users) | GKE Autopilot + Cloud SQL + Memorystore + Cloud Build | $500-2000/mo |
| Serverless Data Pipeline | Pub/Sub + Dataflow + BigQuery + Looker | Variable |
| ML Platform | Vertex AI + Cloud Storage + BigQuery + Cloud Functions | Variable |

---

## Anti-Patterns

| Anti-Pattern | Better Approach |
|---|---|
| Using default VPC for production | Custom VPC with private subnets |
| Over-provisioning GKE node pools | GKE Autopilot or cluster autoscaler |
| Storing secrets in env vars | Secret Manager with Workload Identity |
| Single-region deployment for SaaS | Multi-region with Cloud Load Balancing |
| BigQuery on-demand for heavy workloads | BigQuery slots (flat-rate) for consistency |
| Cloud Functions for long tasks (>60s) | Cloud Run for longer-running tasks |

---

## Operate

Once it runs, read only the file for the service at hand. Engine-level database work is in `/database-ops`, backups in `/backup-strategy`, rollback with revisions in `/rollback-strategy`, incidents in `/incident-response`.

| Area | Reference | Covers |
|---|---|---|
| IAM and secrets | `references/ops-iam-secrets.md` | One service account per service, GitHub through Workload Identity Federation, Secret Manager access and rotation, auditing |
| Cloud Run | `references/ops-cloud-run.md` | Concurrency, min/max instances, billing mode, probes, ingress and VPC egress, deploys, debugging |
| Cloud Run functions | `references/ops-cloud-functions.md` | Deploys, Eventarc triggers and idempotency, retries and dead letters, scheduled calls, debugging |
| Cloud SQL | `references/ops-cloud-sql.md` | Private IP and the Auth Proxy, IAM auth, HA, maintenance, restores, alerts |
| Compute Engine | `references/ops-compute.md` | Regional MIGs with autohealing, OS Login and IAP SSH, snapshots, debugging |
| Networking | `references/ops-networking.md` | Custom VPC, firewall by service account, Cloud NAT, private access, load balancer with Cloud Armor, Connectivity Tests |
| Audit logs | `references/ops-audit-logs.md` | Log types and defaults, Data Access logs, sinks, investigation queries, alerts |

## Reference Documentation

| Document | Contents |
|----------|----------|
| `references/architecture_patterns.md` | 6 patterns with Terraform configs, gcloud scripts, cost estimates |
| `references/service_selection.md` | Decision matrices for compute, database, storage, messaging |
| `references/best_practices.md` | Naming, labels, IAM, networking, monitoring, DR |
