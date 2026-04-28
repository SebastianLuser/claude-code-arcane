---
name: data-migrations
description: Estrategia y ejecución de migraciones de base de datos en Educabot (Postgres default). Cubre schema migrations (DDL), data migrations (DML), patrones zero-downtime (expand-contract), rollbacks, locks, índices CONCURRENTLY, batching y multi-tenant. Usar cuando se mencione migration, migración, schema change, alter table, drop column, backfill, zero-downtime, rollback de DB.
argument-hint: "[create <name>|run|rollback]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Data Migrations — Educabot

## Route

| Intención del usuario | Modo | Qué hace |
|----------------------|------|----------|
| "nueva migration", "agregar columna", "crear tabla", "rename" | CREATE | Genera archivos `.up.sql` + `.down.sql` con naming correcto |
| "correr migrations", "aplicar", "migrate up", "deploy migration" | RUN | Valida staging → ejecuta → confirma estado |
| "revertir", "rollback", "deshacer migration", "migrate down" | ROLLBACK | Verifica `.down.sql`, evalúa riesgo, ejecuta con backup previo |
| "qué migrations hay", "estado", "pendientes", "aplicadas" | STATUS | `migrate version` + lista pendientes vs aplicadas |

**Regla:** si la intención combina CREATE + RUN, hacer en ese orden. Si es ROLLBACK destructivo, pedir confirmación explícita.

---

Migraciones de DB sin romper producción. Stack: **Postgres** con **golang-migrate** (Go) o **Prisma Migrate** (TS).

## Cuándo usar / NO usar

| Usar | NO usar |
|------|---------|
| Schema: CREATE/ALTER TABLE, ADD COLUMN, índices | Seeds de datos de prueba (usar fixtures) |
| Data: backfills, transformaciones, normalizaciones | Lookup tables triviales de dev local |
| Rename/drop columnas o tablas en prod | Scripts one-shot limpieza manual (usar job) |
| ALTER TYPE, split/merge tablas, multi-tenant | Cambios de config app (env/config) |

## Herramientas

| Stack | Tool | Archivos |
|-------|------|----------|
| **Go** (default) | `golang-migrate/migrate` | `migrations/NNNNNNNNNNNNNN_nombre.up.sql` + `.down.sql` |
| **TS (Prisma)** | Prisma Migrate | Si usa Prisma como ORM |
| **TS (pg directo)** | `node-pg-migrate` | Si usa pg sin ORM |
| **TS (Drizzle)** | `drizzle-kit` | Si stack Drizzle |

Alinear herramienta con ORM elegido. No mezclar dos sistemas en mismo repo.

## Naming

Formato: `YYYYMMDDHHMMSS_description.up.sql` + `.down.sql`. Timestamp UTC (no secuenciales). Description snake_case con verbo (`add_`, `create_`, `drop_`, `alter_`, `backfill_`). Una migration = un cambio lógico atómico. Nunca editar migration ya mergeada a main.

## Zero-downtime: expand-contract

Todo breaking change se divide en múltiples releases:

| Fase | Qué | Compatibilidad |
|------|-----|----------------|
| **1. Expand** | Agregar nuevo (columna NULLABLE/DEFAULT, tabla, índice CONCURRENTLY) | Código viejo funciona |
| **2. Backfill** | Rellenar datos — job background, idempotente, batcheado | Separado del DDL |
| **3. Dual-write** | App escribe viejo Y nuevo | Rollback sin perder datos |
| **4. Migrate reads** | App lee del nuevo, viejo solo-escritura | Validar tráfico |
| **5. Contract** | Drop viejo — mínimo 1 release después | Solo tras validar nadie lee viejo |

### Breaking changes SIEMPRE multi-step
- `DROP COLUMN` — stop-writing → stop-reading → drop
- `ALTER COLUMN TYPE` lossy — nueva columna + backfill + swap
- `RENAME COLUMN/TABLE` — alias/vista temporal o expand-contract
- `NOT NULL` existente — check constraint NOT VALID → validar → NOT NULL
- Cambio PK/FK

