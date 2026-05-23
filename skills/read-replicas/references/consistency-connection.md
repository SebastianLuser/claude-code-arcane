# Consistency & Connection Architecture — Read Replicas

## Read-after-write consistency strategies

1. **Per-endpoint decision** (recommended) — each handler explicitly chooses primary or replica. Simple, predictable.
2. **Sticky primary post-write** — mark timestamp in session; during window (e.g., 5s) all reads go to primary.
3. **Wait for replica LSN** — app saves write LSN, waits for replica to catch up. Complex; only if there is evidence of a real problem.

## Replication lag monitoring

- Alert if lag > 5s sustained — without alerts, degradation is invisible
- Check `pg_stat_replication` on primary (sent_lsn vs replay_lsn)
- Check `pg_last_xact_replay_timestamp()` on replica

## Lag-aware routing (optional)

Query replica lag before routing. If lag exceeds threshold (e.g., 5s), fall back to primary. Cost: 1 extra query per read (cacheable 1-2s).

## Connection architecture

- **Separate pool per instance** — never share a connection pool between primary and replica
- Configure pool size independently per target based on workload
- PgBouncer per instance if used — it does NOT do read splitting
- Transactions MUST stay within a single pool (never cross primary/replica mid-transaction)
