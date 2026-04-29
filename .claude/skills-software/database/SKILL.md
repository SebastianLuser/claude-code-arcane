---
name: database
description: "Schema design, migrations y data operations para Postgres + Prisma/GORM. Setup, indexing, queries, seeds, backups."
category: "database"
argument-hint: "[setup|schema|migrations|operations|full]"
user-invocable: true
allowed-tools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep"]
metadata:
  version: "2.0"
  category: backend
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

## 5. Query Patterns, Seed Data & Backup
→ Read `references/query-patterns.md` for: N+1 fixes, pagination, bulk ops, seed strategies, backup/recovery.

## Anti-patterns
→ Read `references/anti-patterns.md` for the full 16-item checklist.

## Checklist
- [ ] Docker Compose + `.env.example` with `DATABASE_URL`
- [ ] One change per migration, DDL/data separated, expand-contract for breaking changes
- [ ] `lock_timeout` + `statement_timeout` on ALTER; `CONCURRENTLY` for prod indexes
- [ ] CI: `up -> down -> up` passes
- [ ] FK children indexed; composite order: equality -> range -> ORDER BY
- [ ] EXPLAIN ANALYZE before/after query changes; N+1 eliminated; cursor pagination
- [ ] Seeds idempotent, prod-guarded, no real PII, reference data separated
- [ ] Backup restores tested; RTO/RPO documented
