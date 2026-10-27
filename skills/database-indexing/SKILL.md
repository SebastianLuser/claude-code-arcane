---
name: database-indexing
description: "PostgreSQL indexing: B-tree, GIN, GiST, composite, partial, covering, CONCURRENTLY, bloat detection."
category: "database"
argument-hint: "[analyze|create|drop] [table]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
metadata:
  stack: PostgreSQL 15+
---
# Database Indexing (PostgreSQL)

Design, create and maintain indexes in Postgres 15+ in Educabot's multi-tenant context.

## When to use / NOT use

| Use | Do NOT use |
|------|---------|
| Slow queries with Seq Scan on large tables | Tables <10k rows (Seq Scan usually wins) |
| New schema: plan the indexes | Low-cardinality booleans/enums (use partial) |
| Periodic review: missing/unused | High writes, few reads |
| Bloat, REINDEX needed | Full-text search → `/search-setup` |
| Multi-tenant: `tenant_id` as first composite column | One slow query → `/query-optimization` |

## Index types

B-tree (default, 95% of cases), GIN (arrays/jsonb/tsvector), GiST (geo/ranges), BRIN (huge ordered tables), Partial (filter in the definition), Covering/INCLUDE, Expression.

> → Read references/index-types.md for detailed type comparison table and JSONB indexing guide

## When to create

- `WHERE` with high selectivity (>100 rows returned dilutes the benefit)
- `JOIN` (especially FKs)
- Frequent `ORDER BY` / `GROUP BY`
- `UNIQUE` constraints
- Rule: a frequent query that scans thousands to return a few → index it

## Composite indexes

An index on `(a, b, c)` serves `a`, `a,b`, `a,b,c` — NOT `b`, `c`, or `b,c` alone (leftmost prefix).

**Column order:** equality first (`tenant_id =`) → range next (`created_at >`) → `ORDER BY` last.

## CONCURRENTLY in production

**Mandatory** on large tables: it does not block writes. It cannot run inside a transaction — put it in its own migration. If it fails it leaves an `INVALID` index → detect it with `pg_index WHERE NOT indisvalid` → `DROP INDEX CONCURRENTLY`.

## Detect missing ones

Query `pg_stat_user_tables` where `seq_scan > idx_scan AND n_live_tup > 10000`. Then review real queries with `pg_stat_statements`.

## Detect unused ones

Query `pg_stat_user_indexes` where `idx_scan = 0` after **1 month** of observation. `DROP INDEX CONCURRENTLY`. Exception: unique indexes backing constraints.

## Foreign keys

Postgres does **not** automatically index FK columns. Without an index, every DELETE/UPDATE on the parent does a seq scan of the child. Always index the child FK.

## EXPLAIN after creation

Verify with `EXPLAIN (ANALYZE, BUFFERS)`. Expected plans: Index Scan, Index Only Scan (ideal), Bitmap Heap Scan. If Seq Scan → the index is not used. See `/query-optimization`.

## Bloat and REINDEX

B-tree bloats with updates/deletes. Monitor with `pgstattuple`. Repair: `REINDEX INDEX CONCURRENTLY` or `pg_repack`. Schedule quarterly for hot indexes.

## Educabot multi-tenant

Every composite index must start with `tenant_id` so RLS and filtered queries can use it. Pattern: `(tenant_id, student_id, period_id)`.

## Anti-patterns

> → Read references/anti-patterns.md for 12 common indexing anti-patterns

## Checklist

> → Read references/checklists.md for pre-creation checklist (11 items) and periodic maintenance checklist (5 items)

## Delegation

- `/query-optimization` — analysis of a single slow query
- `/search-setup` — full-text search (tsvector, GIN)
- `/data-migrations` — zero-downtime migrations, CONCURRENTLY separation
- `/db-diagram` — diagram the schema
