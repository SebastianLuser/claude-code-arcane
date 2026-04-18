---
name: backup-strategy
description: "Estrategia de backups para apps Educabot: Postgres (pg_dump, WAL archiving, PITR), Redis (RDB/AOF), object storage (versioning/replication), retention, testing de restore, 3-2-1 rule, RTO/RPO, disaster recovery runbook. Usar para: backup, restore, disaster recovery, dr, pitr, pg_dump, snapshot, data protection."
argument-hint: "[postgres|redis|object-storage|dr]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# backup-strategy — Backups & Disaster Recovery

Estrategia de backups para apps Educabot. Foco: **restore funciona** (no "backup corre"). Ningún backup existe hasta que probaste el restore.

> Regla 0: backup sin restore probado = no tenés backup.

## Cuándo usar

- Toda DB con datos de negocio / usuarios
- Redis con estado persistente (sessions críticas, queue state)
- Object storage con contenido irreemplazable (uploads, exports)
- Configuración de infraestructura (IaC state, secrets en vault)

## Cuándo NO usar

- Caché puro (reconstruible) — no vale la pena
- Datos derivados (materialized views reconstruibles, search index)
- Logs archivados ya en cold storage

---

## 1. Regla 3-2-1

```
3 copias de los datos
2 medios distintos (disk + object storage)
1 copia off-site (región distinta)
```

Educabot: DB primary (GCP region A) + snapshot managed (A) + export a GCS multi-region + export a bucket en otro cloud/region.

---

## 2. RTO / RPO — definir antes de diseñar

| Métrica | Significado | Target Educabot |
|---------|-------------|-----------------|
| **RPO** (Recovery Point Objective) | Cuánto dato podés perder | 5 min (PITR) |
| **RTO** (Recovery Time Objective) | Cuánto tardás en volver | 1h (crítico), 4h (general) |

Sin estos números, no sabés si tu estrategia alcanza. Acordar con producto/legal.

---

## 3. Postgres — estrategia en capas

### Capa 1: Managed snapshots (GCP Cloud SQL / AWS RDS)
- Snapshot automático diario
- Retention 7-30 días según plan
- PITR habilitado (restore a cualquier segundo dentro de la ventana)

```bash
# GCP Cloud SQL
gcloud sql instances patch educabot-prod \
  --backup-start-time=03:00 \
  --enable-point-in-time-recovery \
  --backup-location=us \
  --retained-backups-count=30 \
  --retained-transaction-log-days=7
```

### Capa 2: pg_dump lógico (export off-provider)
Managed snapshots viven en el provider. Si el provider se cae o la cuenta se compromete → los snapshots se van con él.

```bash
# cron diario
pg_dump --format=custom --compress=9 \
  --host=$PGHOST --user=backup \
  --file=/tmp/educabot_$(date +%F).dump educabot_prod

gsutil cp /tmp/educabot_$(date +%F).dump \
  gs://educabot-backups/postgres/$(date +%Y/%m)/
```

Bucket con:
- **Versioning** habilitado
- **Object Lock** / retention policy (inmutable N días)
- **Multi-region** o cross-region replication
- IAM: write-only para el job de backup, read para operators

### Capa 3: WAL archiving continuo (si RPO < 1h)
```
archive_command = 'gsutil cp %p gs://educabot-wal/%f'
```

Con WAL + base backup reciente → PITR a cualquier segundo.

### Retention sugerida
```
Daily pg_dump:    30 días
Weekly:           3 meses
Monthly:          1 año
Managed snapshots: 7-30 días
WAL:              7 días (para PITR)
```

---

## 4. Restore — procedimiento y testing

### Runbook restore (simplificado)
```
1. Crear instancia destino (staging-restore)
2. Elegir fuente:
   a. Managed PITR: gcloud sql instances clone ... --point-in-time=<ts>
   b. pg_dump: pg_restore --jobs=4 --no-owner educabot.dump
3. Reapuntar réplicas / verificar
4. Smoke test: row counts, últimas transacciones, integridad
5. Cutover (DNS o connection string)
```

### Testing — mensual mínimo
```bash
# script automatizado
./bin/restore-test.sh \
  --source=latest-dump \
  --target=restore-test-$(date +%F) \
  --verify-queries=tests/restore/queries.sql
```

Checks post-restore:
- `SELECT COUNT(*) FROM users;` → > X (threshold)
- `SELECT MAX(created_at) FROM events;` → dentro de RPO
- Aplicar migrations pendientes si aplica
- Ejecutar smoke tests (auth, read path, write path en DB aislada)

