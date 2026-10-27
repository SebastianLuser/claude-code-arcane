# Anti-patterns

- `console.log` in prod (no structure/level), printf-style interpolation, multi-line logs
- Everything at INFO (drowned signal), no correlation_id, PII in logs
- Logs as a substitute for metrics, infinite retention, healthcheck spam
- `JSON.stringify(bigObject)` on a hot path, `logger.error(err)` without context
- Global logger instantiated on every call, sync shipping (blocks the handler)
