---
name: slo-sli
description: Definir y operar SLIs, SLOs y error budgets para servicios Educabot (Go + TS sobre GCP / Prometheus). Usar cuando se mencione SLO, SLI, SLA, error budget, burn rate, availability target, latency target, alerting por SLO, o reliability objectives.
stack: Go, TypeScript, Prometheus, GCP Cloud Monitoring, Terraform, Alertmanager
context: Educabot EdTech LatAm — servicios con peak en horario escolar AM
argument-hint: "[service-name] [--availability|--latency|--error]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# SLO / SLI — Reliability Objectives

Guía operativa para definir, medir y alertar SLIs/SLOs en servicios Educabot. Basado en Google SRE Workbook + realidad EdTech LatAm (peak escolar AM).

## Cuándo usar

- Definir objetivos de confiabilidad para un servicio nuevo o existente.
- Diseñar alertas por burn rate (reemplazar alertas fixed-threshold ruidosas).
- Negociar scope/velocity vs estabilidad con producto.
- Review trimestral de SLOs (ajustar si sobrecumplís o incumplís).
- Justificar freeze de features cuando el error budget se agota.

## Cuándo NO usar

- Scripts internos, jobs one-shot, prototipos sin usuarios.
- Métricas puramente de debugging (CPU, RAM, GC pauses) — esas son causas, no SLIs.
- Antes de tener baseline real (al menos 2-4 semanas de métricas).

---

## 1. Conceptos base

| Término | Definición | Ejemplo |
|---|---|---|
| **SLI** | Service Level Indicator: métrica observable user-facing. | Fracción de requests con `status < 500` y latencia `< 500ms`. |
| **SLO** | Service Level Objective: target sobre el SLI en una ventana. | 99.9% de requests cumplen el SLI en los últimos 30 días. |
| **SLA** | Service Level Agreement: compromiso contractual con consecuencias (créditos, penalidades). | 99.5% uptime mensual en contrato B2B. |
| **Error budget** | `100% - SLO`. Downtime/errores permitidos antes de romper SLO. | SLO 99.9% → budget 0.1% → ~43 min/mes. |

**Regla de oro:** `SLA < SLO < SLI real`. El SLA tiene colchón sobre el SLO, y el SLO se fija por debajo del desempeño real observado.

---

## 2. Buenos SLIs (defaults Educabot)

Cuatro familias que cubren 95% de los casos:

### 2.1 Availability (request-based)

```promql
sum(rate(http_requests_total{job="api",status!~"5.."}[5m]))
/
sum(rate(http_requests_total{job="api"}[5m]))
```

### 2.2 Latency (p95/p99)

```promql
histogram_quantile(0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket{job="api"}[5m]))
) < 0.5
```

Medí p95 y p99 — nunca p50 solo (ignora la cola donde vive el user pain).

### 2.3 Quality (flujos críticos)

Tasa de éxito de transacciones de negocio: `login_success / login_attempts`, `checkout_success / checkout_start`, `grade_submit_success / grade_submit_attempts`.

### 2.4 Freshness (pipelines de datos)

Lag del último record procesado vs ahora: `time() - pipeline_last_record_timestamp_seconds < 300`.

---

## 3. Tiers de servicio Educabot

| Tier | Descripción | SLO availability | SLO latency p95 |
|---|---|---|---|
| **Tier-1** | Login, API core, grading en vivo | 99.95% | < 300ms |
| **Tier-2** | Reportes, dashboards docentes | 99.5% | < 1s |
| **Tier-3** | Background jobs, exports, analytics | 99% | N/A (batch) |

**Educabot-específico — ventanas horarias:** el peak es horario escolar AM LatAm. Podés definir SLO por ventana:

- Tier-1 en horario escolar (07:00–18:00 UTC-3, L-V): **99.99%**
- Tier-1 fuera de horario escolar: **99.9%**

Esto refleja el impacto real: un downtime de 5 min a las 09:00 de un martes escolar duele 100x más que a las 03:00 del domingo.

---

## 4. Error budget policy

El SLO sin política es decorativo. Definí **qué pasa** cuando el budget se quema:

