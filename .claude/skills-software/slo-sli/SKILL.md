---
name: slo-sli
description: Definir y operar SLIs, SLOs y error budgets para servicios Educabot (Go + TS sobre GCP / Prometheus). Usar cuando se mencione SLO, SLI, SLA, error budget, burn rate, availability target, latency target, alerting por SLO, o reliability objectives.
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

Reemplaza fixed-threshold. Dos alertas por SLO:
- **Fast burn (page):** ventana 5min+1h, burn rate 14.4x → consume 2% budget en 1h. Page a on-call.
- **Slow burn (ticket):** ventana 30min+6h, burn rate 6x → consume 10% budget en 6h. Ticket no-urgente.

Implementar con Prometheus recording rules (pre-compute error ratios a 5m, 1h, 30m, 6h) + Alertmanager rules. Fórmula: threshold = `burn_rate × (1 - SLO)`. Ej: SLO 99.9% → `14.4 × 0.001 = 0.0144`.

## GCP Cloud Monitoring (Terraform)

Alternativa nativa si ya usás Cloud Monitoring: `google_monitoring_custom_service` + `google_monitoring_slo` (request_based_sli, rolling_period_days 30) + `google_monitoring_alert_policy` (select_slo_burn_rate, threshold 14.4).

## Dashboard interno

Público para producto + ingeniería. Mínimo: SLO actual (30d rolling) por servicio/tier, error budget remaining (%, minutos), burn rate actual (1h, 6h), top 5 endpoints que más budget consumen, historial incidentes con link postmortem.

## Review trimestral

- **Sobrecumple consistente** (ej: SLO 99.9% real 99.99% 2 trimestres): SLO laxo, subir o permitir más experimentación
- **Incumple consistente:** target irreal o deuda técnica, bajar SLO temporalmente + plan mejora
- **Flujos cambiaron:** reevaluar qué SLIs importan

## Anti-patterns

- SLO 100% — imposible, desincentiva deploys
- SLI infra-centric (CPU/RAM) — no es experiencia de usuario
- Sin error budget policy — SLO decorativo
- SLO sin baseline real — primero medís, después prometés
- Solo p50 — ignora cola
- Ventana corta (5min) sin larga (30d) — pierde drain lento
- Una sola alerta fixed-threshold — fatiga garantizada
- SLOs sin owner — nadie los revisa
- Mismo SLO para todos los servicios
- Ignorar contexto temporal (horario escolar)

## Checklist por servicio

- [ ] Servicio clasificado por tier (1/2/3)
- [ ] SLIs definidos: availability + latency mínimo; quality/freshness si aplica
- [ ] Baseline medido (≥2-4 semanas)
- [ ] SLO firmado por ingeniería + producto
- [ ] Error budget policy escrita y linkeada
- [ ] Owner asignado (equipo, no persona)
- [ ] Recording rules Prometheus desplegadas
- [ ] Alertas multi-burn-rate (fast + slow) configuradas
- [ ] SLO visible en dashboard interno
- [ ] Runbook linkeado desde cada alerta
- [ ] Review trimestral calendarizado
- [ ] Ventana horaria escolar considerada (tier-1)

## Delegación

- `/incident` — postmortem tras budget exhaustion
- `/audit-dev` — auditoría observabilidad existente
- `/scaffold-go` — scaffolding Go con Prometheus client
- `/deploy-check` — pre-deploy que impacte SLO
