---
name: azure-cloud-architect
description: "Design and operate Azure: architectures with Bicep IaC, cost optimization and CI/CD, plus day-2 operations for identity and Key Vault, Functions, Azure SQL, networking, VMs, Monitor/audit and Azure Pipelines."
argument-hint: ""
category: "devops"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Azure Cloud Architect

Design scalable, cost-effective Azure architectures for startups and enterprises with Bicep infrastructure-as-code templates.

---

## Workflow

### Step 1: Gather Requirements

Collect application specifications:
- Application type (web app, mobile backend, data pipeline, SaaS, microservices)
- Expected users and requests per second
- Budget constraints (monthly spend limit)
- Team size and Azure experience level
- Compliance requirements (GDPR, HIPAA, SOC 2, ISO 27001)
- Availability requirements (SLA, RPO/RTO)

### Step 2: Design Architecture

Select from recommended patterns:
- **App Service Web**: Front Door + App Service + Azure SQL + Redis Cache
- **Microservices on AKS**: AKS + Service Bus + Cosmos DB + API Management
- **Serverless Event-Driven**: Functions + Event Grid + Service Bus + Cosmos DB
- **Data Pipeline**: Data Factory + Synapse Analytics + Data Lake Storage + Event Hubs

See `references/architecture_patterns.md` for detailed pattern specifications with service stacks, cost estimates, and trade-offs.

**Validation checkpoint:** Confirm the recommended pattern matches the team's operational maturity and compliance requirements before proceeding.

### Step 3: Generate IaC Templates

```bash
python scripts/bicep_generator.py --arch-type web-app --output main.bicep
```

**Bicep is the recommended IaC language for Azure.** Prefer Bicep over ARM JSON: cleaner syntax, module support, first-party Microsoft support.

See `references/architecture_patterns.md` for full Bicep template examples including Front Door, Key Vault, Managed Identity, and monitoring.

### Step 4: Review Costs

```bash
python scripts/cost_optimizer.py --config current_resources.json --json
```

Output includes monthly cost breakdown, right-sizing recommendations, Reserved Instance opportunities, and savings estimates.

### Step 5: Configure CI/CD

Set up Azure DevOps Pipelines or GitHub Actions with Azure. See `references/best_practices.md` for pipeline templates and deployment patterns.

### Step 6: Security Review

Validate security posture before production:
- **Identity**: Entra ID with RBAC, Managed Identity for service-to-service auth
- **Secrets**: Key Vault for all secrets, certificates, and connection strings
- **Network**: NSGs on all subnets, Private Endpoints for PaaS services
- **Encryption**: TLS 1.2+ in transit, Azure-managed or customer-managed keys at rest
- **Monitoring**: Microsoft Defender for Cloud, Azure Policy for guardrails

---

## Tools

### architecture_designer.py
Generates architecture pattern recommendations from requirements.

```bash
python scripts/architecture_designer.py --app-type web_app --users 50000 \
  --requirements '{"budget_monthly_usd": 1000, "compliance": ["HIPAA"]}' --json
```

### cost_optimizer.py
Analyzes Azure resources for cost savings: idle removal, right-sizing, Reserved Instances, storage tier transitions.

```bash
python scripts/cost_optimizer.py --config resources.json --json
```

### bicep_generator.py
Generates Bicep template scaffolds with Managed Identity, Key Vault integration, diagnostic settings, NSGs, and tags.

```bash
python scripts/bicep_generator.py --arch-type microservices --output main.bicep
```

---

## Quick Start

| Scenario | Architecture | Estimated Cost |
|----------|-------------|----------------|
| Web App (<5k users) | App Service B1 + Azure SQL Serverless + Blob + Front Door | $40-80/mo |
| Microservices SaaS (50k users) | AKS + API Management + Cosmos DB + Service Bus | $500-2000/mo |
| Serverless Event-Driven | Functions + Event Grid + Service Bus + Cosmos DB | $30-150/mo |
| Data Pipeline (10M events/day) | Event Hubs + Stream Analytics + Data Lake + Synapse | $300-1500/mo |

---

## Anti-Patterns

| Anti-Pattern | Better Approach |
|---|---|
| ARM JSON for new projects | Bicep -- cleaner syntax, modules |
| Secrets in App Settings | Key Vault references |
| Single large AKS node pool | Multiple pools: system, app, jobs |
| Public endpoints on PaaS | Private Endpoints + VNet integration |
| No tagging strategy | Tag: environment, owner, cost-center |

---

## Operate

Once it runs, read only the file for the service at hand. Engine-level database work is in `/database-ops`, backups in `/backup-strategy`, incidents in `/incident-response`.

| Area | Reference | Covers |
|---|---|---|
| Identity and Key Vault | `references/ops-key-vault-identity.md` | Managed identities, RBAC, GitHub OIDC with federated credentials, vault settings, Key Vault references, debugging `403` |
| Functions | `references/ops-functions.md` | Plans and settings, slots and swap, queue/timer/HTTP triggers, debugging |
| Azure SQL | `references/ops-sql.md` | Entra auth and private access, PITR and failover groups, Query Store, Cosmos DB notes |
| Networking | `references/ops-networking.md` | VNets, NSGs, private endpoints and DNS zones, NAT, Bastion, Network Watcher |
| VMs | `references/ops-vms.md` | Scale sets and zones, Bastion and Entra login, boot repair, deallocation |
| Monitor and audit | `references/ops-monitor-audit.md` | Activity Log, resource and Entra logs, Policy-enforced diagnostics, KQL queries, alerts |
| Azure Pipelines | `references/ops-pipelines.md` | Stages and environments, workload identity service connections, Key Vault variable groups |

## Reference Documentation

| Document | Contents |
|----------|----------|
| `references/architecture_patterns.md` | 5 patterns with Bicep templates, CI/CD configs, cost estimates |
| `references/service_selection.md` | Decision matrices for compute, database, storage, messaging |
| `references/best_practices.md` | Naming, tagging, RBAC, network security, monitoring, DR |
