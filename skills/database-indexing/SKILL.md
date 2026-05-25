---
name: database-indexing
description: "PostgreSQL indexing: B-tree, GIN, GiST, composite, partial, covering, CONCURRENTLY, bloat detection."
category: "database"
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

B-tree (default, 95% de casos), GIN (arrays/jsonb/tsvector), GiST (geo/ranges), BRIN (tablas enormes ordenadas), Partial (filtro en definición), Covering/INCLUDE, Expression.

> → Read references/index-types.md for detailed type comparison table and JSONB indexing guide

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

## Multi-tenant Educabot

Todo índice compuesto debe empezar por `tenant_id` para que RLS y queries filtradas lo aprovechen. Patrón: `(tenant_id, student_id, period_id)`.

## Anti-patterns

> → Read references/anti-patterns.md for 12 common indexing anti-patterns

## Checklist

> → Read references/checklists.md for pre-creation checklist (11 items) and periodic maintenance checklist (5 items)

## Delegación

- `/query-optimization` — análisis de query lenta puntual
- `/search-setup` — full-text search (tsvector, GIN)
- `/data-migrations` — migraciones sin downtime, separación CONCURRENTLY
- `/db-diagram` — diagramar schema
