---
name: data-operations
description: "Query optimization y data seeding Postgres: EXPLAIN ANALYZE, N+1, cursor pagination, CTEs, factories, fixtures."
category: "database"
argument-hint: "[optimize <query>|seed <env>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# data-operations — Query Optimization & Seeding

## Route

| Intención del usuario | Modo | Sección |
|----------------------|------|---------|
| "query lenta", "EXPLAIN", "N+1", "optimizar SQL", "OFFSET", "índice" | OPTIMIZE | → Sección 1: Query Optimization |
| "seed", "fixtures", "datos demo", "faker", "factory", "test data", "anonimizar" | SEED | → Sección 2: Data Seeding |

**Regla:** si la intención es ambigua, preguntar antes de ejecutar.

---

## Cuándo usar

Diagnosticar/optimizar queries lentas, crear seeders dev/test/staging, anonimizar dumps prod.

## 1. Query Optimization

### EXPLAIN primero

Siempre: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) <query>;`. Visualizar planes complejos: explain.dalibo.com. Top queries: `pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20`.

> → Read references/query-optimization.md for EXPLAIN signal table, common problems (N+1, SELECT *, OFFSET, etc.), CTEs, LATERAL joins, and materialized views

## 2. Data Seeding

4 tipos: Reference (all envs), Dev fixtures (local), Test fixtures (CI), Demo (staging). Structure: `db/seeds/` with reference/, fixtures/, demo/, anonymize/. Key rules: upserts for idempotency, factory pattern, guardrail anti-prod (`APP_ENV != "production"`).

> → Read references/seeding.md for seeding types, structure, factory patterns, performance tips, and anonymization guide

## Anti-patterns

> → Read references/anti-patterns.md for query (5 items) and seeding (5 items) anti-patterns

## Checklist

### Query optimization
- [ ] EXPLAIN ANALYZE antes y después
- [ ] pg_stat_statements top queries revisado
- [ ] N+1 eliminados (JOIN/Preload/DataLoader)
- [ ] Paginación cursor, no OFFSET
- [ ] Índices validados → `/database-setup`

### Seeding
- [ ] Reference data separado de fixtures
- [ ] Upserts idempotentes
- [ ] Guardrail anti-prod
- [ ] Sin PII real en fixtures
- [ ] Factory pattern para datos random
- [ ] faker.seed() para tests determinísticos
