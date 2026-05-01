# Anti-patterns

- `console.log` en prod (sin estructura/level), printf-style interpolation, multi-line logs
- Todo a INFO (senal ahogada), sin correlation_id, PII en logs
- Logs como sustituto de metricas, retention infinita, healthcheck spam
- `JSON.stringify(bigObject)` en hot path, `logger.error(err)` sin contexto
- Logger global instanciado en cada call, shipping sync (bloquea handler)
