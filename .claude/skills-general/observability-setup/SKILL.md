---
name: observability-setup
description: "Setup observabilidad (logs+metrics+traces) para stacks Educabot. OpenTelemetry + Prometheus + Grafana + Loki + Sentry. Go, TS Fastify, React, RN. DO NOT TRIGGER when: queries de métricas o dashboards en infra ya configurada (usar observability-ops), troubleshooting de alerts existentes."
argument-hint: "[stack: go|ts|react|rn] [--full|--lite]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# observability-setup — Observability Stack

3 pilares + error tracking: **OpenTelemetry** (instrumentación) → **Prometheus + Loki + Tempo** (storage) → **Grafana** (UI) + **Sentry** (errores). Correlación vía `trace_id`.

## Stack Educabot

| Capa | Herramienta |
|------|-------------|
| Instrumentación | OpenTelemetry SDK |
| Logs | Loki (structured JSON) |
| Metrics | Prometheus (pull, kube-native) |
| Traces | Tempo |
| UI unificada | Grafana (dashboards + alerts + correlation) |
| Errors | Sentry (crash reporting con contexto) |
| Alerting | Alertmanager → PagerDuty/Slack |

## Setup por Stack

### Go Backend
- OTel SDK: `go.opentelemetry.io/otel` + exporters OTLP gRPC + `otelgin` middleware
- Logger: `slog` JSON con `trace_id` de span context
- Sentry: `sentry-go` + `sentrygin` middleware, `TracesSampleRate: 0.1`

### TS Fastify Backend
- OTel: `@opentelemetry/sdk-node` + auto-instrumentations + OTLP exporter. **Importar antes que Fastify**
- Logger: pino con trace_id/span_id inyectados via OTel `getActiveSpan()`
- Sentry: `@sentry/node` + profiling, error handler en Fastify

### React + Vite
- Sentry: `@sentry/react` con browserTracing + replay integration
- Web Vitals: `web-vitals` (CLS, INP, LCP)

### React Native (Expo)
- `@sentry/react-native` con `enableNativeCrashHandling: true`
- `Sentry.wrap(RootLayout)` en `app/_layout.tsx`

## OTel Collector (K8s)

Helm chart `open-telemetry/opentelemetry-collector`. Receivers OTLP (gRPC :4317, HTTP :4318) → processors (batch, memory_limiter) → exporters (Tempo, Prometheus remote write, Loki).

## Grafana Dashboard — RED Metrics

- Request Rate: `sum(rate(http_requests_total{service="$svc"}[5m]))`
- Error Rate: 5xx / total
- Latency p50/p95/p99: `histogram_quantile`
- Saturation: CPU + memory por pod

## Alertas Base

| Alerta | Expr | Severity |
|--------|------|----------|
| HighErrorRate | 5xx rate > 5% por 10min | critical |
| HighLatencyP95 | p95 > 1s por 10min | warning |
| PodCrashLooping | restarts > 0 por 15min | critical |
| PodMemoryNearLimit | memory > 90% limit por 10min | warning |

## Convenciones

### Logs
- JSON en prod, human-readable solo dev. Niveles consistentes
- No logear secrets/PII. Campo `event` estandarizado. `trace_id` en todo log

### Metrics
- snake_case con unidad (`http_request_duration_seconds`). Labels cardinality baja (nunca `user_id`)
- Counter monótono, gauge estado, histogram duraciones

### Traces
- Sampling 10% default, 100% para errores. Span names con template no URL concreta
- Atributos OpenTelemetry semconv estándar

## Anti-patterns

- `console.log` suelto, loguear passwords/tokens/PII
- Labels Prometheus alta cardinality, sampling 100% traces en prod
- Alertas sin severity ni runbook, dashboards sin estándar entre equipos
- Sentry sin `environment`, SLO sin burn-rate

## Checklist

- [ ] Logs JSON con trace_id
- [ ] Métricas RED en `/metrics`
- [ ] Tracing con sampling configurable
- [ ] Sentry DSN por env (dev/staging/prod)
- [ ] Health endpoints `/health` + `/ready`
- [ ] Dashboard Grafana del servicio
- [ ] Alertas base definidas (error rate, latency, crashes)
- [ ] SLOs documentados + burn-rate alerts
- [ ] Runbook linkeado desde cada alerta
