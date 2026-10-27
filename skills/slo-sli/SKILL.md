---
name: slo-sli
description: "Define and operate SLIs, SLOs, and error budgets for Educabot services (Go + TS, GCP, Prometheus). Trigger: SLO, SLI, error budget, burn rate."
category: "observability"
argument-hint: "[service-name] [--availability|--latency|--error]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
metadata:
  category: reliability
  stack: Go, TypeScript, Prometheus, GCP Cloud Monitoring, Terraform, Alertmanager
  business-context: Educabot EdTech LatAm — services that peak during morning school hours
  sources:
    - Google SRE Handbook (sre.google/sre-book)
    - Google SRE Workbook — Implementing SLOs
    - OpenSLO Specification (openslo.com)
    - DORA Metrics (dora.dev)
---
# SLO / SLI — Reliability Objectives

Define, measure and alert on SLIs/SLOs in Educabot services. Google SRE Workbook + the reality of EdTech in LatAm (morning school peak).

## When to use / NOT use

| Use | Do NOT use |
|------|---------|
| Define reliability objectives for a new/existing service | Internal scripts, one-shot jobs, prototypes |
| Burn-rate alerts (replacing fixed thresholds) | Infra metrics (CPU/RAM/GC) — they are causes, not SLIs |
| Negotiate velocity vs stability with product | Before having a real baseline (≥2-4 weeks of metrics) |
| Quarterly SLO review | |
| Justify a feature freeze due to an exhausted error budget | |

## Concepts

| Term | Definition | Example |
|---------|-----------|---------|
| **SLI** | An observable, user-facing metric | Fraction of requests with status <500 and latency <500ms |
| **SLO** | A target on the SLI over a window | 99.9% of requests meet the SLI over 30 days |
| **SLA** | A contractual commitment with penalties | 99.5% monthly uptime in a B2B contract |
| **Error budget** | `100% - SLO` = allowed downtime | SLO 99.9% → 0.1% → ~43 min/month |

**Rule:** `SLA < SLO < actual SLI`. The SLA has a cushion over the SLO, and the SLO is set below the observed performance.

## Good SLIs (Educabot defaults)

| Family | What it measures | Notes |
|---------|----------|-------|
| **Availability** | Fraction of requests without 5xx | Request-based, PromQL rate |
| **Latency** | p95/p99 under a threshold | Never p50 alone — the tail is where user pain lives |
| **Quality** | Success rate of business transactions | login, checkout, grade_submit success/attempts |
| **Freshness** | Lag of the last processed record | For data pipelines: lag <300s |

## Service tiers

| Tier | Description | Availability | Latency p95 |
|------|-------------|-------------|-------------|
| **Tier-1** | Login, core API, live grading | 99.95% | <300ms |
| **Tier-2** | Reports, teacher dashboards | 99.5% | <1s |
| **Tier-3** | Background jobs, exports, analytics | 99% | N/A (batch) |

**Educabot time window:** Tier-1 during school hours (07-18 UTC-3, Mon-Fri): 99.99%. Outside: 99.9%. 5 minutes down on a Tuesday at 09:00 hurts 100x more than on a Sunday at 03:00.

## Error budget policy

| Budget remaining | Action |
|-----------------|--------|
| >50% | Normal velocity, features OK |
| 10-50% | Caution, reinforce canary/staged rollouts |
| <10% | **Feature freeze**, focus on stability |
| 0% (exhausted) | Freeze + blameless postmortem → `/incident` |

Signed by engineering + product. Without product's signature there is no SLO — there is a wishlist.

## Multi-window multi-burn-rate alerting

Two alerts per SLO: fast burn (page, 14.4x) + slow burn (ticket, 6x). Prometheus recording rules + Alertmanager.

> → Read references/alerting-burn-rate.md for formulas, GCP Terraform, the dashboard and the quarterly review

The rest of the alerts, on-call and per-service dashboards:

> → Read references/alerting-and-dashboards.md for alert design (symptom vs cause, severity and routing), on-call rotation, the monthly fatigue review and the SLO → RED → dependencies → USE dashboard layout

## Anti-patterns

> → Read references/anti-patterns.md for the full list (10 items)

## Checklist

> → Read references/checklist.md for the full checklist (12 items)

## Delegation

- `/incident` — postmortem after budget exhaustion
- `/audit-dev` — audit of existing observability
- `/scaffold-go` — Go scaffolding with the Prometheus client
- `/deploy-check` — pre-deploy check for changes that impact the SLO
