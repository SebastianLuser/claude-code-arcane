---
name: observability-ops
description: "Distributed tracing setup and SLO/SLI framework for production services"
category: "observability"
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

> → Read references/tracing-setup.md for backend selection, setup decisions, span design rules, and OTel Collector config

---

## Part 2: SLO / SLI Framework

> → Read references/slo-sli-framework.md for SLI types, service tier targets, error budget policy, alerting, dashboards, and quarterly review

---

## Checklist

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

> → Read references/anti-patterns.md for 12 tracing and SLO anti-patterns
