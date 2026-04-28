---
name: observability-ops
description: "Distributed tracing setup and SLO/SLI framework for production services"
argument-hint: "[tracing|slo|sli|full]"
user-invocable: true
allowed-tools: ["Read", "Grep", "Glob", "Bash", "Write", "Edit"]
---
# observability-ops — Tracing + SLO/SLI

## Part 1: Distributed Tracing

### When to use
- Debug cross-service latency / bottlenecks
- Correlate errors with full request context (trace_id in logs)
- NOT for intra-process profiling (pprof) or as replacement for aggregated metrics (Prometheus)

### Backend selection

| Backend | When |
|---------|------|
| **Google Cloud Trace** | Default for GCP (Cloud Run/GKE) |
| **Grafana Tempo** | Self-hosted, pairs with Loki |
| **Datadog APM** | Enterprise Datadog org |
| **Jaeger OSS** | Local dev / fallback |

Always export via OTLP — switch backends without code changes.

### Setup decisions

| Decision | Guideline |
|----------|-----------|
| Instrumentation | Auto-instrumentation first. Manual spans only for business-critical ops. |
| Propagation | W3C Trace Context. Async (PubSub/Kafka): manual inject/extract in message attributes. |
| Sampling dev | 100% `AlwaysSample` |
| Sampling prod | 10% `ParentBased(TraceIDRatioBased(0.1))` |
| Sampling errors | 100% via tail-based sampling in OTel Collector |
| Frontend web | 1-5% (browser traffic is massive) |
| Log correlation | `trace_id` + `span_id` in every structured log line |

### Span design rules
- Resource attributes: `service.name`, `deployment.environment`
- Span attributes: user.id, tenant.id, http.route — never PII
- Always `RecordError()` + `SetStatus(Error)` on failures; always `defer span.End()`
- SDK initializes BEFORE other imports (Node: `--require`)

### OTel Collector (tail-based sampling)
Deploy between app and backend to capture 100% errors, 100% slow traces (>1000ms), probabilistic for rest.

---

## Part 2: SLO / SLI Framework

### SLI types

| SLI | Measures | Pattern |
|-----|----------|---------|
| **Availability** | Successful requests | `non-5xx / total` |
| **Latency** | Response time | p95 and p99 (never p50 alone) |
| **Quality** | Business transaction success | `success / attempts` |
| **Freshness** | Pipeline recency | `now - last_record < threshold` |

### Service tier targets

| Tier | Availability | Latency p95 |
|------|-------------|-------------|
| **1** (login, core API) | 99.95% | < 300ms |
| **2** (reports, dashboards) | 99.5% | < 1s |
| **3** (background jobs) | 99% | N/A |

### Error budget policy

| Budget remaining | Action |
|-----------------|--------|
| > 50% | Normal velocity |
| 10-50% | Enforce canary/staged rollouts |
| < 10% | **Feature freeze** — stability only |
| 0% | Freeze + mandatory blameless postmortem |

Must be signed by engineering AND product — otherwise decorative.

### Alerting: multi-window burn-rate
- **Fast burn (page):** 5min + 1h windows, 14.4x rate — pages on-call
- **Slow burn (ticket):** 30min + 6h windows, 6x rate — non-urgent ticket

### Dashboard minimum
SLO (30d rolling), error budget remaining, burn rate (1h/6h), top 5 budget-consuming endpoints, incident history.

### Quarterly review
- Consistently exceeding: raise SLO or allow more experimentation
- Consistently missing: lower temporarily + improvement plan
- Business flows changed: re-evaluate SLIs

---

## Combined checklist

- [ ] OTel SDK initialized first; clean shutdown on SIGTERM
- [ ] Propagator: TraceContext + Baggage; sampler: 10% prod / 100% dev
- [ ] HTTP server/client + DB driver instrumented
- [ ] Async: manual inject/extract of traceparent
- [ ] Logs include trace_id + span_id; no PII in attributes
- [ ] Service classified by tier; SLIs defined (availability + latency minimum)
- [ ] Baseline >= 2-4 weeks before setting SLO; policy signed by eng + product
- [ ] Burn-rate alerts (fast + slow); runbook linked from each
- [ ] SLO visible in dashboard; quarterly review scheduled

## Anti-patterns

- 100% sampling in prod — explosive cost
- Missing propagation — orphaned spans / broken traces
- PII in attributes — compliance violation
- No log-to-trace correlation — cannot jump from log to trace
- Forgetting `span.End()` — memory leak
- No OTel Collector — cannot tail-sample or filter PII
- SLO of 100% — impossible, blocks all deploys
- Infra-centric SLIs (CPU/RAM) — causes, not user experience
- SLO without budget policy — nobody acts on it
- Only p50 latency — ignores painful tail
- Single fixed-threshold alert — guaranteed fatigue
- Same SLO for all services — batch jobs != core API
