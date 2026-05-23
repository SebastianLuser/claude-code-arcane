# Anti-patterns - Data Operations

## Queries

- Optimizar sin EXPLAIN
- SELECT * en queries calientes
- OFFSET tablas grandes
- N+1 no detectado
- COUNT(*) sin cache

## Seeding

- Seeds en produccion (falta guardrail)
- No idempotentes
- PII real en fixtures
- Dump prod sin anonimizar
- IDs hardcodeados
