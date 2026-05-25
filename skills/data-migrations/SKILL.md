---
name: data-migrations
description: "DB migrations Postgres: DDL/DML, expand-contract zero-downtime, rollbacks, locks, CONCURRENTLY, batching, multi-tenant."
category: "database"
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

Todo breaking change se divide en múltiples releases (expand → backfill → dual-write → migrate reads → contract).

> → Read references/expand-contract.md for fases detalladas y breaking changes multi-step

## Índices

- **Siempre** `CREATE INDEX CONCURRENTLY` en tablas con datos (no bloquea writes)
- No puede correr dentro de transacción — usar `-- +migrate NoTransaction` (golang-migrate) o `--create-only` + editar SQL (Prisma)
- Si falla: queda INVALID → DROP INDEX → reintentar

## Locks y timeouts

`ALTER TABLE` toma ACCESS EXCLUSIVE LOCK. Patrón seguro: `SET lock_timeout = '5s'; SET statement_timeout = '30s';` antes del ALTER. Si no consigue lock → falla rápido → retry con backoff. `ADD COLUMN` con DEFAULT no-volátil es instantáneo desde PG 11. `ADD COLUMN NOT NULL DEFAULT <volátil>` reescribe tabla — evitar.

## Batching (data migrations grandes)

Keyset pagination (`id > last_id`), batch 10k, checkpoints, idempotente, job separado.

> → Read references/batching.md for reglas completas de batching

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

> → Read references/anti-patterns.md for lista completa (12 items)

## Delegación

- `/db-diagram` — ER diagram post-migration
- `/deploy-check` — checklist deploy con migration
- `/audit-dev` — revisión integral migrations acumuladas
- `/scaffold-go` — setup golang-migrate en proyecto nuevo

## Checklist

> → Read references/checklist.md for checklist completo (12 items)

- [ ] Expand-contract pattern used for all breaking schema changes
- [ ] Both `.up.sql` and `.down.sql` files exist for every migration
- [ ] `lock_timeout` and `statement_timeout` configured before ALTER statements
- [ ] Migration tested and timed in staging with production-like data
- [ ] Rollback verified by running `.down.sql` then `.up.sql` again
- [ ] Indexes created with `CONCURRENTLY` outside transactions on populated tables
