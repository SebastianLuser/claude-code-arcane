# Checklist

- [ ] slog/pino JSON en prod, level configurable via env
- [ ] Base fields: service, env, version
- [ ] Request-scoped: trace_id, request_id, user_id, tenant_id
- [ ] PII scrubber activo
- [ ] Severity mapeada al provider
- [ ] Sampling en hot paths, healthchecks excluidos
- [ ] Audit logs separados con retention >= 1 ano
- [ ] Access logs con latency
- [ ] Retention policy por tipo
- [ ] Log-based alerts configurados
- [ ] Tests validan estructura (keys, level)
- [ ] Cost review mensual
