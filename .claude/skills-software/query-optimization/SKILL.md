---
name: query-optimization
description: "Optimización queries SQL en PostgreSQL 15+. EXPLAIN ANALYZE, pg_stat_statements, N+1, paginación, índices, CTEs, LATERAL joins. Stack Educabot Go+TS."
argument-hint: "[path-to-sql-or-migration, or query]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# Query Optimization (PostgreSQL)

**Regla:** sin EXPLAIN ANALYZE, no hay optimización. Todo cambio validado contra plan real.

## EXPLAIN ANALYZE — Qué buscar

| Señal | Problema | Acción |
|-------|----------|--------|
| `Seq Scan` en tabla grande | Falta índice | Crear índice compuesto |
| `Nested Loop` con muchas inner rows | Mal plan de join | Índice en columna de join |
| `rows=` estimado vs actual >10x | Estadísticas desactualizadas | `ANALYZE tabla;` |
| `Buffers: read >> hit` | Working set > shared_buffers | Índice faltante |
| `Rows Removed by Filter: N` alto | Filtro post-scan | Índice parcial o reescritura |

Herramientas: `pg_stat_statements` (top queries), Cloud SQL Query Insights, `auto_explain`, pgbadger.

## Patrones Comunes y Fix

### N+1

Loop en ORM → batch con `WHERE curso_id = ANY($1::bigint[])`. TS/Prisma: `include: {}` o DataLoader.

### SELECT *

Rompe index-only scans, más I/O. Siempre columnas explícitas.

### OFFSET grande (paginación)

`OFFSET 100000` = escanear y descartar 100k rows. Usar **keyset pagination**:
`WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 20`

### COUNT(*) exacto en tablas grandes

Alternativa: `reltuples` de `pg_class` para estimación. O índice covering.

### LIKE '%foo%'

B-tree no sirve. Usar `pg_trgm` + GIN para substring, o `tsvector` para full-text.

### Funciones en WHERE

`WHERE date(created_at) = '...'` no usa índice. Usar range: `WHERE created_at >= X AND created_at < Y`

### OR con columnas distintas

Reescribir como `UNION ALL`.

### Subqueries correlacionadas

Reescribir como `JOIN + GROUP BY`.

## Join Planning

- Postgres reordena joins hasta 8 tablas (`join_collapse_limit`). Más allá, orden escrito gana
- CTEs: `MATERIALIZED` = barrera (se ejecuta 1 vez), `NOT MATERIALIZED` = inline
- `LATERAL` join para top N por grupo (e.g. últimas 3 calificaciones por alumno)
- Parallel query: verificar `Gather` en EXPLAIN. Si no aparece → funciones VOLATILE o config

## Estadísticas

- `ANALYZE tablename;` tras bulk loads. Autovacuum normalmente alcanza
- Multi-column statistics para columnas correlacionadas: `CREATE STATISTICS stx ON col1, col2 FROM tabla;`

## Materialized Views

Para reportes agregados pesados no-realtime. `REFRESH CONCURRENTLY` requiere índice único.

## Connection Pooling

- Go: `pgxpool` (tamaño: `num_cpus * 2` a `4`). TS: `pg.Pool` o Prisma
- Muchas conexiones cortas → PgBouncer transaction mode
- Más conexiones ≠ más throughput

## Multi-tenant

- Siempre filtrar por `tenant_id` primero
- Índices compuestos que empiezan por `tenant_id`: `(tenant_id, curso_id)`
- RLS como red de seguridad

## Anti-patterns

- Optimizar sin EXPLAIN ANALYZE, agregar índice sin verificar cambio de plan
- ORM `findAll()` + filtrar en memoria, `SELECT *`, OFFSET grande
- `COUNT(*)` exacto cuando UI solo necesita "más de 10k"
- N+1 invisible, sin `ANALYZE` post bulk load, no monitorear `pg_stat_statements`
- Pool sin tunear, funciones sobre columnas indexadas, queries sin `tenant_id`

## Checklist

- [ ] EXPLAIN ANALYZE baseline capturado
- [ ] Nodos problemáticos identificados (Seq Scan, Nested Loop, Rows Removed)
- [ ] Estimado vs actual rows verificado (>10x → ANALYZE)
- [ ] Índice diseñado (composite, partial, covering, funcional)
- [ ] Patrones anti reescritos (SELECT *, OFFSET, N+1, subquery correlacionada)
- [ ] Nuevo EXPLAIN ANALYZE validado — plan cambió como esperado
- [ ] Mejora medida en ms
- [ ] No rompió otras queries
- [ ] Query crítica agregada a observabilidad
- [ ] PR documentado: query antes/después, plan, impacto
