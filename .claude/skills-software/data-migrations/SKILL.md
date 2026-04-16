---
name: data-migrations
description: Estrategia y ejecución de migraciones de base de datos en Educabot (Postgres default). Cubre schema migrations (DDL), data migrations (DML), patrones zero-downtime (expand-contract), rollbacks, locks, índices CONCURRENTLY, batching y multi-tenant. Usar cuando se mencione migration, migración, schema change, alter table, drop column, backfill, zero-downtime, rollback de DB.
---

# Data Migrations — Educabot

Guía operativa para crear, revisar y ejecutar migraciones de base de datos sin romper producción. Stack default Educabot: **Postgres** con **golang-migrate** (Go) o **Prisma Migrate** (Node/TS).

---

## Cuándo usar

- Cambios de schema: `CREATE TABLE`, `ALTER TABLE`, `ADD COLUMN`, índices
- Data migrations: backfills, transformaciones, normalizaciones
- Rename/drop de columnas o tablas en producción
- Cambios de tipo (`ALTER TYPE`, `ALTER COLUMN TYPE`)
- Split/merge de tablas
- Migraciones multi-tenant

## Cuándo NO usar

- Seeds de datos de prueba (usar fixtures/seeders separados)
- Cambios en lookup tables triviales de dev local (usar seed)
- Scripts one-shot de limpieza manual en prod (usar job controlado, no migration)
- Cambios de configuración de la app (eso va en env/config, no en DB)

---

## 1. Herramientas por stack

### Go (default Educabot)
- **`golang-migrate/migrate`** — standard. CLI + librería embebible.
- Archivos: `migrations/NNNNNNNNNNNNNN_nombre.up.sql` + `.down.sql`
- Invocación: `migrate -path ./migrations -database "$DATABASE_URL" up`

### Node / TypeScript
- **Prisma Migrate** (default Educabot para Node) — si el proyecto usa Prisma como ORM
- **`node-pg-migrate`** — si se usa `pg` directo sin ORM
- **`drizzle-kit`** — si el stack es Drizzle ORM

Criterio: alinear la herramienta con el ORM ya elegido. No mezclar dos sistemas de migrations en el mismo repo.

---

## 2. Naming y estructura

Formato canónico:

```
YYYYMMDDHHMMSS_description.up.sql
YYYYMMDDHHMMSS_description.down.sql
```

Ejemplos:

```
20260415103000_add_users_email_verified_at.up.sql
20260415103000_add_users_email_verified_at.down.sql
20260415104500_create_index_users_email.up.sql
20260415104500_create_index_users_email.down.sql
```

Reglas:
- Timestamp UTC, no números secuenciales (evita conflictos entre ramas)
- `description` en snake_case, empieza con verbo (`add_`, `create_`, `drop_`, `alter_`, `backfill_`)
- Una migración = un cambio lógico atómico
- **Nunca editar una migración ya mergeada a main** — crear una nueva

---

## 3. Zero-downtime: patrón expand-contract

Todo cambio breaking se divide en múltiples releases. **Nunca** en un solo deploy.

### Fases

1. **Expand** — agregar lo nuevo sin tocar lo viejo
   - Columna nueva `NULLABLE` o con `DEFAULT`
   - Tabla nueva
   - Índice nuevo (`CONCURRENTLY`)

2. **Backfill** — rellenar los datos
   - Job en background, idempotente, con batching
   - Nunca en la misma migration que el DDL

3. **Dual-write** — la app escribe en viejo Y nuevo
   - Deploy de código que mantiene ambos sincronizados
   - Permite rollback sin perder datos

4. **Migrate reads** — la app lee del nuevo
   - Deploy donde las lecturas apuntan al campo/tabla nuevo
   - El viejo queda como "solo escritura" por un tiempo

5. **Contract** — drop de lo viejo en un release posterior
   - Solo después de validar que nadie lee del viejo
   - Período de gracia mínimo: 1 release completo en prod estable

### Breaking changes que SIEMPRE van multi-step

