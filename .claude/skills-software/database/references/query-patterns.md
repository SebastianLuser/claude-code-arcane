# Query Patterns & Optimization

Always start with `EXPLAIN (ANALYZE, BUFFERS)`. Check `pg_stat_statements` for slow queries.

| Problem | Fix | Skip when |
|---------|-----|-----------|
| N+1 | Prisma `include` / JOIN / DataLoader | Relation rarely accessed |
| SELECT * | Prisma `select` with needed columns | Few-column small tables |
| OFFSET pagination | Cursor keyset (`WHERE id > $last LIMIT N`) | <1k rows or admin panels |
| COUNT(*) on lists | Cache, approximate `reltuples`, or remove | Exact count required by business |
| Correlated subquery | JOIN or LATERAL | Scalar returning 1 row |

Materialized views for stale-tolerant dashboards (CONCURRENTLY refresh, needs unique index). Multi-tenant: `tenant_id` first in every composite index; RLS as defense in depth.

## Bulk Operations

Batch inserts via `createMany` or `COPY FROM` (10k+). Upserts always idempotent (`ON CONFLICT DO UPDATE`). Transactions via `$transaction([])`, keep short. Large backfills: batched with checkpoint/resume, disable triggers/indexes then rebuild.

## Seed Data

| Type | Envs | In migrations? |
|------|------|----------------|
| Reference (roles, countries) | All incl. prod | Yes |
| Dev fixtures | Local | No |
| Test fixtures | CI | No |
| Demo | Staging | No |

Idempotent upserts. Factory + faker (`faker.seed(42)` for determinism). Top-down creation order. Block on `APP_ENV=production`. No real PII. Anonymize prod dumps for staging.

## Backup & Recovery

PITR via WAL archiving (managed DBs handle it). `pg_dump` for portability, physical for speed. Test restores quarterly. Document RTO/RPO per service.
