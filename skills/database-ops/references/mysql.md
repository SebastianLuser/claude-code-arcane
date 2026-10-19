# MySQL operations

Assumes MySQL 8.0 or later (or a managed equivalent). Enable `performance_schema` and the `sys` schema; most checks below read them.

## Connections

```sql
SHOW GLOBAL STATUS LIKE 'Threads_connected';
SHOW GLOBAL STATUS LIKE 'Max_used_connections';
SHOW VARIABLES LIKE 'max_connections';

-- Sessions by user and host
SELECT user, host, count(*) FROM information_schema.processlist GROUP BY user, host;
```

`Aborted_connects` growing means failed logins or a pool misconfigured; `Threads_running` far above the CPU count means contention.

## What is running and what is blocked

```sql
-- Active statements, longest first
SELECT id, user, time, state, left(info, 100) FROM information_schema.processlist
WHERE command <> 'Sleep' ORDER BY time DESC LIMIT 10;

-- Lock waits: who blocks whom
SELECT * FROM sys.innodb_lock_waits\G

-- Top statements by total latency
SELECT query, exec_count, total_latency, avg_latency
FROM sys.statement_analysis ORDER BY total_latency DESC LIMIT 10;
```

`KILL QUERY <id>` stops the statement and keeps the connection; `KILL <id>` drops it. Both need approval. The last deadlock is in `SHOW ENGINE INNODB STATUS\G` (section LATEST DETECTED DEADLOCK).

The slow query log (`slow_query_log = ON`, `long_query_time`) gives history; managed services expose it in their console.

## Memory and storage

```sql
-- InnoDB buffer pool hit ratio
SELECT 1 - (
  (SELECT variable_value FROM performance_schema.global_status WHERE variable_name = 'Innodb_buffer_pool_reads') /
  (SELECT variable_value FROM performance_schema.global_status WHERE variable_name = 'Innodb_buffer_pool_read_requests')
) AS hit_ratio;

-- Largest tables, with free space inside the files
SELECT table_schema, table_name,
       round((data_length + index_length) / 1024 / 1024) AS size_mb,
       round(data_free / 1024 / 1024) AS free_mb
FROM information_schema.tables ORDER BY size_mb DESC LIMIT 10;
```

## Schema changes on large tables

Check first whether the change is instant: many column additions run with `ALGORITHM=INSTANT` in 8.0+. Otherwise use an online tool (`gh-ost` or `pt-online-schema-change`) instead of a blocking `ALTER TABLE`; on managed services check which tool they support. Never run a long `ALTER` during peak hours.

## Replication

```sql
SHOW REPLICA STATUS\G   -- 8.0.22+; older: SHOW SLAVE STATUS
```

Check `Replica_IO_Running` and `Replica_SQL_Running` are both `Yes`, `Seconds_Behind_Source` within the RPO, and `Last_Error` empty. A stopped SQL thread with an error needs a human decision; never skip transactions blindly.
