---
name: read-replicas
description: Escalar lecturas de Postgres con read replicas en Cloud SQL. Routing primary/replica, consistency, lag, DR y patrones Go/TS. Usar cuando se mencione read replica, escalar DB, lecturas lentas, HA/DR de Postgres, Cloud SQL replica, replication lag.
stack: Postgres 15+, GCP Cloud SQL, Go (pgx/pgxpool), TS (Prisma/drizzle-orm)
---

# Read Replicas — Postgres en Cloud SQL

Copia **asíncrona** del primary que solo acepta reads. Sirve para escalar lecturas, separar workload analítico del OLTP y como target de DR cross-region.

## Cuándo usar

- Ratio read/write alto (10:1 o más).
- Queries analíticas pesadas que no deben tocar el OLTP.
- Dashboards / reports / listings de solo lectura.
- HA cross-zone o DR cross-region.
- Aislar workloads ruidosos (ej: export CSV) del tráfico transaccional.

## Cuándo NO usar

- DB chica con baja carga — el primary alcanza y sobra.
- Consistencia estricta imprescindible — lag async = stale reads.
- No hay evidencia de saturación de lecturas (duplicás costo sin razón).
- El problema es de índices / queries lentas — **primero optimizá**, después replicás.

---

## 1. Crear read replica en Cloud SQL

```bash
# Misma región (baja latencia, scaling de lecturas)
gcloud sql instances create alizia-db-replica \
  --master-instance-name=alizia-db \
  --region=us-central1 \
  --tier=db-custom-2-7680

# Cross-region (DR + global reads, pagan egress)
gcloud sql instances create alizia-db-replica-dr \
  --master-instance-name=alizia-db \
  --region=southamerica-east1
```

**Tips:**
- Replica = mismo tier o menor (ajustá por workload).
- Replicación lógica (pglogical / publication-subscription) para upgrades mayores o replicar tablas selectivas.
- Cloud SQL HA (standby) ≠ read replica. HA es auto-failover; replica es read-only manual-promote.

---

## 2. Monitoring de lag

Métrica GCP: `cloudsql.googleapis.com/database/replication/replica_lag` (segundos).

```sql
-- Desde el primary
SELECT client_addr, state, sent_lsn, replay_lsn,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes
FROM pg_stat_replication;

-- Desde la replica
SELECT now() - pg_last_xact_replay_timestamp() AS replication_delay;
```

**Alertar si lag > 5s sostenido.** Sin alerta, degradación invisible → stale reads silenciosos.

---

## 3. Patrón de uso en app

| Caso | Target |
|------|--------|
| Writes | **primary** |
| Read del mismo request tras un write | **primary** (evita read-your-writes staleness) |
| Reads only (dashboards, listings, search) | **replica** |
| Transacciones (incluso read-only `BEGIN`) | **primary** |
| Analytics / reports pesados | **replica dedicada** |
| `SELECT ... FOR UPDATE` | **primary** |

---

## 4. Read-after-write consistency

Tras un INSERT/UPDATE, leer el mismo dato de replica puede devolver stale.

**Estrategias (de más simple a más compleja):**

1. **Sticky primary post-write** — marcar timestamp en sesión/cookie; durante ventana (ej: 5s) todos los reads del usuario van al primary.
2. **Per-endpoint decision** — cada handler decide target explícito. Simple, predecible.
3. **Wait for replica LSN** — app guarda LSN del write, espera que replica lo alcance (`pg_wal_lsn_diff`). Complejo, solo si hay evidencia de problema real.

Recomendado para Educabot: **#2 por default, #1 si aparece read-your-writes en producción.**

---

## 5. Implementación Go (pgx)

