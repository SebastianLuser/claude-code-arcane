---
name: database-indexing
description: Diseño y mantenimiento de índices en PostgreSQL 15+. Tipos de índices, composite, partial, covering, CONCURRENTLY, detección de faltantes/no usados, bloat. Usar cuando se mencione índices, index, performance de queries por índices, seq scan, slow query por falta de índice, EXPLAIN.
stack: PostgreSQL 15+
argument-hint: "[analyze|create|drop] [table]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Database Indexing (PostgreSQL)

Diseñar, crear y mantener índices en Postgres 15+ en contexto multi-tenant Educabot.

## Cuándo usar / NO usar

| Usar | NO usar |
|------|---------|
| Queries lentas con Seq Scan en tablas grandes | Tablas <10k rows (Seq Scan suele ganar) |
| Schema nuevo: planificar índices | Booleans/enums baja cardinalidad (usar partial) |
| Revisión periódica: faltantes/no usados | Alta write, pocas reads |
| Bloat, REINDEX necesario | Full-text search → `/search-setup` |
| Multi-tenant: `tenant_id` primera columna composite | Query puntual lenta → `/query-optimization` |

## Tipos de índices

| Tipo | Uso | Notas |
|------|-----|-------|
| **B-tree** (default) | Equality, range, ORDER BY, UNIQUE | 95% de los casos |
| **Hash** | Skip — B-tree es igual o mejor | No recomendado |
| **GIN** | Arrays, jsonb, tsvector | Usar `jsonb_path_ops` si solo `@>` (4x más chico) |
| **GiST** | Geo (PostGIS), ranges, exclusion | Para datos espaciales/temporales |
| **BRIN** | Tablas enormes ordenadas físicamente | Timestamps, IDs secuenciales; tamaño mínimo |
| **Partial** | `WHERE` en definición | Soft-deletes, flags; reduce tamaño |
| **Covering** (`INCLUDE`) | Columnas extra en leaf | Habilita Index-Only Scan sin ir a heap |
| **Expression** | Funciones sobre columna | `lower(email)` — query debe matchear la expresión |

## Cuándo crear

- `WHERE` con alta selectividad (>100 rows devueltos dilute beneficio)
- `JOIN` (especialmente FKs)
- `ORDER BY` / `GROUP BY` frecuentes
- Constraints `UNIQUE`
- Regla: query frecuente que escanea miles para devolver pocos → indexar

## Composite indexes

Un índice `(a, b, c)` sirve para `a`, `a,b`, `a,b,c` — NO para `b`, `c`, o `b,c` solos (leftmost prefix).

**Orden de columnas:** igualdad primero (`tenant_id =`) → rango después (`created_at >`) → `ORDER BY` al final.

## CONCURRENTLY en producción

**Obligatorio** en tablas grandes: no bloquea writes. No puede correr dentro de transacción — separar en su propia migration. Si falla queda índice `INVALID` → detectar con `pg_index WHERE NOT indisvalid` → `DROP INDEX CONCURRENTLY`.

## Detectar faltantes

Consultar `pg_stat_user_tables` donde `seq_scan > idx_scan AND n_live_tup > 10000`. Luego revisar queries reales con `pg_stat_statements`.

## Detectar no usados

Consultar `pg_stat_user_indexes` donde `idx_scan = 0` tras **1 mes** de observación. `DROP INDEX CONCURRENTLY`. Excepción: índices únicos que respaldan constraints.

## Foreign keys

Postgres **no** crea índice automático en columnas FK. Sin índice cada DELETE/UPDATE en parent hace seq scan de child. Siempre crear índice en child FK.

## EXPLAIN post-creación

Verificar con `EXPLAIN (ANALYZE, BUFFERS)`. Planes esperables: Index Scan, Index Only Scan (ideal), Bitmap Heap Scan. Si Seq Scan → índice no se usa. Ver `/query-optimization`.

## Bloat y REINDEX

B-tree se bloatea con updates/deletes. Monitorear con `pgstattuple`. Reparar: `REINDEX INDEX CONCURRENTLY` o `pg_repack`. Agendar trimestral para índices calientes.

## JSONB indexing

- `@>` (contains): GIN con `jsonb_path_ops` (4x más chico que default)
- Solo si necesitás `?`, `?&`, `?|`: GIN default
- Un solo key: expression index `((preferences->>'role'))` mejor que indexar todo jsonb

## Multi-tenant Educabot

Todo índice compuesto debe empezar por `tenant_id` para que RLS y queries filtradas lo aprovechen. Patrón: `(tenant_id, student_id, period_id)`.

## Anti-patterns

- Indexar "por las dudas" — cada índice cuesta writes y espacio
- `CREATE INDEX` sin `CONCURRENTLY` en prod (bloquea writes)
- Orden incorrecto en composite (`created_at, tenant_id` cuando siempre filtrás por tenant primero)
- Expression mismatch: `WHERE lower(email)` sin expression index
- Índice redundante: `(a, b)` + `(a)` — segundo ya cubierto
- No indexar child FK
- No correr `EXPLAIN ANALYZE` post-creación
- Hash index (usar B-tree)
- GIN sin `jsonb_path_ops` cuando solo usás `@>`
- Nunca REINDEX — bloat acumula degradación
- Indexar booleans sin partial
- Drop sin período observación (≥1 mes)

## Checklist pre-creación

- [ ] Tabla >10k rows
- [ ] Queries concretas identificadas
- [ ] EXPLAIN actual muestra Seq Scan costoso
- [ ] Orden composite: igualdad → rango → ORDER BY
- [ ] `tenant_id` primera columna
- [ ] Partial si filtro recurrente (`deleted_at IS NULL`, `status = 'active'`)
- [ ] `INCLUDE` si query solo toca columnas indexables
- [ ] FK tiene su propio índice
- [ ] `CONCURRENTLY` y migration fuera de transacción
- [ ] Post-creación: EXPLAIN ANALYZE confirma plan
- [ ] No redundante con índice existente

## Checklist periódica

- [ ] `idx_scan = 0` tras 1 mes → candidato a drop
- [ ] Tablas con `seq_scan >> idx_scan` → índice faltante
- [ ] Índices INVALID detectados y dropeados
- [ ] Bloat medido en índices calientes
- [ ] REINDEX CONCURRENTLY de bloated

## Delegación

- `/query-optimization` — análisis de query lenta puntual
- `/search-setup` — full-text search (tsvector, GIN)
- `/data-migrations` — migraciones sin downtime, separación CONCURRENTLY
- `/db-diagram` — diagramar schema
