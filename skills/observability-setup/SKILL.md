---
name: observability-setup
description: "Observability setup: OpenTelemetry + Prometheus + Grafana + Loki + Sentry, alert rules and Alertmanager, or Datadog. Go, TS, React, RN."
category: "observability"
argument-hint: "[stack: go|ts|react|rn] [--full|--lite]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# observability-setup — Observability Stack

3 pillars + error tracking: **OpenTelemetry** (instrumentation) → **Prometheus + Loki + Tempo** (storage) → **Grafana** (UI) + **Sentry** (errors). Correlation via `trace_id`.

## Educabot stack

| Layer | Tool |
|------|-------------|
| Instrumentation | OpenTelemetry SDK |
| Logs | Loki (structured JSON) |
| Metrics | Prometheus (pull, kube-native) |
| Traces | Tempo |
| Unified UI | Grafana (dashboards + alerts + correlation) |
| Errors | Sentry (crash reporting with context) |
| Alerting | Alertmanager → PagerDuty/Slack |

## Grafana Dashboard — RED Metrics

- Request Rate: `sum(rate(http_requests_total{service="$svc"}[5m]))`
- Error Rate: 5xx / total
- Latency p50/p95/p99: `histogram_quantile`
- Saturation: CPU + memory per pod

## Base Alerts

| Alert | Expr | Severity |
|--------|------|----------|
| HighErrorRate | 5xx rate > 5% for 10min | critical |
| HighLatencyP95 | p95 > 1s for 10min | warning |
| PodCrashLooping | restarts > 0 for 15min | critical |
| PodMemoryNearLimit | memory > 90% limit for 10min | warning |

The real rules (YAML), database alerts and Alertmanager routing:

> → Read references/prometheus-alert-rules.md for rule files with `for:`, aggregation and runbook links, database alerts from the exporters, Alertmanager routing and inhibition, and `promtool`/`amtool` checks

> → Read references/datadog.md for projects on Datadog instead: Agent per platform (Cloud Run, ECS, Kubernetes, OTLP), unified service tagging, APM and logs, monitors as code in Terraform, and cost control

> → Read references/stack-setup-details.md for per-stack setup (Go, TS Fastify, React, React Native, OTel Collector)

> → Read references/conventions-and-anti-patterns.md for logging/metrics/traces conventions, anti-patterns, and checklist