**Sin restore testing mensual → el backup es teatro.**

---

## 5. Redis

### Cache (puro)
No backup — reconstruible. TTL corto.

### Sessions / queue state
```
save 900 1        # RDB snapshot cada 15min si ≥1 key cambió
save 300 10       # o 5min si ≥10 keys
appendonly yes    # AOF: log de writes
appendfsync everysec
```

RDB + AOF juntos. Copiar ambos archivos a GCS diariamente.

**Managed Redis (Memorystore/ElastiCache):** snapshots automáticos diarios. Export a GCS/S3 bucket.

---

## 6. Object storage (uploads de usuarios)

### Versioning
```bash
gsutil versioning set on gs://educabot-uploads
```
Delete → versión soft-deleted → recuperable con lifecycle rule (30d).

### Replication cross-region
Multi-region bucket O cross-region replication a otro bucket.

### Object Lock (inmutabilidad)
```bash
gsutil retention set 30d gs://educabot-uploads-archive
```
Protege contra ransomware / borrado malicioso (incluso admin no puede borrar).

---

## 7. Secrets / config / IaC

### Secrets
- Secret Manager / Vault con versioning built-in
- Export periódico encriptado a bucket separado
- Escrow: admin keys en sealed envelope (runbook de emergencia)

### Terraform state
```
backend "gcs" {
  bucket = "educabot-tfstate"
  prefix = "prod"
}
```
Versioning + object lock en ese bucket.

### Infra-as-code
Todo el cluster/infra reconstruible desde git + Terraform/Pulumi. No backup — backup es git.

---

## 8. Disaster recovery scenarios

### Escenario 1: Drop accidental de tabla
```
Restore PITR a T-1min del drop en instancia paralela
→ pg_dump de la tabla sola
→ import a prod
```
RTO: 15-30min. RPO: 1min.

### Escenario 2: Corrupción por bug
```
Identificar T cuando empezó el bug
PITR a T-1min
Cutover de aplicación
```
RTO: 1h. RPO: variable (minutos de datos perdidos post-T).

### Escenario 3: Región del provider caída
```
Failover a réplica en otra región (si existe)
O bootstrap desde export off-region + aplicar WAL
Reapuntar DNS
```
RTO: 2-4h si hay multi-region; 6-12h si solo export.

### Escenario 4: Provider account comprometido
```
Datos en cloud secundario (export cross-cloud)
Rebuild infra desde IaC en cuenta limpia
Restore desde backups off-provider
```
RTO: 24-48h. Escenario pesimista — tener documentado es la mitad de la batalla.

### Escenario 5: Ransomware / wipe malicioso
```
Object Lock asegura que backups inmutables siguen ahí
Rotar credenciales, forensics
Restore normal
```

---

## 9. Orquestación — Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata: { name: pg-backup }
spec:
  schedule: "0 3 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: backup-sa  # WIF → solo write al bucket
          containers:
            - name: backup
              image: postgres:16-alpine
              command: ["/bin/sh", "-c"]
              args:
                - |
                  set -euo pipefail
                  pg_dump --format=custom --compress=9 \
                    --host=$PGHOST --user=$PGUSER \
                    --file=/tmp/dump $PGDATABASE
                  gsutil cp /tmp/dump gs://educabot-backups/postgres/$(date +%Y/%m)/educabot_$(date +%FT%H%M).dump
              env:
                - name: PGPASSWORD
                  valueFrom: { secretKeyRef: { name: pg-backup, key: password } }
          restartPolicy: OnFailure
