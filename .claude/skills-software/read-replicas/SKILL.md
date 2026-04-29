---
name: read-replicas
description: "Postgres read replica strategy: routing, consistency, lag handling, failover, anti-patterns"
category: "database"
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

> → Read references/consistency-connection.md for read-after-write strategies, lag monitoring, lag-aware routing, connection pool architecture

> → Read references/ha-dr.md for HA vs read replica comparison and disaster recovery details

> → Read references/anti-patterns-checklist.md for anti-patterns and pre-deployment checklist