- `DROP COLUMN` — primero stop-writing, luego stop-reading, luego drop
- `ALTER COLUMN TYPE` con conversión lossy — nueva columna + backfill + swap
- `RENAME COLUMN` / `RENAME TABLE` — alias/vista temporal o expand-contract
- `NOT NULL` sobre columna existente — agregar check constraint NOT VALID, validar, luego NOT NULL
- Cambio de PK / FK

---

## 4. Índices en Postgres

- **Siempre** `CREATE INDEX CONCURRENTLY` en tablas con datos reales (no bloquea escrituras)
- `CONCURRENTLY` **no puede** correr dentro de una transacción
- golang-migrate envuelve cada archivo en transacción por default — usar directiva `-- +migrate NoTransaction` o separar en su propia migration sin `BEGIN/COMMIT`
- En Prisma: usar `--create-only` y editar el SQL manualmente para agregar `CONCURRENTLY`
- Si el índice falla (ej. violación de UNIQUE), queda como `INVALID` — hay que `DROP INDEX` y reintentar

Ejemplo migration de índice:

```sql
-- 20260415104500_create_index_users_email.up.sql
-- +migrate NoTransaction
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users (email);
```

---

## 5. Locks y timeouts

`ALTER TABLE` toma `ACCESS EXCLUSIVE LOCK` — bloquea lecturas y escrituras. En tablas grandes o con tráfico alto, puede tumbar el servicio.

### Patrón seguro

```sql
SET lock_timeout = '5s';
SET statement_timeout = '30s';
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP NULL;
```

- Si no consigue el lock en 5s, falla rápido sin bloquear en cola
- Reintentar en backoff desde el runner de migrations, no bloquear indefinidamente
- `ADD COLUMN` con `DEFAULT` no-volátil es instantáneo desde PG 11 (solo actualiza catálogo)
- `ADD COLUMN NOT NULL DEFAULT <volátil>` reescribe toda la tabla — evitar

---

## 6. Data migrations grandes (batching)

Nunca `UPDATE ... WHERE ...` sobre una tabla de millones sin batching — genera locks largos, WAL gigante y puede saturar replicación.

### Patrón

```sql
-- Idempotente, batcheable, reentrante
UPDATE users
SET normalized_email = LOWER(email)
WHERE id IN (
  SELECT id FROM users
  WHERE normalized_email IS NULL
    AND id > :last_id
  ORDER BY id
  LIMIT 10000
);
```

Reglas:
- Batch size: **10k rows** default (ajustar según tamaño de fila y carga)
- Usar `id > last_id` (keyset pagination), nunca `OFFSET`
- Checkpoint persistente: guardar `last_id` procesado en tabla de control
- Idempotente: correr N veces debe dar el mismo resultado
- Correr como **job** separado de la migration de schema, no inline
- Pausas entre batches (100-500ms) para no saturar
- Observabilidad: log de progreso, métricas de throughput

---

## 7. Rollback

**Pregunta obligatoria**: ¿esta migration es reversible?

- DDL aditivo (`ADD COLUMN`, `CREATE TABLE`, `CREATE INDEX`) → reversible con `DROP`
- DDL destructivo (`DROP COLUMN`, `DROP TABLE`) → **one-way**, el down no puede recuperar datos
- Data migrations con transformación lossy → **one-way**

Reglas:
- **Siempre** escribir archivo `.down.sql`, aunque sea un `-- NO-OP: esta migration no es reversible, los datos se perdieron`
- Documentar en comentario al inicio del `.up.sql` si es one-way
- Para one-way críticos: backup previo obligatorio, documentado en el ticket

---

## 8. Staging y CI

### Staging
- Staging = subset anonimizado de producción (nunca datos reales sin PII scrubbing)
- Correr toda migration en staging antes que prod
- Medir tiempo de ejecución en staging como proxy del tiempo en prod (con caveat de volumen)

### CI (obligatorio en PR)
- `migrate up` desde schema limpio → debe pasar
- `migrate down` hasta la migration del PR → debe pasar (valida reversibilidad)
- `migrate up` otra vez → debe pasar (valida idempotencia)
- Lint SQL: `sqlfluff` o similar si está configurado

---

## 9. Multi-tenant

