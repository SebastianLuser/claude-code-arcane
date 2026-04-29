---
name: slo-sli
description: "Define and operate SLIs, SLOs, and error budgets for Educabot services (Go + TS, GCP, Prometheus). Trigger: SLO, SLI, error budget, burn rate."
category: "observability"
stack: Go, TypeScript, Prometheus, GCP Cloud Monitoring, Terraform, Alertmanager
context: Educabot EdTech LatAm — servicios con peak en horario escolar AM
argument-hint: "[service-name] [--availability|--latency|--error]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
metadata:
  category: reliability
  sources:
    - Google SRE Handbook (sre.google/sre-book)
    - Google SRE Workbook — Implementing SLOs
    - OpenSLO Specification (openslo.com)
    - DORA Metrics (dora.dev)
---
# SLO / SLI — Reliability Objectives

Definir, medir y alertar SLIs/SLOs en servicios Educabot. Google SRE Workbook + realidad EdTech LatAm (peak escolar AM).

## Cuándo usar / NO usar

| Usar | NO usar |
|------|---------|
| Definir objetivos confiabilidad servicio nuevo/existente | Scripts internos, jobs one-shot, prototipos |
| Alertas por burn rate (reemplazar fixed-threshold) | Métricas infra (CPU/RAM/GC) — son causas, no SLIs |
| Negociar velocity vs estabilidad con producto | Antes de tener baseline real (≥2-4 semanas métricas) |
| Review trimestral SLOs | |
| Justificar feature freeze por error budget agotado | |

## Conceptos

| Término | Definición | Ejemplo |
|---------|-----------|---------|
| **SLI** | Métrica observable user-facing | Fracción requests con status <500 y latencia <500ms |
| **SLO** | Target sobre SLI en ventana | 99.9% requests cumplen SLI en 30 días |
| **SLA** | Compromiso contractual con penalidades | 99.5% uptime mensual en contrato B2B |
| **Error budget** | `100% - SLO` = downtime permitido | SLO 99.9% → 0.1% → ~43 min/mes |

**Regla:** `SLA < SLO < SLI real`. SLA tiene colchón sobre SLO, SLO se fija por debajo del desempeño observado.

## Buenos SLIs (defaults Educabot)

| Familia | Qué mide | Notas |
|---------|----------|-------|
| **Availability** | Fracción requests sin 5xx | Request-based, PromQL rate |
| **Latency** | p95/p99 bajo umbral | Nunca solo p50 — la cola es donde vive el user pain |
| **Quality** | Tasa éxito transacciones negocio | login, checkout, grade_submit success/attempts |
| **Freshness** | Lag último record procesado | Para pipelines de datos: lag <300s |

## Tiers de servicio

| Tier | Descripción | Availability | Latency p95 |
|------|-------------|-------------|-------------|
| **Tier-1** | Login, API core, grading en vivo | 99.95% | <300ms |
| **Tier-2** | Reportes, dashboards docentes | 99.5% | <1s |
| **Tier-3** | Background jobs, exports, analytics | 99% | N/A (batch) |

**Ventana horaria Educabot:** Tier-1 en horario escolar (07-18 UTC-3, L-V): 99.99%. Fuera: 99.9%. 5min caídos martes 09:00 duele 100x más que domingo 03:00.

## Error budget policy

| Budget remaining | Acción |
|-----------------|--------|
| >50% | Velocidad normal, features OK |
| 10-50% | Precaución, reforzar canary/staged rollouts |
| <10% | **Freeze features**, foco estabilidad |
| 0% (agotado) | Freeze + postmortem blameless → `/incident` |

Firmado por ingeniería + producto. Sin firma de producto, no hay SLO — hay wishlist.

## Alerting multi-window multi-burn-rate

Dos alertas por SLO: fast burn (page, 14.4x) + slow burn (ticket, 6x). Prometheus recording rules + Alertmanager.

> → Read references/alerting-burn-rate.md for fórmulas, GCP Terraform, dashboard y review trimestral

## Anti-patterns

> → Read references/anti-patterns.md for lista completa (10 items)

## Checklist

> → Read references/checklist.md for checklist completo (12 items)

## Delegación

- `/incident` — postmortem tras budget exhaustion
- `/audit-dev` — auditoría observabilidad existente
- `/scaffold-go` — scaffolding Go con Prometheus client
- `/deploy-check` — pre-deploy que impacte SLO
