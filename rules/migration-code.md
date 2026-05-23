---
paths:
  - "migrations/**"
  - "db/migrations/**"
  - "prisma/migrations/**"
  - "alembic/versions/**"
  - "**/migrate/**"
  - "**/migrations/**"
---

# Database Migration Rules

- Migrations are **immutable once merged to main**. To fix a bad migration, write a new one — never edit history. Editing a shipped migration breaks every environment that already ran it.
- Every migration has a matching **rollback** (down) script or is explicitly marked `irreversible` with a comment explaining why.
- Migrations are **idempotent where possible**: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`. Never assume clean state.
- Naming: timestamp-prefixed, snake_case, imperative verb: `20260416_143022_add_email_to_users.sql`. Timestamp sorts chronologically.
- One logical change per migration. Don't bundle "add users table + add posts table + backfill data" — three migrations.
- **Online schema changes only** for production tables >100k rows:
  - No `ALTER TABLE ... ADD COLUMN NOT NULL DEFAULT X` on large tables (locks). Instead: add nullable → backfill in batches → add constraint in a separate migration.
  - No blocking index creation — use `CREATE INDEX CONCURRENTLY` (Postgres) / equivalent.
  - No renaming columns in-place — add new, dual-write, backfill, cut over, drop old. Minimum 3 deploys.
- **Backfills live in their own migration**, not mixed with schema changes. Batched, resumable, idempotent. Log progress.
- Test migrations on a **production-sized snapshot** before merging if the table is large. Measure lock time and write it in the PR description.
- Never `DROP TABLE` / `DROP COLUMN` in the same deploy that removes its last usage in code. Sequence: ship code that stops using → verify zero reads for N days → drop in a later migration.
- Secrets / seed data / PII **never** in a migration file committed to git. Use environment-specific seed scripts.
- Migrations run automatically on deploy. If a migration is too risky to run unattended (multi-hour lock, destructive), mark it `manual` and include the runbook in the PR.

## Required PR Checklist for Migrations Touching Production Tables

- [ ] Up script tested on prod-sized snapshot — lock time recorded
- [ ] Down script tested (or `irreversible` marked with justification)
- [ ] Backfill (if any) is batched and resumable
- [ ] Rollback plan written if migration fails mid-run
- [ ] DBA / senior reviewer signed off if table is >1M rows or critical path

## Anti-Patterns

- Using the ORM's "auto-generate migration" on a shared dev DB and committing the diff without reading it
- `DELETE FROM users WHERE ...` in a migration without a backup and written-out rollback
- Migration that depends on application code (calling service layer) — migrations run with DB access only, not app code
- Migrations that only work if previous migration left specific data — be defensive, check before mutating