| Budget remaining | Acción |
|---|---|
| > 50% | Velocidad normal. Deploys de features OK. Permitido riesgo. |
| 10–50% | Precaución. Reforzar canary/staged rollouts. |
| < 10% | **Freeze de features**. Foco exclusivo en estabilidad hasta recuperar budget. |
| 0% (agotado) | Freeze + postmortem blameless obligatorio. Delegar a `/incident`. |

Firmado por ingeniería + producto. Sin firma de producto, no hay SLO — hay wishlist.

---

## 5. Alerting multi-window multi-burn-rate (Google SRE)

Reemplaza alertas fixed-threshold. Dos alertas combinadas por SLO:

- **Fast burn (page):** ventana 5min + 1h, burn rate 14.4x → consume 2% del budget en 1h. Page a on-call.
- **Slow burn (ticket):** ventana 30min + 6h, burn rate 6x → consume 10% del budget en 6h. Ticket no-urgente.

Evita fatiga (no alerta por spikes aislados) y detecta drain lento (degradaciones graduales).

### 5.1 Recording rules Prometheus (pre-compute)

```yaml
groups:
- name: slo_api_core
  interval: 30s
  rules:
  - record: slo:http_requests:rate5m
    expr: sum(rate(http_requests_total{job="api"}[5m]))
  - record: slo:http_requests:errors:rate5m
    expr: sum(rate(http_requests_total{job="api",status=~"5.."}[5m]))
  - record: slo:error_ratio:5m
    expr: slo:http_requests:errors:rate5m / slo:http_requests:rate5m
  - record: slo:error_ratio:1h
    expr: |
      sum(rate(http_requests_total{job="api",status=~"5.."}[1h]))
      / sum(rate(http_requests_total{job="api"}[1h]))
```

### 5.2 Alertmanager burn-rate alerts

```yaml
groups:
- name: slo_api_core_alerts
  rules:
  - alert: SLOBurnRateFast
    expr: |
      slo:error_ratio:5m  > (14.4 * 0.001)
      and
      slo:error_ratio:1h  > (14.4 * 0.001)
    for: 2m
    labels:
      severity: page
      slo: api-core-availability
    annotations:
      summary: "API core quemando error budget 14.4x (fast)"
      runbook: "https://wiki.educabot/runbooks/api-core-slo"

  - alert: SLOBurnRateSlow
    expr: |
      slo:error_ratio:30m > (6 * 0.001)
      and
      slo:error_ratio:6h  > (6 * 0.001)
    for: 15m
    labels:
      severity: ticket
      slo: api-core-availability
```

`0.001` = 1 - 0.999 (SLO 99.9%). Ajustá por SLO de cada tier.

---

## 6. GCP Cloud Monitoring SLOs (Terraform)

Nativo en GCP — evita duplicar cálculo si ya usás Cloud Monitoring.

```hcl
resource "google_monitoring_custom_service" "api_core" {
  service_id   = "api-core"
  display_name = "API Core (Tier-1)"
}

resource "google_monitoring_slo" "api_core_availability" {
  service      = google_monitoring_custom_service.api_core.service_id
  slo_id       = "availability-30d"
  display_name = "API Core availability 99.95% / 30d"
  goal                = 0.9995
  rolling_period_days = 30

  request_based_sli {
    good_total_ratio {
      total_service_filter = <<-EOT
        metric.type="prometheus.googleapis.com/http_requests_total/counter"
        resource.type="prometheus_target"
      EOT
      bad_service_filter = <<-EOT
        metric.type="prometheus.googleapis.com/http_requests_total/counter"
        resource.type="prometheus_target"
        metric.label."status"=monitoring.regex.full_match("5..")
      EOT
    }
  }
}

resource "google_monitoring_alert_policy" "api_core_burn_fast" {
  display_name = "API Core burn rate fast (14.4x)"
  combiner     = "OR"
  conditions {
    display_name = "Fast burn"
    condition_threshold {
      filter          = "select_slo_burn_rate(\"${google_monitoring_slo.api_core_availability.name}\", \"3600s\")"
      threshold_value = 14.4
      comparison      = "COMPARISON_GT"
      duration        = "120s"
    }
  }
  notification_channels = [var.pagerduty_channel]
}
```