## Índices

- **Siempre** `CREATE INDEX CONCURRENTLY` en tablas con datos (no bloquea writes)
- No puede correr dentro de transacción — usar `-- +migrate NoTransaction` (golang-migrate) o `--create-only` + editar SQL (Prisma)
- Si falla: queda INVALID → DROP INDEX → reintentar

## Locks y timeouts

`ALTER TABLE` toma ACCESS EXCLUSIVE LOCK. Patrón seguro: `SET lock_timeout = '5s'; SET statement_timeout = '30s';` antes del ALTER. Si no consigue lock → falla rápido → retry con backoff. `ADD COLUMN` con DEFAULT no-volátil es instantáneo desde PG 11. `ADD COLUMN NOT NULL DEFAULT <volátil>` reescribe tabla — evitar.

## Batching (data migrations grandes)

- Batch size: 10k rows default (ajustar según carga)
- Keyset pagination (`id > last_id`), nunca OFFSET
- Checkpoint persistente: guardar last_id en tabla control
- Idempotente: N ejecuciones = mismo resultado
- Job separado de migration schema
- Pausas entre batches (100-500ms)
- Observabilidad: log progreso + métricas throughput

## Rollback

- DDL aditivo (ADD/CREATE) → reversible con DROP
- DDL destructivo (DROP) → one-way, datos perdidos
- Data migration lossy → one-way
- **Siempre** escribir `.down.sql` (aunque sea NO-OP documentado)
- One-way críticos: backup previo obligatorio

## Staging y CI

- Staging = subset anonimizado de prod. Correr toda migration antes que prod. Medir tiempo.
- CI (obligatorio en PR): `up` desde limpio → `down` → `up` otra vez (valida reversibilidad + idempotencia). Lint SQL si configurado.

## Multi-tenant

| Patrón | Cómo | Cuándo |
|--------|------|--------|
| **Shared schema** (default Educabot) | Una migration global, backfills consideran todos tenant_id | SaaS standard |
| **Schema-per-tenant** | Runner itera tenants, trackea fallo parcial | Aislamiento medio |
| **Database-per-tenant** | Máximo aislamiento | Solo enterprise compliance |

## Anti-patterns

- DDL y data migration en mismo archivo
- DROP COLUMN sin período de gracia (≥1 release)
- CREATE INDEX sin CONCURRENTLY en tablas grandes
- Sin `.down.sql`
- Backfill síncrono un solo UPDATE sobre millones
- Editar migration ya mergeada
- ADD COLUMN NOT NULL DEFAULT volátil en tabla grande
- Correr en prod sin staging previo
- Seeds mezclados con migrations productivas
- Asumir ALTER TYPE es gratis (reescribe tabla)
- Orden alfabético en vez de timestamp UTC
- Rollback en prod sin validar `.down.sql`

## Checklist

- [ ] Naming: `YYYYMMDDHHMMSS_description.up.sql` + `.down.sql`
- [ ] Un cambio lógico por migration
- [ ] DDL y data migration en archivos separados
- [ ] Índices con CONCURRENTLY
- [ ] `lock_timeout` en ALTER sobre tablas grandes
- [ ] `.down.sql` existe o documenta one-way
- [ ] CI verifica up → down → up
- [ ] Staging OK con métricas de tiempo
- [ ] Breaking: plan expand-contract + tickets por fase
- [ ] Backfills idempotentes, con checkpoints, batcheados
- [ ] Multi-tenant: runner itera o migration tenant-agnóstica
- [ ] PR describe impacto, riesgo, plan rollback

## Delegación

- `/db-diagram` — ER diagram post-migration
- `/deploy-check` — checklist deploy con migration
- `/audit-dev` — revisión integral migrations acumuladas
- `/scaffold-go` — setup golang-migrate en proyecto nuevo
