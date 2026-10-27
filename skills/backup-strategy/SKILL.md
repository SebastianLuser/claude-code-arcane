---
name: backup-strategy
description: "Educabot backup strategy: Postgres (pg_dump, PITR), MySQL, MongoDB, Redis, object storage, retention, restore testing, 3-2-1, RTO/RPO, disaster recovery."
category: "operations"
argument-hint: "[postgres|mysql|mongodb|redis|object-storage|dr]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# backup-strategy — Backups & Disaster Recovery

**Rule 0:** a backup without a tested restore = you have no backup.

## 3-2-1 Rule

3 copies, 2 different media (disk + object storage), 1 off-site (another region).

## RTO / RPO

| Metric | Meaning | Educabot target |
|---------|-------------|-----------------|
| **RPO** | How much data you can lose | 5 min (PITR) |
| **RTO** | How long it takes to come back | 1h (critical), 4h (general) |

Define them before designing. Agree on them with product/legal.

## Postgres — 3 layers

| Layer | What | Retention |
|------|-----|-----------|
| Managed snapshots (Cloud SQL) | Daily snapshot + PITR | 7-30d snapshots, 7d WAL |
| Logical pg_dump | Off-provider export to multi-region GCS | 30d daily, 3m weekly, 1y monthly |
| WAL archiving | Continuous to GCS (if RPO <1h) | 7d |

Bucket: versioning + object lock + multi-region + write-only IAM for the job.

## Restore — Monthly Testing

1. Create a target instance (staging-restore)
2. PITR clone or `pg_restore --jobs=4`
3. Smoke test: row counts, latest transactions, integrity
4. **Without monthly restore testing → the backup is theater**

## MySQL and MongoDB

Same three layers as Postgres: provider backups with PITR (binlogs in MySQL, continuous backup in Atlas), a logical copy outside the provider, and a monthly restore. In sharded MongoDB, `mongodump` is not consistent across shards.

> → Read references/mysql-mongodb.md for `mysqldump --single-transaction`, MySQL Shell dump/load, PITR with binlogs, `mongodump --oplog`, Atlas and sharded clusters

## Redis

- Pure cache: no backup (rebuildable)
- Sessions/queue: RDB + AOF. Copy to GCS daily. Managed: automatic snapshots

## Object Storage (uploads)

- Versioning enabled (30d soft-delete). Cross-region replication
- Object Lock (immutability) against ransomware/malicious deletion

## Secrets / IaC

- Secret Manager with versioning + periodic encrypted export
- Terraform state in a bucket with versioning + object lock
- Infra rebuildable from git — the backup is git

## DR Scenarios

| Scenario | Strategy | RTO |
|-----------|-----------|-----|
| Accidental table drop | PITR T-1min → dump table → import | 15-30min |
| Corruption from a bug | PITR → cutover | 1h |
| Region down | Replica failover or bootstrap from off-region export | 2-4h |
| Compromised account | Rebuild from IaC + off-provider backups | 24-48h |
| Ransomware/wipe | Immutable Object Lock + rotate creds + restore | Variable |

> → Read references/dr-strategies-and-tests.md for backup/restore vs pilot light vs warm standby vs active/active by RTO and cost, and the DR test calendar (tabletop, component failover, game day)

## Monitoring

- `backup_last_success_timestamp` → alert if `now() - last > 25h`
- `backup_size < 50% of the 7d average` → empty/corrupt backup
- `restore_test_last_success > 45d` → reminder
- Alert if the job **did not run** (not only if it failed)

## Security

- Encryption at rest (KMS) + in transit (TLS)
- Least-privilege IAM (write-only for the job). Separate account for backups
- Object Lock/WORM for the critical layer. Audit log of access to dumps
- Backups with PII → same GDPR obligations as the DB. Aligned retention

## Anti-patterns

- "We have backups" without ever having restored, backup in the same region/account
- No encryption, infinite retention out of inertia, retention that is too short
- Alerting only if the job fails (not running ≠ failing), no formal RTO/RPO
- The provider's snapshot as the only strategy

## Checklist

- [ ] RTO/RPO documented and agreed
- [ ] 3-2-1 met
- [ ] Automated backups (CronJob)
- [ ] Encrypted at rest + in transit
- [ ] Off-provider copy (cross-cloud or cross-region)
- [ ] Automated monthly restore testing
- [ ] DR runbook up to date and tested in a game day
- [ ] Alerts: last_success staleness
- [ ] Retention aligned with compliance
- [ ] Least-privilege IAM + Object Lock
