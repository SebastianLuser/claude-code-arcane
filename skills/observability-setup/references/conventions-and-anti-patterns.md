# observability-setup — Conventions & Anti-patterns

## Logs
- JSON in prod, human-readable only in dev. Consistent levels
- Do not log secrets/PII. Standardized `event` field. `trace_id` on every log

## Metrics
- snake_case with the unit (`http_request_duration_seconds`). Low-cardinality labels (never `user_id`)
- Counter for monotonic values, gauge for state, histogram for durations

## Traces
- 10% sampling by default, 100% for errors. Span names from a template, not a concrete URL
- Standard OpenTelemetry semconv attributes

## Anti-patterns

- Stray `console.log`, logging passwords/tokens/PII
- High-cardinality Prometheus labels, 100% trace sampling in prod
- Alerts without severity or a runbook, dashboards with no standard across teams
- Sentry without `environment`, SLOs without burn-rate

## Checklist

- [ ] JSON logs with trace_id
- [ ] RED metrics at `/metrics`
- [ ] Tracing with configurable sampling
- [ ] Sentry DSN per env (dev/staging/prod)
- [ ] Health endpoints `/health` + `/ready`
- [ ] Grafana dashboard for the service
- [ ] Base alerts defined (error rate, latency, crashes)
- [ ] SLOs documented + burn-rate alerts
- [ ] Runbook linked from every alert
