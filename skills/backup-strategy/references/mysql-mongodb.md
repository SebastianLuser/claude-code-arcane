# MySQL and MongoDB backups

Same rules as Postgres in the main skill: managed snapshots plus an off-provider logical copy, PITR when the RPO is under a day, and a monthly restore test.

## MySQL

| Layer | Tool | Notes |
|---|---|---|
| **Managed** | Cloud SQL / RDS / Azure automated backups + binary logs | Enables point-in-time recovery; check the retention (often 7 days by default) |
| **Logical** | `mysqldump` or MySQL Shell dump utilities | Off-provider copy; portable across versions |
| **Physical** | Percona XtraBackup | Self-managed servers with large data, where logical restore is too slow |
| **PITR** | Binary logs (`binlog_format=ROW`) | Replay from the last full backup to a timestamp |

```bash
# Consistent logical dump of InnoDB without locking writes
mysqldump --single-transaction --routines --triggers --events \
  --set-gtid-purged=OFF --databases app | gzip > app-$(date +%F).sql.gz

# Faster, parallel dump and load for big schemas (MySQL Shell)
mysqlsh --uri user@host -- util dump-instance /backups/$(date +%F) --threads=4
mysqlsh --uri user@restore-host -- util load-dump /backups/<date> --threads=4

# PITR on a restored copy: replay binlogs up to just before the incident
mysqlbinlog --start-datetime="<backup time>" --stop-datetime="<incident time>" \
  binlog.000123 binlog.000124 | mysql -u root -p
```

`--single-transaction` is consistent only for InnoDB tables; MyISAM tables need a lock or a replica.

## MongoDB

| Layer | Tool | Notes |
|---|---|---|
| **Atlas** | Cloud Backup with continuous backup (PITR) | The default for Atlas clusters; set the PITR window to the RPO |
| **Logical** | `mongodump` / `mongorestore` | Fine for small and medium databases and for an off-provider copy |
| **Physical** | Filesystem or volume snapshots with journaling on | Self-managed replica sets with large data |

```bash
# Replica set: dump with the oplog so the copy is consistent at one moment
mongodump --uri "$MONGO_URI" --oplog --gzip --archive=app-$(date +%F).archive.gz

# Restore into a test cluster and replay the captured oplog
mongorestore --uri "$RESTORE_URI" --oplogReplay --gzip --archive=app-<date>.archive.gz
```

- `--oplog` works only when dumping a whole replica set member, not a single database.
- **Sharded clusters:** `mongodump` is not consistent across shards. Use Atlas backups or MongoDB Ops/Cloud Manager, or stop the balancer and snapshot every shard and the config servers together.
- Back up the indexes' definitions with the data (mongodump does); rebuilding large indexes is part of the real RTO.

## Restore test for both

Restore into an isolated instance, then check: row or document counts per table/collection against production at backup time, the newest record's timestamp (that is the real RPO), and the application's smoke tests pointed at the restored copy. Record the restore duration: that is the real RTO.
