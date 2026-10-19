# PostgreSQL operations

Query tuning and indexes live in `/query-optimization` and `/database-indexing`; replicas in `/read-replicas`. This is the operational side.

## Connections

```sql
-- Used vs max, by state
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
SHOW max_connections;

-- Sessions idle inside a transaction (they hold locks and block vacuum)
SELECT pid, usename, now() - xact_start AS in_tx, left(query, 80)
FROM pg_stat_activity
WHERE state = 'idle in transaction' ORDER BY in_tx DESC;
```

- Put a pooler in front (PgBouncer in transaction mode, or the provider's: RDS Proxy, Cloud SQL managed pooling where available). Size the app pools so their sum stays below `max_connections` minus the reserved slots.
- Set `idle_in_transaction_session_timeout` so a crashed client cannot hold locks forever.

## What is running and what is blocked

```sql
-- Longest-running queries
SELECT pid, now() - query_start AS runtime, state, left(query, 100)
FROM pg_stat_activity WHERE state <> 'idle' ORDER BY runtime DESC LIMIT 10;

-- Who blocks whom
SELECT pid, pg_blocking_pids(pid) AS blocked_by, left(query, 80)
FROM pg_stat_activity WHERE cardinality(pg_blocking_pids(pid)) > 0;

-- Top queries by total time (needs pg_stat_statements)
SELECT calls, round(total_exec_time) AS total_ms, round(mean_exec_time) AS mean_ms, left(query, 80)
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;
```

Cancel before terminating: `SELECT pg_cancel_backend(<pid>);` stops the query; `pg_terminate_backend` drops the connection. Both need approval.

## Vacuum, bloat and wraparound

```sql
-- Tables with the most dead rows and their last autovacuum
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 10;

-- Transaction ID age per database: alert well before it nears 2 billion
SELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;
```

- Autovacuum falling behind on a hot table: lower that table's `autovacuum_vacuum_scale_factor` instead of running manual vacuums.
- `VACUUM FULL` rewrites the table under an exclusive lock; on a live table use `pg_repack` instead.
- Long transactions and idle-in-transaction sessions stop vacuum from cleaning: fix those first.

## Cache and disk

```sql
SELECT round(100.0 * sum(blks_hit) / nullif(sum(blks_hit) + sum(blks_read), 0), 2) AS cache_hit_pct
FROM pg_stat_database;   -- below ~99% on an OLTP workload: working set larger than memory
```

## Replication

```sql
-- On the primary: lag per replica
SELECT client_addr, state, write_lag, flush_lag, replay_lag FROM pg_stat_replication;

-- Inactive replication slots keep WAL forever and fill the disk
SELECT slot_name, active, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained
FROM pg_replication_slots;
```

An inactive slot retaining gigabytes is an outage waiting to happen: drop it (with approval) if its consumer is gone.
