---
name: read-replicas
description: "Postgres read replica strategy: routing, consistency, lag handling, failover, anti-patterns"
argument-hint: "[setup|route|audit]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# read-replicas — Postgres Read Replicas

Async copy of primary that only accepts reads. Scales read workloads, isolates analytics, enables cross-region DR.

## When to use

- Read/write ratio >= 10:1
- Heavy analytics/reports impacting OLTP
- Read-only dashboards, listings, search
- HA cross-zone or DR cross-region
- Isolating noisy workloads (CSV exports) from transactional traffic

## When NOT to use

- Small DB with low load — primary is enough
- Strict consistency required — async lag = stale reads
- No evidence of read saturation (doubles cost without benefit)
- Problem is bad indexes / slow queries — **optimize first**, then replicate

---

## Routing decision table

| Case | Target |
|------|--------|
| Writes (INSERT/UPDATE/DELETE) | **primary** |
| Read in same request after a write | **primary** (avoid stale read-your-writes) |
| Read-only endpoints (dashboards, listings) | **replica** |
| Transactions (even read-only BEGIN) | **primary** |
| Analytics / heavy reports | **dedicated analytics replica** |
| `SELECT ... FOR UPDATE / FOR SHARE` | **primary** |
| DDL / migrations | **primary** |

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

## HA vs Read Replica

| | HA Standby | Read Replica |
|---|---|---|
| Failover | Automatic | Manual (promote) |
| Direct reads | No | Yes |
| Purpose | High availability | Scale reads / DR |

Use both if you need HA + read scaling.

## Disaster recovery

- Cross-region replica as DR target
- RTO: minutes (manual promote)
- RPO: = lag at time of failure (typically seconds)
- **Drill quarterly in staging** — failover without drill = broken failover

## Pre-deployment checklist

- [ ] Evidence of read saturation (CPU, IOPS, connection count)
- [ ] Top-N slow queries already optimized with proper indexes
- [ ] Endpoints classified: which go to replica vs primary
- [ ] Read-after-write strategy chosen and implemented
- [ ] Separate connection pools in code
- [ ] Transactions hardcoded to primary
- [ ] Lag metric monitored + alert > 5s
- [ ] Additional cost approved
- [ ] Promote/failover runbook documented
- [ ] Failover drill executed in staging

## Anti-patterns

- Writing to replica — fails with read-only transaction error
- Reading from replica immediately after write in same request — guaranteed stale
- Transaction spanning both pools (primary + replica) — incoherent, fails
- Replica without lag monitoring — invisible degradation
- Using read replicas for auto-failover — they require manual promote; use HA standby
- Adding replicas without evidence of load — 2x cost, no benefit
- Routing all reads to replica without considering consistency — breaks read-your-writes flows
- Sharing a single pool for primary and replica — breaks isolation
- `SELECT ... FOR UPDATE` on replica — locks don't replicate
