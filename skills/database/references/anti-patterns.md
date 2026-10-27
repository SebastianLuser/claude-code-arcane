# Database Anti-patterns

| # | Don't | Do instead |
|---|-------|------------|
| 1 | FKs without an index on the child table | Always index the FK column on the child side |
| 2 | Circular relations in the schema | Break cycles with an intermediate join table |
| 3 | God tables (50+ columns) | Split into entities with an explicit relation |
| 4 | DDL and data backfill in the same migration | One migration = one change; backfill in a separate file |
| 5 | Editing already-merged migrations | Always a new forward migration |
| 6 | DROP without a grace period | expand-contract: deprecate → migrate → DROP in release N+3 |
| 7 | `CREATE INDEX` without CONCURRENTLY in prod | `CREATE INDEX CONCURRENTLY` outside a transaction |
| 8 | Undetected N+1 | Prisma `include` / JOIN / DataLoader |
| 9 | `SELECT *` on hot paths | `select` with specific columns |
| 10 | OFFSET pagination on large tables | Keyset cursor (`WHERE id > $last LIMIT N`) |
| 11 | Queries without `EXPLAIN ANALYZE` | Validate the plan before and after every change |
| 12 | Raw SQL with string interpolation | Always prepared statements / parameters |
| 13 | No pool limits or timeouts | `max(2, cores*2)` pool; timeout 5s connect / 30s statement |
| 14 | Seeds runnable in prod | Explicit guard `if APP_ENV == production: exit` |
| 15 | Non-idempotent seeds | Upsert with ON CONFLICT, never a blind INSERT |
| 16 | Backups without a tested restore | Documented quarterly restore test |
