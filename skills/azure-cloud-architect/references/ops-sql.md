# Operate: Azure SQL Database (and Cosmos DB notes)

Query-level work (slow queries, locks, indexes) follows the same method as `/database-ops`; this covers the Azure layer.

## Baseline for production

- **Microsoft Entra authentication**, ideally Entra-only; apps connect with their managed identity, so no SQL password exists to leak.
- **Private endpoint** and public network access disabled; no firewall rule `0.0.0.0–255.255.255.255`, and "Allow Azure services" off unless something truly needs it.
- **Zone redundancy** where the tier supports it, for production.
- **Microsoft Defender for SQL** and auditing to Log Analytics (`ops-monitor-audit.md`).
- TDE is on by default; use a customer-managed key only when a compliance rule asks for it.

## Backups and failover

- Automated backups give **point-in-time restore** within the retention you set; long-term retention (weekly, monthly, yearly) is a separate policy. A restore creates a **new database**: the runbook includes pointing the app at it (`/backup-strategy`).
- **Failover groups** replicate to a second region and give a listener endpoint that follows the primary: the app connects to the listener, not to a server name, so a failover needs no config change.

```bash
az sql failover-group set-primary --name <fog> --resource-group <rg> --server <secondary-server>   # planned failover drill
```

## Performance

- **Query Store:** confirm it is on (`SELECT actual_state_desc FROM sys.database_query_store_options;`) and use it (portal "Query Performance Insight" or the Query Store views) to find the top queries by CPU and duration and plan regressions.
- Automatic tuning can create and drop indexes and force good plans; review what it did before trusting it.
- DTU or vCore consistently near 100%: tune the top queries first, then scale; serverless tier auto-pauses, which adds a resume delay on the first connection.

## Cosmos DB

- The **partition key** decides cost and scale and cannot be changed later: pick a high-cardinality key that matches the main query filter.
- Watch `429` (request rate too large): raise RU/s or autoscale max, or fix queries that fan out across partitions.
- Choose the consistency level on purpose; Session is the usual default.
