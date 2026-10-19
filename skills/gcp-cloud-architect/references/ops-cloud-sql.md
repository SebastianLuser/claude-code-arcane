# Operate: Cloud SQL

Engine-level work (connections, slow queries, vacuum, replication) is in `/database-ops`; backups and restore tests in `/backup-strategy`. This covers the GCP layer.

## Baseline for production

- **Private IP** (Private Services Access or Private Service Connect) and no public IP; if a public IP is unavoidable, no authorized networks of `0.0.0.0/0` and connections only through the connectors.
- Connect with the **Cloud SQL Auth Proxy** (`cloud-sql-proxy`) or the language connectors: they use IAM, encrypt the connection and need no IP allowlists. On Cloud Run, the Cloud SQL connection setting does this for you.
- **IAM database authentication** for service accounts where the engine supports it, instead of passwords.
- **High availability** (regional) for production, automated backups with point-in-time recovery, deletion protection.
- **Query Insights** on, and a maintenance window outside peak hours (for Educabot services, outside school hours).

## Changes and maintenance

```bash
gcloud sql instances describe <instance> --format="yaml(settings.tier,settings.availabilityType,settings.maintenanceWindow)"
gcloud sql operations list --instance <instance> --limit 10      # recent restarts, failovers, backups
```

- Changing the tier, some flags or the storage type restarts the instance; check the flag's documentation for "requires restart" before applying it.
- Storage can grow automatically (set a limit) but never shrinks.
- Major version upgrades: test on a clone first (`gcloud sql instances clone`), then upgrade in place or migrate.

## Restore and failover

- PITR and backup restores go to a **new or existing target instance**. Restoring over an existing instance overwrites all its data, including its PITR logs, and its replicas must be deleted first: prefer restoring to a new instance and switching the app, unless the runbook says otherwise.
- Test the HA failover in staging (`gcloud sql instances failover <instance>`) and measure how long the app takes to reconnect.
- Cross-region read replicas can be promoted for disaster recovery; promotion breaks replication and is not reversible.

## Alerts (Cloud Monitoring)

CPU utilization, memory utilization, disk utilization above 85%, connections near `max_connections`, replication lag on replicas, and the instance state not RUNNABLE.
