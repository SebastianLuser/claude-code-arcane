---
name: run-migrations
description: "Quick-reference para golang-migrate: crea migration up/down, corre pending, rollback last. Para schema design, zero-downtime, multi-tenant ver /data-migrations."
argument-hint: "[create <name> | up | down [N]]"
user-invocable: true
allowed-tools: Read, Bash
---

# Skill: run-migrations

## Trigger

When the user says "run migrations", "migrate", "crear migracion", "nueva migracion", "rollback migration", or similar.

## Workflow

### Modo: create new migration

1. Ask for the migration name if not provided
2. Generate the migration files:
   ```bash
   migrate create -ext sql -dir db/migrations -seq <migration_name>
   ```
3. This creates two files:
   - `XXXXXX_<name>.up.sql` (apply changes)
   - `XXXXXX_<name>.down.sql` (rollback changes)
4. Help the user write the SQL for both files
5. Remind the user to consult `/data-migrations` if the change affects production tables (zero-downtime patterns, locks, batching, online DDL)

### Modo: run migrations

1. Check the database connection string from `.env.local` or environment
2. Run pending migrations:
   ```bash
   migrate -path db/migrations -database "$DATABASE_URL" up
   ```
3. Verify success — query `schema_migrations` table to confirm version

### Modo: rollback

1. Confirm with user before destructive rollback
2. To rollback the last migration:
   ```bash
   migrate -path db/migrations -database "$DATABASE_URL" down 1
   ```
3. To rollback N migrations: `down N`

## Prerequisites

```bash
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.17.0
```

## Notes

- Always create both up and down migrations
- Down migration should perfectly reverse the up migration
- Use `IF EXISTS` / `IF NOT EXISTS` to make migrations idempotent
- Test both up and down before committing
- For Postgres-specific (CONCURRENTLY, partitioning, JSONB indexes) consult `postgres-specialist` agent
- For zero-downtime patterns (expand-contract, online DDL, backfills) use `/data-migrations`

## Recommended Next

- `/data-migrations` for schema design and zero-downtime strategy
- `postgres-specialist` agent for PG-specific migration patterns