```

Alertar si el job **no corrió** en las últimas 25h (no solo si falló).

---

## 10. Monitoring y alertas

### Métricas
```
backup_last_success_timestamp{job}
backup_duration_seconds{job}
backup_size_bytes{job}
restore_test_last_success_timestamp{source}
restore_test_duration_seconds
```

### Alertas
- `now() - backup_last_success > 25h` → **crítico** (SLA: 1 backup/día)
- `backup_size < 50% del promedio 7d` → sospecha de backup vacío/corrupto
- `restore_test_last_success > 45 días` → recordatorio
- Bucket cross-region lag > 1h → replicación rota

### Dashboard
- Última hora de backup exitoso por cada tipo
- Tamaño por día (gráfico — detectar crecimiento anómalo)
- Historial de restores (fecha + resultado)

---

## 11. Seguridad de los backups

- [ ] Encriptación **at-rest** en bucket (KMS managed)
- [ ] Encriptación **in-transit** (TLS, default en gsutil/aws-cli)
- [ ] IAM: principio de mínimo privilegio (job escribe, no lee/borra)
- [ ] Object Lock / WORM para capa crítica
- [ ] Backup contiene PII → mismas obligaciones GDPR que la DB
- [ ] **Retention alineada con políticas de privacidad** (no conservar más de lo necesario)
- [ ] Cuenta/proyecto separado para backups (blast radius)
- [ ] Audit log de acceso a backups (quién leyó el dump)
- [ ] Secrets del job en vault, rotados

---

## 12. Migraciones y backups

- **Antes** de migration destructiva → backup manual explícito (+ verificación)
- Script de migration referencia el snapshot tag/name
- Post-migration: validar que el backup post-migration es válido

Ver skill `/db-migrations`.

---

## 13. Documentar el restore (runbook vivo)

`docs/runbooks/disaster-recovery.md`:
- Quién aprueba un restore (on-call + CTO para prod)
- Cómo se pide acceso a los backups
- Comandos exactos por escenario (copy-paste ready)
- Número de contacto del provider para escalaciones
- Último restore test (fecha + resultado)

**Probar el runbook** en game-day 1x/trimestre — alguien que no lo escribió debe poder seguirlo.

---

## 14. Costos — orden de magnitud

| Item | Costo aprox |
|------|-------------|
| Managed snapshots | Incluido (primeros X días) |
| GCS standard | $0.02/GB/mes |
| GCS nearline (>30d) | $0.01/GB/mes |
| GCS coldline (>90d) | $0.004/GB/mes |
| Egress cross-region | $0.02-0.12/GB |

Lifecycle: standard → nearline tras 30d → coldline tras 90d. Reduce costo 5-10x en la cola larga.

---

## 15. Anti-patterns

- ❌ "Tenemos backups" sin haber restaurado nunca → pueden estar corruptos
- ❌ Backup en la misma región/cuenta que el primary → cae todo junto
- ❌ Sin encriptación → backup leak = data leak
- ❌ Retention infinita por inercia → costos + GDPR
- ❌ Retention tan corta que no cubre "detección tardía" de bugs (descubrís corrupción a los 14d, backup es de 7d)
- ❌ Contraseña del backup en el repo
- ❌ Solo alertar si el job falla (job no corre ≠ job falla)
- ❌ Sin RTO/RPO formales → cada incident discute criterios desde cero
- ❌ Backup = export de prod a laptop del dev → risk legal + técnico
- ❌ Snapshot del provider como única estrategia → vendor lock + blast radius

---

## 16. Checklist review

```markdown
- [ ] RTO/RPO documentados y acordados
- [ ] 3-2-1 cumplido (3 copias, 2 medios, 1 off-site)
- [ ] Backups automatizados (cron/CronJob)
- [ ] Encriptados at-rest + in-transit
- [ ] Off-provider copy (cross-cloud o cross-region cuenta distinta)
- [ ] Restore testing mensual automatizado
- [ ] Runbook DR actualizado y probado en game-day
- [ ] Alertas: last_success staleness (no solo failure)
- [ ] Retention política alineada con GDPR/compliance
- [ ] IAM mínimo privilegio
- [ ] Object Lock para protección ransomware
```

---

## 17. Output final

```
✅ Backup strategy — Alizia production
   🗄️  Postgres:
      - Cloud SQL snapshots diarios (30d retention) + PITR 7d
      - pg_dump → GCS multi-region (90d)
      - WAL archive continuo → GCS
   💾 Redis:
      - RDB + AOF, snapshot daily → GCS
   🪣 Uploads:
      - GCS versioning + Object Lock 30d
      - Cross-region replication
   🎯 RTO: 1h / RPO: 5min
   🧪 Restore test: mensual automatizado
   📖 Runbook: docs/runbooks/disaster-recovery.md

Próximos pasos:
  1. Game-day Q2: simular region outage
  2. Revisar retention vs GDPR con legal
  3. Enrollar on-call rotation en DR drill
```

## Delegación

**Coordinar con:** `sre-lead`, `database-architect`, `security-engineer`, `backend-architect`
**Reporta a:** `sre-lead`, `cto`

**Skills relacionadas:**
- `/db-migrations` — backup antes de migrations destructivas
- `/incident` — DR scenarios en post-mortems
- `/security-hardening` — encriptación, IAM backups
- `/observability-setup` — alertas de staleness
- `/deploy-check` — verificar backup antes de deploy riesgoso
