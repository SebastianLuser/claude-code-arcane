---
name: observability-setup
description: "Observability setup: OpenTelemetry + Prometheus + Grafana + Loki + Sentry. Go, TS, React, RN."
category: "observability"
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

> → Read references/stack-setup-details.md for per-stack setup (Go, TS Fastify, React, React Native, OTel Collector)

> → Read references/conventions-and-anti-patterns.md for logging/metrics/traces conventions, anti-patterns, and checklist