### Shared schema (tenant_id en cada tabla)
- Una migration global corre una vez, aplica a todos los tenants
- Backfills deben considerar todos los `tenant_id`
- Es el patrón default en Educabot para productos SaaS

### Schema-per-tenant
- Una migration corre N veces (una por schema)
- Runner debe iterar sobre la lista de tenants activos
- Fallo parcial: trackear qué tenants ya migraron, reintentar solo los pendientes
- Más costoso operacionalmente, justificar bien antes de elegirlo

### Database-per-tenant
- Mismo esquema que schema-per-tenant pero aún más aislado
- Solo para tenants enterprise con requerimientos de compliance

---

## 10. Seeds vs migrations

- **Seeds** = datos de desarrollo/test. Nunca corren en producción.
- **Migrations** = cambios de estructura + data migrations de producción.
- **Excepción**: lookup tables estables (países, roles del sistema, tipos de evento) pueden ir en migration si son parte del contrato de la app.
- Seeds viven en `seeds/` o `fixtures/`, separados de `migrations/`.

---

## Anti-patterns

- DDL (`ALTER TABLE`) y data migration (`UPDATE ...`) en el mismo archivo
- `DROP COLUMN` sin período de gracia (al menos un release completo entre "stop writing" y "drop")
- `CREATE INDEX` sin `CONCURRENTLY` en tablas grandes
- Migration sin archivo `.down.sql` (aunque sea NO-OP documentado)
- Backfill síncrono con un solo `UPDATE` sobre tabla de millones
- Editar migration ya mergeada a `main`
- `ADD COLUMN NOT NULL DEFAULT <valor volátil>` en tabla grande (reescribe tabla completa, lock largo)
- Correr migration directamente en prod sin haberla corrido antes en staging
- Seeds de datos de prueba mezclados con migrations productivas
- Asumir que `ALTER TYPE` es gratis — reescribe la tabla
- Depender de orden alfabético en lugar de timestamp UTC para ordenar migrations
- Hacer rollback en prod sin haber validado el `.down.sql` antes

---

## Checklist antes de mergear migration

- [ ] Naming correcto: `YYYYMMDDHHMMSS_description.up.sql` + `.down.sql`
- [ ] Un solo cambio lógico por migration
- [ ] DDL y data migration separados en archivos distintos
- [ ] Índices usan `CONCURRENTLY` si la tabla tiene datos
- [ ] `lock_timeout` seteado en `ALTER TABLE` sobre tablas grandes
- [ ] `.down.sql` existe (o documenta one-way explícitamente)
- [ ] CI verifica `up → down → up`
- [ ] Corrida en staging OK, con métricas de tiempo
- [ ] Si es breaking: plan expand-contract documentado, tickets para las fases siguientes
- [ ] Backfills son idempotentes, con checkpoints, batcheados
- [ ] Multi-tenant: runner sabe iterar o migration es tenant-agnóstica
- [ ] PR describe impacto, riesgo, y plan de rollback

---

## Output esperado

Cuando se usa este skill, producir:

- Archivos `.up.sql` y `.down.sql` con naming correcto
- Comentarios en cabecera: qué hace, reversibilidad, riesgo de lock
- Plan de fases si es breaking change (markdown con pasos por release)
- Script de backfill separado si aplica, con pseudocódigo de batching
- Línea en el PR description con checklist cumplida

Ejemplo de output mínimo:

```
migrations/
  20260415103000_add_users_email_verified_at.up.sql
  20260415103000_add_users_email_verified_at.down.sql
docs/migrations/
  email_verified_at_rollout.md   (plan expand-contract si aplica)
jobs/
  backfill_email_verified_at.go  (si requiere backfill)
```

---

## Delegación

- **`/db-diagram`** — generar ER diagram actualizado post-migration
- **`/deploy-check`** — validar que la migration esté incluida en el checklist de deploy
- **`/audit-dev`** — revisión integral cuando hay muchas migrations acumuladas
- **`/scaffold-go`** — setup inicial de golang-migrate en proyecto nuevo
- **`run-migrations`** — ejecutar migrations en entorno local/staging
- **`local-database-setup`** — preparar DB local antes de probar migrations
