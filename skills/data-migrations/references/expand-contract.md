# Zero-downtime: Expand-Contract

Every breaking change is split across multiple releases:

| Phase | What | Compatibility |
|------|-----|----------------|
| **1. Expand** | Add the new thing (NULLABLE/DEFAULT column, table, index CONCURRENTLY) | Old code keeps working |
| **2. Backfill** | Fill in data — background job, idempotent, batched | Separate from the DDL |
| **3. Dual-write** | The app writes old AND new | Rollback without losing data |
| **4. Migrate reads** | The app reads from the new one, the old one is write-only | Validate traffic |
| **5. Contract** | Drop the old one — at least 1 release later | Only after validating nobody reads the old one |

## Breaking changes are ALWAYS multi-step

- `DROP COLUMN` — stop-writing -> stop-reading -> drop
- Lossy `ALTER COLUMN TYPE` — new column + backfill + swap
- `RENAME COLUMN/TABLE` — temporary alias/view or expand-contract
- `NOT NULL` on an existing column — check constraint NOT VALID -> validate -> NOT NULL
- PK/FK change