```go
// internal/db/db.go
package db

import (
	"context"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	primary *pgxpool.Pool
	replica *pgxpool.Pool
}

func New(primaryDSN, replicaDSN string) (*DB, error) {
	p, err := pgxpool.New(context.Background(), primaryDSN)
	if err != nil {
		return nil, err
	}
	r, err := pgxpool.New(context.Background(), replicaDSN)
	if err != nil {
		return nil, err
	}
	return &DB{primary: p, replica: r}, nil
}

// Write — SIEMPRE primary
func (d *DB) Write() *pgxpool.Pool { return d.primary }

// Read — replica (usar cuando consistencia async es OK)
func (d *DB) Read() *pgxpool.Pool { return d.replica }

// ReadConsistent — primary (usar post-write o cuando consistencia es crítica)
func (d *DB) ReadConsistent() *pgxpool.Pool { return d.primary }

// Tx — SIEMPRE primary, NUNCA cross-pool
func (d *DB) Tx(ctx context.Context, fn func(pgx.Tx) error) error {
	return pgx.BeginFunc(ctx, d.primary, fn)
}
```

**Uso en repository:**

```go
func (r *UserRepo) ListActive(ctx context.Context) ([]User, error) {
	rows, err := r.db.Read().Query(ctx, `SELECT id, email FROM users WHERE active = true`)
	// ...
}

func (r *UserRepo) CreateAndFetch(ctx context.Context, u User) (User, error) {
	// read-after-write → primary
	_, err := r.db.Write().Exec(ctx, `INSERT INTO users ...`)
	if err != nil { return User{}, err }
	row := r.db.ReadConsistent().QueryRow(ctx, `SELECT ... WHERE id=$1`, u.ID)
	// ...
}
```

---

## 6. Implementación TS

**Prisma** no soporta multi-datasource nativo completo. Opciones:

```ts
// Dos clients separados
import { PrismaClient } from '@prisma/client'

export const prismaWrite = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_PRIMARY! } }
})
export const prismaRead = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_REPLICA! } }
})
```

**drizzle-orm** (más flexible):

```ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

export const dbWrite = drizzle(new Pool({ connectionString: process.env.PG_PRIMARY }))
export const dbRead  = drizzle(new Pool({ connectionString: process.env.PG_REPLICA }))

// Transaction SIEMPRE en primary
await dbWrite.transaction(async (tx) => { /* ... */ })
```

---

## 7. Connection pooling

- **Pool separado por instancia.** No compartir pgxpool/Pool entre primary y replica.
- **PgBouncer por instancia** si se usa. No intenta hacer read splitting.
- Ajustar `max_connections` / pool size independiente por target.

---

## 8. Read splitting automático

PgBouncer **no lo hace**. Alternativas:

- **pgpool-II** — soporta routing por statement, pero complejo operacionalmente.
- **AWS RDS Proxy** — no aplica en GCP.
- **Middleware custom a nivel app** — el helper `db.Read()`/`db.Write()` de arriba es la opción recomendada para Educabot. Explícito > mágico.

---

## 9. Statement-level routing (reglas operativas)

| Statement | Target |
|-----------|--------|
| `SELECT` sin `FOR UPDATE` y fuera de tx | replica |
| `SELECT ... FOR UPDATE` / `FOR SHARE` | primary |
| `INSERT` / `UPDATE` / `DELETE` | primary |
| Dentro de `BEGIN ... COMMIT` | todo primary |
| DDL (`CREATE`, `ALTER`, migrations) | primary |

---

## 10. Lag-aware routing (opcional)

```go
func (d *DB) ReadSmart(ctx context.Context) *pgxpool.Pool {
	var lag float64
	err := d.replica.QueryRow(ctx,
		`SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))`).Scan(&lag)
	if err != nil || lag > 5.0 {
		return d.primary // fallback
	}
	return d.replica
}
```

Útil cuando el lag es variable. Costo: 1 query extra por read (cacheable 1-2s).

---

## 11. Analytics workload aislado

Dedicar **replica separada para analítica** (reports, exports CSV, BI). Evita que una query pesada tumbe OLTP.

```
primary (OLTP) ──► replica-oltp (reads app)
              └──► replica-analytics (BI, reports)
```

---

