---
name: data-operations
description: "Postgres query optimization and data seeding: EXPLAIN ANALYZE, N+1, cursor pagination, CTEs, factories, fixtures."
category: "database"
argument-hint: "[optimize <query>|seed <env>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# data-operations — Query Optimization & Seeding

## Route

| User intent | Mode | Section |
|----------------------|------|---------|
| "slow query", "EXPLAIN", "N+1", "optimize SQL", "OFFSET", "index" | OPTIMIZE | → Section 1: Query Optimization |
| "seed", "fixtures", "demo data", "faker", "factory", "test data", "anonymize" | SEED | → Section 2: Data Seeding |

**Rule:** if the intent is ambiguous, ask before running anything.

---

## When to use

Diagnose/optimize slow queries, create dev/test/staging seeders, anonymize prod dumps.

## 1. Query Optimization

### EXPLAIN first

Always: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) <query>;`. Visualize complex plans: explain.dalibo.com. Top queries: `pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20`.

> → Read references/query-optimization.md for EXPLAIN signal table, common problems (N+1, SELECT *, OFFSET, etc.), CTEs, LATERAL joins, and materialized views

## 2. Data Seeding

4 types: Reference (all envs), Dev fixtures (local), Test fixtures (CI), Demo (staging). Structure: `db/seeds/` with reference/, fixtures/, demo/, anonymize/. Key rules: upserts for idempotency, factory pattern, anti-prod guardrail (`APP_ENV != "production"`).

> → Read references/seeding.md for seeding types, structure, factory patterns, performance tips, and anonymization guide

## Anti-patterns

> → Read references/anti-patterns.md for query (5 items) and seeding (5 items) anti-patterns

## Checklist

### Query optimization
- [ ] EXPLAIN ANALYZE before and after
- [ ] pg_stat_statements top queries reviewed
- [ ] N+1 removed (JOIN/Preload/DataLoader)
- [ ] Cursor pagination, not OFFSET
- [ ] Indexes validated → `/database-setup`

### Seeding
- [ ] Reference data separate from fixtures
- [ ] Idempotent upserts
- [ ] Anti-prod guardrail
- [ ] No real PII in fixtures
- [ ] Factory pattern for random data
- [ ] faker.seed() for deterministic tests
