---
name: observability
description: "Observability decision guide: structured logs, metrics, traces (OTel), error tracking, alerts, SLOs. Use for: observability, logs, metrics, traces, errors, sentry, otel, prometheus, grafana, alerts."
category: "observability"
argument-hint: "[errors|logs|metrics|traces|alerts]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# observability — Decision Guide

Correlate all pillars via **trace_id**. Each pillar has distinct tooling, sampling, and retention.

## Three Pillars + Error Tracking

| Pillar | Answers | Recommended | Alternative |
|---|---|---|---|
| **Logs** | What happened? | slog (Go) / pino (TS) → Loki | Datadog, Cloud Logging |
| **Metrics** | How is it performing? | Prometheus + Grafana | Datadog, Cloud Monitoring |
| **Traces** | Where is time spent? | OpenTelemetry → Tempo | Datadog APM, Jaeger |
| **Errors** | What broke? | Sentry (web+BE) / Bugsnag (mobile) | Rollbar |
| **Alerting** | Is it degraded? | Alertmanager → Slack/PagerDuty | Grafana Alerts |

Sentry vs Bugsnag: Sentry for web+backend (broader: replay, profiling, self-host). Bugsnag for mobile-first (stability score, symbolication). One DSN per app per platform.

## Structured Logging

| Level | When | Example |
|---|---|---|
| DEBUG | Dev only, never prod | SQL queries, internal payloads |
| INFO | Business events | "order created", "payment processed" |
| WARN | Degraded but recovered | Retry succeeded, rate limit near |
| ERROR | Requires attention | Exception caught, dependency down |
| FATAL | Process must exit | Missing config, port in use |

Rules: JSON format, one line per event. `trace_id` in every line. Access logs include method/path/status/latency/user_id/tenant_id. Exclude healthchecks. Audit logs: separate, append-only, >=1yr retention.

## Frontend Observability

- Error boundaries at route + feature level, reported to Sentry
- Core Web Vitals (LCP, INP, CLS) tracked, alert on regressions
- Source maps uploaded in CI, .map files deleted from dist, never served publicly
- Breadcrumbs (~50 pre-error events) for debugging context
- Release tracking on every deploy for per-release stability

## Alert Design

- Alert on **SLO burn rate**, not raw values — avoids false positives from spikes
- Every alert needs a **runbook or clear action** — no action = delete it
- Severity: critical (pages on-call), warning (Slack, next day), info (dashboard only)
- Error tracker: new prod issue → Slack; regression → reopen; spike >10x → PagerDuty

## Sampling & Retention

| Signal | Rate | Retention |
|---|---|---|
| Errors/crashes | 100% | 30d (app), >=1yr (audit/security) |
| Traces | 10% prod | 30d |
| Logs INFO (hot) | 1-5% | 30d hot, 90d cold |
| Logs ERROR+ | 100% | 30d hot, 90d cold |
| Metrics | — | 90d full-res, 1yr downsampled |

## PII Scrubbing

Never log: passwords, tokens, API keys, identity docs, payment data, minor emails, message content. Redact at logger level: password, token, authorization, secret, cookie fields.

## Anti-patterns

- `console.log`/`fmt.Println` in prod — unstructured, not indexable
- PII in logs/errors — legal risk
- Source maps public — exposes code; missing maps — useless stacks
- High-cardinality Prometheus labels (user_id, request_id)
- 100% trace sampling in prod — cost explosion
- One project for all apps; no env separation — mixed noise
- Alerts on info severity; alerts without runbook — fatigue
- Healthcheck log spam; infinite retention — cost
- Missing trace_id correlation across boundaries

## Checklist

- [ ] JSON logger with trace_id injection + PII scrubber
- [ ] OTel SDK with configurable sampling
- [ ] Error tracking: DSN per env, source maps in CI, release tracking
- [ ] RED metrics exposed (Rate, Error%, Duration p95)
- [ ] Grafana dashboard per service
- [ ] Alerts: error rate, latency p95, crashes, memory + SLO burn-rate
- [ ] Healthchecks excluded from logs/traces
- [ ] Retention policy per signal; audit logs separate + append-only
- [ ] Triage: daily inbox, weekly top-10 prioritization
