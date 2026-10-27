---
name: query-optimization
description: "SQL query optimization on PostgreSQL 15+. EXPLAIN ANALYZE, pg_stat_statements, N+1, pagination, indexes, CTEs, LATERAL joins. Educabot Go+TS stack."
category: "database"
argument-hint: "[path-to-sql-or-migration, or query]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# Query Optimization (PostgreSQL)

**Rule:** without EXPLAIN ANALYZE, there is no optimization. Every change is validated against the real plan.

## EXPLAIN ANALYZE — What to look for

| Signal | Problem | Action |
|-------|----------|--------|
| `Seq Scan` on a large table | Missing index | Create a composite index |
| `Nested Loop` with many inner rows | Bad join plan | Index on the join column |
| Estimated vs actual `rows=` >10x | Stale statistics | `ANALYZE my_table;` |
| `Buffers: read >> hit` | Working set > shared_buffers | Missing index |
| High `Rows Removed by Filter: N` | Post-scan filter | Partial index or rewrite |

Tools: `pg_stat_statements` (top queries), Cloud SQL Query Insights, `auto_explain`, pgbadger.

## Common Patterns and Fixes

### N+1

ORM loop → batch with `WHERE course_id = ANY($1::bigint[])`. TS/Prisma: `include: {}` or DataLoader.

### SELECT *

Breaks index-only scans, more I/O. Always explicit columns.

### Large OFFSET (pagination)

`OFFSET 100000` = scan and discard 100k rows. Use **keyset pagination**:
`WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 20`

### Exact COUNT(*) on large tables

Alternative: `reltuples` from `pg_class` for an estimate. Or a covering index.

### LIKE '%foo%'

B-tree does not help. Use `pg_trgm` + GIN for substrings, or `tsvector` for full-text.

### Functions in WHERE

`WHERE date(created_at) = '...'` does not use the index. Use a range: `WHERE created_at >= X AND created_at < Y`

### OR across different columns

Rewrite as `UNION ALL`.

### Correlated subqueries

Rewrite as `JOIN + GROUP BY`.

## Join Planning

- Postgres reorders joins up to 8 tables (`join_collapse_limit`). Beyond that, the written order wins
- CTEs: `MATERIALIZED` = barrier (runs once), `NOT MATERIALIZED` = inline
- `LATERAL` join for top N per group (e.g. last 3 grades per student)
- Parallel query: check for `Gather` in EXPLAIN. If it does not appear → VOLATILE functions or config

## Statistics

- `ANALYZE tablename;` after bulk loads. Autovacuum is usually enough
- Multi-column statistics for correlated columns: `CREATE STATISTICS stx ON col1, col2 FROM my_table;`

## Materialized Views

For heavy, non-realtime aggregate reports. `REFRESH CONCURRENTLY` requires a unique index.

## Connection Pooling

- Go: `pgxpool` (size: `num_cpus * 2` to `4`). TS: `pg.Pool` or Prisma
- Many short connections → PgBouncer transaction mode
- More connections ≠ more throughput

## Multi-tenant

- Always filter by `tenant_id` first
- Composite indexes starting with `tenant_id`: `(tenant_id, course_id)`
- RLS as a safety net

## Anti-patterns

- Optimizing without EXPLAIN ANALYZE, adding an index without verifying the plan changed
- ORM `findAll()` + filtering in memory, `SELECT *`, large OFFSET
- Exact `COUNT(*)` when the UI only needs "more than 10k"
- Invisible N+1, no `ANALYZE` after a bulk load, not monitoring `pg_stat_statements`
- Untuned pool, functions over indexed columns, queries without `tenant_id`

## Checklist

- [ ] EXPLAIN ANALYZE baseline captured
- [ ] Problematic nodes identified (Seq Scan, Nested Loop, Rows Removed)
- [ ] Estimated vs actual rows checked (>10x → ANALYZE)
- [ ] Index designed (composite, partial, covering, functional)
- [ ] Anti-patterns rewritten (SELECT *, OFFSET, N+1, correlated subquery)
- [ ] New EXPLAIN ANALYZE validated — the plan changed as expected
- [ ] Improvement measured in ms
- [ ] Other queries not broken
- [ ] Critical query added to observability
- [ ] PR documented: query before/after, plan, impact
