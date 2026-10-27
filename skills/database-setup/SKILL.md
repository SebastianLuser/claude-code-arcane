---
name: database-setup
description: "PostgreSQL setup: migrations, indexing, schema design, expand-contract, ER diagrams. golang-migrate/Prisma/drizzle."
category: "database"
argument-hint: "[setup|migrate|index|diagram] [table]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# database-setup — Migrations, Indexing & Schema

## When to use

Local DB setup (Docker+migrations), create/run/roll back migrations, design/audit indexes, generate an ER diagram, schema changes in production.

## 1. Migrations

### Tool

| Stack | Tool | Notes |
|-------|------|-------|
| Go | `golang-migrate/migrate` | CLI + library, plain SQL |
| TS + Prisma | `prisma migrate` | Integrated with the ORM |
| TS + Drizzle | `drizzle-kit` | SQL-like, type-safe |
| TS without ORM | `node-pg-migrate` | Plain SQL |

Do not mix tools in the same repo.

### Naming

`YYYYMMDDHHMMSS_description.up.sql` + `.down.sql`. UTC timestamp, snake_case, verb first. Never edit an already merged migration.

### Zero-downtime: expand-contract

| Phase | What | Release |
|------|-----|---------|
| Expand | NULLABLE/DEFAULT column, new table, index CONCURRENTLY | N |
| Backfill | Async job, idempotent, batched ~10k, checkpointed | N |
| Dual-write | App writes old AND new | N+1 |
| Migrate reads | Reads point to the new one | N+2 |
| Contract | DROP the old one after validating (≥1 stable release) | N+3 |

DDL and data ALWAYS separate. Mixing them causes long locks and impossible rollbacks.

### Locks

`SET lock_timeout = '5s'; SET statement_timeout = '30s';` before ALTER. ADD COLUMN with a non-volatile DEFAULT is instant since PG 11. Existing NOT NULL: ADD CHECK NOT VALID → VALIDATE in a separate migration.

### Rollback

| Change | Rollback |
|--------|----------|
| Additive DDL (ADD/CREATE) | Reversible with DROP |
| Destructive DDL (DROP, lossy ALTER TYPE) | One-way, document it |
| Lossy data transformation | One-way |

Always a `.down.sql`, even if it is an empty documented one. CI: `up → down → up`.

## 2. Indexing

Types: B-tree (95% — equality/range/sort), GIN (arrays/jsonb/tsvector), GiST (geo/ranges), BRIN (huge ordered tables).

**Key rules:** Composite order = equality → range → ORDER BY. Child FK always indexed (PG does not do it automatically). `CREATE INDEX CONCURRENTLY` mandatory in prod. If the index ends up INVALID → DROP and recreate.

> For the full guide (types, partial/covering/expression variants, CONCURRENTLY, JSONB, detection queries), read `references/indexing-guide.md`.

## 3. Multi-tenant

`tenant_id` as the first column in every composite. RLS as defense in depth. Backfills must consider every tenant_id. Schema-per-tenant: iterate the list, track partial progress.

## 4. ER Diagram

Scan SQL migrations / ORM models → generate a Mermaid erDiagram. >20 tables: group by domain. Mark nullable, PK, FK. Relationships: `||--o{` (1:N), `||--||` (1:1), `}o--o{` (N:M).

## Anti-patterns

- DDL + data in the same file
- DROP COLUMN without a grace period
- CREATE INDEX without CONCURRENTLY in prod
- Editing a merged migration
- ADD COLUMN NOT NULL with a volatile DEFAULT
- Wrong composite order
- Indexing a low-cardinality column alone (boolean)
- Not indexing the child FK
- Never running REINDEX

## Checklist

### Setup
- [ ] Docker Compose or documented local setup script
- [ ] .env.example with DATABASE_URL

### Migrations
- [ ] YYYYMMDDHHMMSS naming, one logical change per migration
- [ ] DDL and data separate
- [ ] .down.sql exists or one-way is documented
- [ ] lock_timeout + statement_timeout on ALTER
- [ ] CI: up → down → up
- [ ] Breaking: expand-contract plan documented

### Indexing
- [ ] Concrete query, EXPLAIN shows a Seq Scan
- [ ] Correct index type
- [ ] Composite: equality → range → ORDER BY
- [ ] CONCURRENTLY outside a transaction
- [ ] FKs with an index on the child
- [ ] After creation: EXPLAIN ANALYZE confirms the plan

### ER
- [ ] Diagram updated after a schema change
