# HA & Disaster Recovery — Read Replicas

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
