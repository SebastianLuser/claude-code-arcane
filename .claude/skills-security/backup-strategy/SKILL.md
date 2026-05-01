---
name: backup-strategy
description: "Estrategia backups Educabot: Postgres (pg_dump, PITR), Redis, object storage, retention, restore testing, 3-2-1, RTO/RPO, disaster recovery."
category: "operations"
argument-hint: "[postgres|redis|object-storage|dr]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# backup-strategy — Backups & Disaster Recovery

**Regla 0:** backup sin restore probado = no tenés backup.

## Regla 3-2-1

3 copias, 2 medios distintos (disk + object storage), 1 off-site (otra región).

## RTO / RPO

| Métrica | Significado | Target Educabot |
|---------|-------------|-----------------|
| **RPO** | Cuánto dato podés perder | 5 min (PITR) |
| **RTO** | Cuánto tardás en volver | 1h (crítico), 4h (general) |

Definir antes de diseñar. Acordar con producto/legal.

## Postgres — 3 capas

| Capa | Qué | Retention |
|------|-----|-----------|
| Managed snapshots (Cloud SQL) | Snapshot diario + PITR | 7-30d snapshots, 7d WAL |
| pg_dump lógico | Export off-provider a GCS multi-region | 30d daily, 3m weekly, 1y monthly |
| WAL archiving | Continuo a GCS (si RPO <1h) | 7d |

Bucket: versioning + object lock + multi-region + IAM write-only para job.

## Restore — Testing Mensual

1. Crear instancia destino (staging-restore)
2. PITR clone o `pg_restore --jobs=4`
3. Smoke test: row counts, últimas transacciones, integridad
4. **Sin restore testing mensual → backup es teatro**

## Redis

- Cache puro: no backup (reconstruible)
- Sessions/queue: RDB + AOF. Copiar a GCS diariamente. Managed: snapshots automáticos

## Object Storage (uploads)

- Versioning habilitado (soft-delete 30d). Cross-region replication
- Object Lock (inmutabilidad) contra ransomware/borrado malicioso

## Secrets / IaC

- Secret Manager con versioning + export periódico encriptado
- Terraform state en bucket con versioning + object lock
- Infra reconstruible desde git — backup es git

## DR Scenarios

| Escenario | Estrategia | RTO |
|-----------|-----------|-----|
| Drop accidental tabla | PITR T-1min → dump tabla → import | 15-30min |
| Corrupción por bug | PITR → cutover | 1h |
| Región caída | Failover réplica o bootstrap export off-region | 2-4h |
| Account comprometido | Rebuild desde IaC + backups off-provider | 24-48h |
| Ransomware/wipe | Object Lock inmutable + rotar creds + restore | Variable |

## Monitoring

- `backup_last_success_timestamp` → alertar si `now() - last > 25h`
- `backup_size < 50% promedio 7d` → backup vacío/corrupto
- `restore_test_last_success > 45d` → recordatorio
- Alertar si job **no corrió** (no solo si falló)

## Security

- Encriptación at-rest (KMS) + in-transit (TLS)
- IAM mínimo privilegio (write-only para job). Cuenta separada para backups
- Object Lock/WORM para capa crítica. Audit log acceso a dumps
- Backup con PII → mismas obligaciones GDPR que la DB. Retention alineada

## Anti-patterns

- "Tenemos backups" sin haber restaurado, backup en misma región/cuenta
- Sin encriptación, retention infinita por inercia, retention muy corta
- Solo alertar si job falla (no correr ≠ fallar), sin RTO/RPO formales
- Snapshot del provider como única estrategia

## Checklist

- [ ] RTO/RPO documentados y acordados
- [ ] 3-2-1 cumplido
- [ ] Backups automatizados (CronJob)
- [ ] Encriptados at-rest + in-transit
- [ ] Off-provider copy (cross-cloud o cross-region)
- [ ] Restore testing mensual automatizado
- [ ] Runbook DR actualizado y probado en game-day
- [ ] Alertas: last_success staleness
- [ ] Retention alineada con compliance
- [ ] IAM mínimo privilegio + Object Lock
