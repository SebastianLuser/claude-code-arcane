---
name: database
description: "Database setup, schema design, migrations, and data operations for backend TS projects. DO NOT TRIGGER when: query puntual sin contexto de schema completo (usar data-operations), troubleshooting de conexión a DB existente."
argument-hint: "[setup|schema|migrations|operations|full]"
user-invocable: true
allowed-tools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep"]
---
# database — Schema, Migrations & Data Operations

## Route

| Intención del usuario | Modo | Secciones relevantes |
|----------------------|------|---------------------|
| "diseñar schema", "nueva tabla", "relación", "índice" | SCHEMA | → 2. Schema Design, 3. Migrations |
| "query lenta", "EXPLAIN", "N+1", "optimizar" | QUERY | → 5. Query Patterns |
| "migration", "ALTER TABLE", "expand-contract", "rollback" | MIGRATION | → 3. Migrations |
| "sin datos", "seed", "fixtures", "datos demo" | SEED | → 7. Seed Data |
| "conexiones", "pool", "timeout", "PgBouncer" | CONNECTIONS | → 4. Connection Management |
| "backup", "restore", "recovery", "PITR" | OPS | → 8. Backup & Recovery |

**Regla:** si el argumento es `full`, ejecutar Checklist completo. Si la intención es ambigua, preguntar.

---

Stack: Fastify + Prisma + PostgreSQL + Zod + TypeScript

## 1. ORM Choice
Default **Prisma** (type-safe, declarative schema, built-in migrations). Consider Drizzle for SQL-like type-safe syntax, `node-pg-migrate` + `pg` for raw SQL control, `golang-migrate` for Go codebases. Never mix migration tools in one repo.

## 2. Schema Design
**Naming:** snake_case tables/columns, PascalCase Prisma models, singular names.

| Criteria | Rule |
|----------|------|
| PKs | UUID or CUID; avoid auto-increment if distributed |
| FKs | Always explicit, always indexed on child side |
| Timestamps | `created_at` + `updated_at` on every table |
| Soft delete | `deleted_at NULL` + partial index on non-nulls |
| Enums | Prisma `enum` for fixed sets; string if values change often |
| Relations | Explicit join tables for M:N; no circular FK deps |
| Composites | Equality first, range second, ORDER BY last |
| Nullability | NOT NULL by default; nullable only for meaningful absence |

**Index types:** B-tree (95% — equality/range/sort), GIN (arrays/jsonb/tsvector), GiST (geo/ranges), BRIN (huge ordered tables). Use partial indexes to reduce size, covering indexes (INCLUDE) to avoid heap access, expression indexes when WHERE has functions.

## 3. Migrations
Forward-only default. `.down.sql` for reversible DDL; document one-way explicitly. Name: `YYYYMMDDHHMMSS_verb_desc`. Never edit merged migrations.

**Rules:** One change per migration. DDL and data backfills always separate (mixing = long locks). Set `lock_timeout` + `statement_timeout` on ALTER TABLE. `CREATE INDEX CONCURRENTLY` on live tables (outside transaction). `ADD COLUMN` with non-volatile DEFAULT instant on PG 11+. Adding NOT NULL: CHECK NOT VALID then VALIDATE in separate migration.

**Zero-downtime expand-contract:** Expand (nullable col/new table/concurrent idx, release N) -> Backfill (async idempotent batched ~10k, N) -> Dual-write (N+1) -> Migrate reads (N+2) -> Contract DROP (N+3, after 1+ stable release). CI: `up -> down -> up` must pass.

## 4. Connection Management
Pool size: `max(2, cores*2)` per instance, never exceed total `max_connections`. Connection timeout 5s, statement timeout 30s. Health check via `SELECT 1` in health endpoint. PgBouncer transaction-mode for serverless/high-connection loads.

## 5. Query Patterns
Always start with `EXPLAIN (ANALYZE, BUFFERS)`. Check `pg_stat_statements` for slow queries.

