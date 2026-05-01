# observability-setup — Conventions & Anti-patterns

## Logs
- JSON en prod, human-readable solo dev. Niveles consistentes
- No logear secrets/PII. Campo `event` estandarizado. `trace_id` en todo log

## Metrics
- snake_case con unidad (`http_request_duration_seconds`). Labels cardinality baja (nunca `user_id`)
- Counter monotono, gauge estado, histogram duraciones

## Traces
- Sampling 10% default, 100% para errores. Span names con template no URL concreta
- Atributos OpenTelemetry semconv estandar

## Anti-patterns

- `console.log` suelto, loguear passwords/tokens/PII
- Labels Prometheus alta cardinality, sampling 100% traces en prod
- Alertas sin severity ni runbook, dashboards sin estandar entre equipos
- Sentry sin `environment`, SLO sin burn-rate

## Checklist

- [ ] Logs JSON con trace_id
- [ ] Metricas RED en `/metrics`
- [ ] Tracing con sampling configurable
- [ ] Sentry DSN por env (dev/staging/prod)
- [ ] Health endpoints `/health` + `/ready`
- [ ] Dashboard Grafana del servicio
- [ ] Alertas base definidas (error rate, latency, crashes)
- [ ] SLOs documentados + burn-rate alerts
- [ ] Runbook linkeado desde cada alerta
