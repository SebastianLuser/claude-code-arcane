# Checklist

- [ ] slog/pino JSON in prod, level configurable via env
- [ ] Base fields: service, env, version
- [ ] Request-scoped: trace_id, request_id, user_id, tenant_id
- [ ] PII scrubber active
- [ ] Severity mapped to the provider
- [ ] Sampling on hot paths, healthchecks excluded
- [ ] Separate audit logs with retention >= 1 year
- [ ] Access logs with latency
- [ ] Retention policy per type
- [ ] Log-based alerts configured
- [ ] Tests validate structure (keys, level)
- [ ] Monthly cost review
