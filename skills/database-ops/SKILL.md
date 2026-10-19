---
name: database-ops
description: "Operate production databases (PostgreSQL, MySQL, MongoDB, Redis), managed or not: health checks, slow queries, locks, connections, maintenance, replication lag, and what to do in a database incident. Read-only by default."
category: "operations"
argument-hint: "[health | incident | tune] [postgres | mysql | mongodb | redis]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Database Ops

Keeping a running database healthy, and finding the cause when it is not. It assumes a managed service (Cloud SQL, RDS, Atlas, Memorystore, ElastiCache) or an existing server; installing and configuring servers is out of scope. Backups and restores are in `/backup-strategy`; schema and migrations in `/database` and `/run-migrations`.

## Phase 1: Scope

| Mode | Does |
|---|---|
| `health` | Runs the health checks for the engine and gives a verdict |
| `incident` | Something is slow or failing now: finds the cause, proposes the fix |
| `tune` | Reviews slow queries, indexes, connection and memory settings |
| No arg | `health` |

Detect the engine and where it runs from the connection string, `docker-compose.yml`, IaC or env files. Ask for read-only credentials; never use the application's admin user for diagnosis.

## Phase 2: Engine reference

| Engine | Reference | Also |
|---|---|---|
| PostgreSQL | `references/postgres.md` | `/query-optimization`, `/database-indexing`, `/read-replicas` |
| MySQL | `references/mysql.md` | |
| MongoDB | `references/mongodb.md` | |
| Redis | `references/redis.md` | |

Read only the reference for the engine in use.

## Phase 3: Health checks

Every engine gets the same six questions; the reference has the exact queries:

1. **Up and reachable**, and from the app's network.
2. **Connections:** used vs maximum, idle-in-transaction or leaked connections, pooler in front.
3. **Slow work:** the top queries by total time, long-running operations, lock waits.
4. **Memory and cache:** hit ratio, eviction (Redis), buffer pool or cache size vs working set.
5. **Storage and maintenance:** disk growth, bloat or fragmentation, maintenance jobs keeping up (vacuum, compaction).
6. **Replication:** lag per replica, replication slots or oplog window, last failover.

On a managed service, start with its own tools (Cloud SQL Query Insights, RDS Performance Insights, Atlas Performance Advisor): they keep history that ad-hoc queries do not.

## Phase 4: Incident

1. **What changed?** Deploys, migrations, traffic, a new cron job, an index build, in the last hours.
2. **Where is the time going?** Active operations and lock waits right now (reference queries).
3. **Stop the bleeding** with the least destructive option: kill one runaway query, pause a job, scale read traffic to replicas, add capacity on a managed service. Ask before each.
4. **Fix the cause** after the incident: the index, the query, the pool size, the migration strategy.
5. Write it up with `/incident`.

## Phase 5: Verdict

| Verdict | When |
|---|---|
| **PASS** | All six checks within limits |
| **CONCERNS** | Something trending toward a limit: connections above 70% of max, growing lag, bloat, a slow query in the top 5 by total time |
| **FAIL** | At or past a limit: connections exhausted, replication broken or lag above the RPO, disk above 85%, Postgres transaction ID age near wraparound, Redis evicting keys that are not cache |

Report: verdict, one row per check (value, limit, evidence), then the fixes in order of risk.

## Protocol

- Read-only by default. Killing sessions, `VACUUM FULL`, `OPTIMIZE TABLE`, failovers, `FLUSHALL`, `CONFIG SET` and index builds on large tables are changes: show the exact command and ask first.
- Run heavy diagnostic queries on a replica when one exists.
- Never paste query results that contain user data into the conversation; aggregate or redact.

## Next steps

- `/backup-strategy` for backups, PITR and restore tests.
- `/slo-sli` and `/observability-setup` to alert on these checks instead of running them by hand.
- `/incident` for the post-mortem.
