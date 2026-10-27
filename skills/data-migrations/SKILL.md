---
name: data-migrations
description: "Postgres DB migrations: DDL/DML, zero-downtime expand-contract, rollbacks, locks, CONCURRENTLY, batching, multi-tenant."
category: "database"
argument-hint: "[create <name>|run|rollback]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Data Migrations — Educabot

## Route

| User intent | Mode | What it does |
|----------------------|------|----------|
| "new migration", "add column", "create table", "rename" | CREATE | Generates `.up.sql` + `.down.sql` files with correct naming |
| "run migrations", "apply", "migrate up", "deploy migration" | RUN | Validates staging → runs → confirms state |
| "revert", "rollback", "undo migration", "migrate down" | ROLLBACK | Verifies `.down.sql`, assesses risk, runs with a prior backup |
| "which migrations exist", "status", "pending", "applied" | STATUS | `migrate version` + list of pending vs applied |

**Rule:** if the intent combines CREATE + RUN, do them in that order. If it is a destructive ROLLBACK, ask for explicit confirmation.

---

DB migrations without breaking production. Stack: **Postgres** with **golang-migrate** (Go) or **Prisma Migrate** (TS).

## When to use / NOT use

| Use | Do NOT use |
|------|---------|
| Schema: CREATE/ALTER TABLE, ADD COLUMN, indexes | Test data seeds (use fixtures) |
| Data: backfills, transformations, normalizations | Trivial local-dev lookup tables |
| Rename/drop columns or tables in prod | One-shot manual cleanup scripts (use a job) |
| ALTER TYPE, split/merge tables, multi-tenant | App config changes (env/config) |

## Tools

| Stack | Tool | Files |
|-------|------|----------|
| **Go** (default) | `golang-migrate/migrate` | `migrations/NNNNNNNNNNNNNN_name.up.sql` + `.down.sql` |
| **TS (Prisma)** | Prisma Migrate | If it uses Prisma as the ORM |
| **TS (plain pg)** | `node-pg-migrate` | If it uses pg without an ORM |
| **TS (Drizzle)** | `drizzle-kit` | If the stack is Drizzle |

Align the tool with the chosen ORM. Do not mix two systems in the same repo.

## Naming

Format: `YYYYMMDDHHMMSS_description.up.sql` + `.down.sql`. UTC timestamp (not sequential). Description in snake_case with a verb (`add_`, `create_`, `drop_`, `alter_`, `backfill_`). One migration = one atomic logical change. Never edit a migration already merged to main.

## Zero-downtime: expand-contract

Every breaking change is split across multiple releases (expand → backfill → dual-write → migrate reads → contract).

> → Read references/expand-contract.md for detailed phases and multi-step breaking changes

## Indexes

- **Always** `CREATE INDEX CONCURRENTLY` on tables with data (does not block writes)
- It cannot run inside a transaction — use `-- +migrate NoTransaction` (golang-migrate) or `--create-only` + edit the SQL (Prisma)
- If it fails: it is left INVALID → DROP INDEX → retry

## Locks and timeouts

`ALTER TABLE` takes an ACCESS EXCLUSIVE LOCK. Safe pattern: `SET lock_timeout = '5s'; SET statement_timeout = '30s';` before the ALTER. If it cannot get the lock → fail fast → retry with backoff. `ADD COLUMN` with a non-volatile DEFAULT is instant since PG 11. `ADD COLUMN NOT NULL DEFAULT <volatile>` rewrites the table — avoid it.

## Batching (large data migrations)

Keyset pagination (`id > last_id`), 10k batches, checkpoints, idempotent, separate job.

> → Read references/batching.md for the full batching rules

## Rollback

- Additive DDL (ADD/CREATE) → reversible with DROP
- Destructive DDL (DROP) → one-way, data lost
- Lossy data migration → one-way
- **Always** write `.down.sql` (even if it is a documented NO-OP)
- Critical one-way migrations: a prior backup is mandatory

## Staging and CI

- Staging = anonymized subset of prod. Run every migration there before prod. Measure the time.
- CI (mandatory on PRs): `up` from clean → `down` → `up` again (validates reversibility + idempotency). SQL lint if configured.

## Multi-tenant

| Pattern | How | When |
|--------|------|--------|
| **Shared schema** (Educabot default) | One global migration, backfills cover every tenant_id | Standard SaaS |
| **Schema-per-tenant** | The runner iterates tenants, tracks partial failure | Medium isolation |
| **Database-per-tenant** | Maximum isolation | Enterprise compliance only |

## Anti-patterns

> → Read references/anti-patterns.md for the full list (12 items)

## Delegation

- `/db-diagram` — post-migration ER diagram
- `/deploy-check` — deploy checklist with a migration
- `/audit-dev` — full review of accumulated migrations
- `/scaffold-go` — golang-migrate setup in a new project

## Checklist

> → Read references/checklist.md for the full checklist (12 items)

- [ ] Expand-contract pattern used for all breaking schema changes
- [ ] Both `.up.sql` and `.down.sql` files exist for every migration
- [ ] `lock_timeout` and `statement_timeout` configured before ALTER statements
- [ ] Migration tested and timed in staging with production-like data
- [ ] Rollback verified by running `.down.sql` then `.up.sql` again
- [ ] Indexes created with `CONCURRENTLY` outside transactions on populated tables
