# Query Optimization Details - Data Operations

## EXPLAIN Signal Reference

| Signal in plan | Means | Action |
|---------------|-----------|--------|
| Seq Scan on a large table | Missing index | Create index -> `/database-setup` |
| estimated vs actual rows >10x | Stale stats | `ANALYZE table;` |
| High Buffers shared read | Working set > shared_buffers | Tune config or shrink the result |
| Large Rows Removed by Filter | Index does not filter enough | Partial or covering index |
| Sort external merge | Sort does not fit in work_mem | Raise work_mem or index the ORDER BY |

Top slow queries: `pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20`. Cloud managed: Query Insights / Performance Insights.

## Common Problems

| Problem | Fix | Exception |
|----------|-----|-----------|
| **N+1** | JOIN, subquery, DataLoader/Preload | Relation rarely accessed |
| **SELECT \*** | Only the columns you need | Small tables with few columns |
| **OFFSET pagination** | Keyset cursor: `WHERE id > $last ORDER BY id LIMIT N` | Tables <1k or admin panels |
| **COUNT(\*)** in listings | Cache, approximate (`reltuples`), remove | Exact count is a business requirement |
| **OR across different columns** | UNION ALL of indexed queries | Few rows |
| **Function in WHERE** | Expression index | Function already indexed |
| **Correlated subquery** | Rewrite as JOIN or LATERAL | Scalar subquery OK |

## CTEs

`WITH x AS MATERIALIZED (...)` forces separate execution — useful when PG inlines the CTE and loses a filter. Since PG 12 the optimizer decides automatically; force it only if EXPLAIN shows a worse plan.

## LATERAL Joins (top-N per group)

`CROSS JOIN LATERAL (SELECT ... WHERE fk = parent.id ORDER BY col DESC LIMIT N)`. Requires an index on `(fk, col DESC)`.

## Materialized Views

`CREATE MATERIALIZED VIEW` + unique index -> `REFRESH CONCURRENTLY` (does not block reads). Refresh via cron or trigger depending on staleness tolerance. Do not use if the data needs to be real-time.
