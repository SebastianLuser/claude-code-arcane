# Anti-patterns & Checklist — Read Replicas

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
