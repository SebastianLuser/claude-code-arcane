# Anti-patterns - Data Operations

## Queries

- Optimizing without EXPLAIN
- SELECT * in hot queries
- OFFSET on large tables
- Undetected N+1
- COUNT(*) without a cache

## Seeding

- Seeds in production (missing guardrail)
- Not idempotent
- Real PII in fixtures
- Prod dump without anonymization
- Hardcoded IDs