## 12. Disaster Recovery

- **Replica cross-region** como target de DR.
- **RTO:** minutos (promote manual: `gcloud sql instances promote-replica alizia-db-replica-dr`).
- **RPO:** = lag al momento del fallo (segundos típicos).
- **Drill obligatorio:** hacer failover en staging una vez por trimestre. Failover sin drill = failover roto.

---

## 13. HA vs Read Replica (no confundir)

| | HA Standby (Cloud SQL) | Read Replica |
|---|---|---|
| Failover | Automático | Manual (promote) |
| Lectura directa | No | Sí |
| Propósito | Alta disponibilidad | Escalar lecturas / DR |
| Costo | ~2x primary | ~1x primary por réplica |

**Usar ambos** si se necesita HA + scaling de lectura.

---

## 14. Cost awareness

- Cada replica ≈ mismo costo del primary.
- Cross-region = + egress traffic.
- 2x-3x infra DB es común con 1 HA standby + 1-2 replicas.
- **No replicar sin evidencia de carga.** Medir antes.

---

## 15. Multi-tenant Educabot

- Sharding por tenant **NO** recomendado en early-stage (overkill, operacionalmente caro).
- Una replica read-mostly alcanza para escalar lectura en la mayoría de productos EdTech Educabot (Alizia, Tich, Tuni, Vigía).
- Considerar sharding solo cuando un tenant solo satura una instancia entera.

---

## Anti-patterns

- ❌ Escribir a replica — explota con `cannot execute INSERT in a read-only transaction`.
- ❌ Leer de replica inmediatamente tras write del mismo request — stale read garantizado.
- ❌ Transaction abierta que cruza pools (primary ↔ replica) — incoherente, no funciona.
- ❌ Replica sin monitoreo de lag — degradación invisible.
- ❌ Usar read replicas para HA auto-failover — **no sirve**, son manual promote. Usar HA standby de Cloud SQL.
- ❌ Duplicar DB "por las dudas" sin evidencia de carga — 2x cost sin beneficio.
- ❌ Routear todos los reads a replica sin pensar consistency — rompe flujos read-your-writes.
- ❌ Failover plan sin drill previo — en la crisis descubrís que no funciona.
- ❌ Compartir un mismo pool para primary y replica — rompe isolation.
- ❌ Usar replica para `SELECT ... FOR UPDATE` — locks no se replican.

---

## Checklist antes de agregar read replica

- [ ] Hay evidencia de saturación de lecturas (CPU, IOPS, connection count).
- [ ] Ya se optimizaron índices y queries top-N lentas.
- [ ] Definido qué endpoints van a replica vs primary.
- [ ] Read-after-write resuelto (estrategia #1 o #2).
- [ ] Pools separados en código (Go: dos `pgxpool`; TS: dos clients).
- [ ] Transactions hardcoded a primary.
- [ ] Métrica de lag monitoreada + alerta > 5s.
- [ ] Costo adicional aprobado / presupuestado.
- [ ] Runbook de promote/failover documentado.
- [ ] Drill de failover ejecutado en staging.

---

## Output esperado ✅

- Replica creada en Cloud SQL (misma región para scaling, cross-region para DR).
- App con dos pools separados + helper `Read()`/`Write()`/`Tx()`.
- Routing explícito por endpoint.
- Monitoring de lag activo con alerta.
- Runbook de failover + drill programado.

---

## Delegación

- Cambios de schema / migrations → `/run-migrations` (siempre contra primary).
- Auditoría de performance DB / deuda técnica → `/audit-dev`.
- Diagrama ER actualizado → `/db-diagram`.
- Pre-deploy con cambios de conexión DB → `/deploy-check` (validar env vars primary + replica).
- Variables de entorno `DATABASE_URL_PRIMARY` / `DATABASE_URL_REPLICA` → `/env-sync`.
- Documentar decisión de adoptar read replica → `/doc-rfc`.
- Incidente por lag / stale reads / failover → `/incident`.
