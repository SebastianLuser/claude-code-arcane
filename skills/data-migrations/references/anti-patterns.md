# Anti-patterns — Data Migrations

- DDL and data migration in the same file
- DROP COLUMN with no grace period (>=1 release)
- CREATE INDEX without CONCURRENTLY on large tables
- No `.down.sql`
- Synchronous backfill as a single UPDATE over millions of rows
- Editing an already merged migration
- ADD COLUMN NOT NULL with a volatile DEFAULT on a large table
- Running in prod without a prior staging run
- Seeds mixed with production migrations
- Assuming ALTER TYPE is free (it rewrites the table)
- Alphabetical order instead of UTC timestamps
- Rollback in prod without validating `.down.sql`
