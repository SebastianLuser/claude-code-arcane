# Operate: RDS and Aurora

Engine-level operations (connections, slow queries, vacuum, replication) are in `/database-ops`; backups and restore tests in `/backup-strategy`. This covers the AWS layer.

## Baseline for production

- **Multi-AZ** (or an Aurora cluster with a replica in another AZ); private subnets only; `PubliclyAccessible: false`.
- **Storage encrypted** with KMS (it cannot be turned on later without a restore into a new instance).
- **Master password managed by Secrets Manager** (`--manage-master-user-password`), never in IaC variables.
- **Automated backups** with a retention that matches the RPO policy, plus deletion protection.
- **Performance Insights** and Enhanced Monitoring on; slow query logs exported to CloudWatch Logs.
- A custom **parameter group** from the start: changing from the default one later needs a reboot.

## Changes without surprises

- `ApplyImmediately=false` applies modifications in the maintenance window; many changes (instance class, some parameters) cause a reboot or failover.
- Static parameters need a reboot; check `describe-db-parameters` for `ApplyType` before changing.
- Major version upgrades and big schema changes: use **RDS Blue/Green Deployments**, which build a synchronized copy, let you test it, and then switch over. The switchover has a timeout you set (30 seconds to 1 hour, default 5 minutes) and writes stop while it runs: rehearse it in staging and measure the real pause before doing it in production.

```bash
aws rds describe-pending-maintenance-actions
aws rds describe-events --source-type db-instance --duration 1440     # last 24 h: failovers, reboots, storage
```

## Alarms

| CloudWatch metric | Alarm when |
|---|---|
| `CPUUtilization` | Above 80% for 15 minutes |
| `FreeStorageSpace` | Below 15% (or turn on storage autoscaling with a max) |
| `DatabaseConnections` | Near `max_connections` for the instance class |
| `ReplicaLag` | Above the RPO |
| `FreeableMemory` | Trending to zero (swap follows) |
| `DiskQueueDepth`, read/write latency | Rising with stable traffic: storage throughput limit |

## Restore and failover drills

PITR always creates a **new** instance (`restore-db-instance-to-point-in-time`): the app has to be pointed at it, so the runbook includes the DNS or config switch. Test a Multi-AZ failover in staging with `aws rds reboot-db-instance --force-failover` and measure how long the app takes to reconnect.