---

## 7. Dashboard interno

Público para producto + ingeniería. Mínimo:

- SLO actual (30d rolling) por servicio y tier.
- Error budget remaining (%, minutos).
- Burn rate actual (1h, 6h).
- Top 5 endpoints que más budget consumen.
- Historial de incidentes con link al postmortem.

---

## 8. Review trimestral

- **Sobrecumple consistente** (ej: SLO 99.9% pero real 99.99% por 2 trimestres): SLO demasiado laxo. Subirlo o relajar velocity (permitir más experimentación).
- **Incumple consistente**: target irreal o deuda técnica. Bajar SLO temporalmente + plan de mejora, o inversión en reliability.
- **Flujos de negocio cambiaron**: reevaluar qué SLIs importan (ej: nuevo flujo de inscripción crítico).

---

## 9. Anti-patterns

- ❌ **SLO 100%** — imposible y desincentiva deploys. Cualquier cambio quema budget infinito.
- ❌ **SLI infra-centric** (`CPU > 80%`, `RAM > 90%`) — son causas de debugging, no experiencia de usuario.
- ❌ **Sin error budget policy** — SLO decorativo. Si nadie frena features cuando se quema, no existe.
- ❌ **SLO por compromiso comercial** sin baseline real. Primero medís, después prometés.
- ❌ **Medir solo p50** — ignora la cola donde viven los usuarios enojados. Siempre p95/p99.
- ❌ **Ventana corta (5min) sin ventana larga (30d)** — perdés señal de drain lento y alertás por spikes.
- ❌ **Una sola alerta fixed-threshold** (`error_rate > 1%`) — fatiga garantizada. Usá multi-burn-rate.
- ❌ **SLOs sin owner** — nadie los revisa, nadie los defiende. Asigná equipo dueño por SLO.
- ❌ **Mismo SLO para todos los servicios** — un cron de reportes nocturnos no necesita 99.95%.
- ❌ **Ignorar el contexto temporal** — en Educabot, 5min caídos a las 09:00 de martes escolar ≠ 5min a las 03:00 domingo.

---

## 10. Checklist por servicio

- [ ] Servicio clasificado por tier (1/2/3).
- [ ] SLIs definidos: availability + latency mínimo; quality/freshness si aplica.
- [ ] Baseline medido (≥ 2-4 semanas) antes de fijar SLO.
- [ ] SLO firmado por ingeniería + producto.
- [ ] Error budget policy escrita y linkeada.
- [ ] Owner asignado (equipo, no persona).
- [ ] Recording rules Prometheus desplegadas.
- [ ] Alertas multi-burn-rate (fast + slow) configuradas.
- [ ] SLO visible en dashboard interno.
- [ ] Runbook linkeado desde cada alerta.
- [ ] Review trimestral calendarizado.
- [ ] Ventana horaria escolar considerada (tier-1).

---

## 11. Output esperado ✅

Al aplicar este skill a un servicio, debería quedar:

1. Documento de SLO en `/docs/slo/<servicio>.md` con: tier, SLIs, SLOs, error budget policy, owner.
2. Recording rules Prometheus en `prometheus/rules/slo_<servicio>.yml`.
3. Alertas Alertmanager o `google_monitoring_alert_policy` (Terraform).
4. Dashboard Grafana / Cloud Monitoring linkeado.
5. Entrada en Jira/tablero para review trimestral recurrente.

---

## 12. Delegación

- **Postmortem tras budget exhaustion:** delegar a `/incident` (post-mortem blameless + tickets de seguimiento en Jira).
- **Auditoría de observabilidad existente:** delegar a `/audit-dev` (cubre tests, seguridad, calidad, deuda — incluir observabilidad en scope).
- **Crear tickets de remediación:** `/jira-tickets` (proyectos ALZ, TICH, TUNI, VIA).
- **Scaffolding de servicio Go con métricas:** `/scaffold-go` ya incluye Prometheus client via team-ai-toolkit.
- **Pre-deploy verification:** `/deploy-check` antes de cambios que puedan impactar SLO.
