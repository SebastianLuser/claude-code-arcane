---
name: local-database-setup
description: "Sets up the project's local database: starts Docker/Postgres, runs the setup script, applies pending migrations."
category: "database"
argument-hint: ""
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Skill: local-database-setup

## Trigger
When the user says "setup database", "configure the database", "spin up the db", "initialize db", or similar.

## Workflow

1. Check if Docker is running (PostgreSQL usually runs in Docker locally)

2. Look for database setup scripts in the project:
   - `db/local/init-local-db.sh`
   - `docker-compose.yml` with postgres service
   - `Makefile` with db-related targets

3. Run the setup script:
   ```bash
   # For tich-cronos
   bash db/local/init-local-db.sh
   ```

4. Verify the database is accessible:
   - Check connection using env vars from `.env.local`
   - Run a simple query to verify

5. Run pending migrations if any exist:
   - Check `db/migrations/` directory
   - Run migrations using golang-migrate

## Project-specific setup

### tich-cronos
```bash
# 1. Start PostgreSQL (Docker)
bash db/local/init-local-db.sh

# 2. Run migrations
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.12.2
migrate -path db/migrations -database "$DATABASE_URL" up
```