| Problem | Fix | Skip when |
|---------|-----|-----------|
| N+1 | Prisma `include` / JOIN / DataLoader | Relation rarely accessed |
| SELECT * | Prisma `select` with needed columns | Few-column small tables |
| OFFSET pagination | Cursor keyset (`WHERE id > $last LIMIT N`) | <1k rows or admin panels |
| COUNT(*) on lists | Cache, approximate `reltuples`, or remove | Exact count required by business |
| Correlated subquery | JOIN or LATERAL | Scalar returning 1 row |

Materialized views for stale-tolerant dashboards (CONCURRENTLY refresh, needs unique index). Multi-tenant: `tenant_id` first in every composite index; RLS as defense in depth.

## 6. Bulk Operations
Batch inserts via `createMany` or `COPY FROM` (10k+). Upserts always idempotent (`ON CONFLICT DO UPDATE`). Transactions via `$transaction([])`, keep short. Large backfills: batched with checkpoint/resume, disable triggers/indexes then rebuild.

## 7. Seed Data

| Type | Envs | In migrations? |
|------|------|----------------|
| Reference (roles, countries) | All incl. prod | Yes |
| Dev fixtures | Local | No |
| Test fixtures | CI | No |
| Demo | Staging | No |

Idempotent upserts. Factory + faker (`faker.seed(42)` for determinism). Top-down creation order. Block on `APP_ENV=production`. No real PII. Anonymize prod dumps for staging.

## 8. Backup & Recovery
PITR via WAL archiving (managed DBs handle it). `pg_dump` for portability, physical for speed. Test restores quarterly. Document RTO/RPO per service.

## 9. Anti-patterns

| # | ❌ No hacer | ✅ Hacer en cambio |
|---|------------|-------------------|
| 1 | FKs sin índice en la tabla hija | Indexar siempre la columna FK del lado hijo |
| 2 | Relaciones circulares en schema | Romper ciclos con tabla de join intermedia |
| 3 | God tables (50+ columnas) | Separar en entidades con relación explícita |
| 4 | DDL y backfill de datos en la misma migration | Una migration = un cambio; backfill en archivo separado |
| 5 | Editar migrations ya mergeadas | Siempre nueva migration hacia adelante |
| 6 | DROP sin grace period | expand-contract: deprecar → migrar → DROP en release N+3 |
| 7 | `CREATE INDEX` sin CONCURRENTLY en prod | `CREATE INDEX CONCURRENTLY` fuera de transacción |
| 8 | N+1 sin detectar | Prisma `include` / JOIN / DataLoader |
| 9 | `SELECT *` en hot paths | `select` con columnas específicas |
| 10 | OFFSET pagination en tablas grandes | Cursor keyset (`WHERE id > $last LIMIT N`) |
| 11 | Queries sin `EXPLAIN ANALYZE` | Validar plan antes y después de cada cambio |
| 12 | Raw SQL con interpolación de strings | Siempre prepared statements / parámetros |
| 13 | Sin pool limits ni timeouts | `max(2, cores*2)` pool; timeout 5s connect / 30s statement |
| 14 | Seeds ejecutables en prod | Guard explícito `if APP_ENV == production: exit` |
| 15 | Seeds no idempotentes | Upsert con ON CONFLICT, nunca INSERT ciego |
| 16 | Backups sin restauración probada | Test de restore trimestral documentado |

## 10. Checklist
- [ ] Docker Compose + `.env.example` with `DATABASE_URL`
- [ ] One change per migration, DDL/data separated, expand-contract for breaking changes
- [ ] `lock_timeout` + `statement_timeout` on ALTER; `CONCURRENTLY` for prod indexes
- [ ] CI: `up -> down -> up` passes
- [ ] FK children indexed; composite order: equality -> range -> ORDER BY
- [ ] EXPLAIN ANALYZE before/after query changes; N+1 eliminated; cursor pagination
- [ ] Seeds idempotent, prod-guarded, no real PII, reference data separated
- [ ] Backup restores tested; RTO/RPO documented
