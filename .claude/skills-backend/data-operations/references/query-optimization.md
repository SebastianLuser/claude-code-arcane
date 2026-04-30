# Query Optimization Details - Data Operations

## EXPLAIN Signal Reference

| Signal en plan | Significa | Accion |
|---------------|-----------|--------|
| Seq Scan tabla grande | Falta indice | Crear indice -> `/database-setup` |
| rows estimado vs actual >10x | Stats desactualizadas | `ANALYZE tabla;` |
| Buffers shared read alto | Working set > shared_buffers | Tune config o reducir resultado |
| Rows Removed by Filter grande | Indice no filtra suficiente | Partial o covering index |
| Sort external merge | Sort no cabe en work_mem | Aumentar work_mem o indice ORDER BY |

Top queries lentas: `pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20`. Cloud managed: Query Insights / Performance Insights.

## Common Problems

| Problema | Fix | Excepcion |
|----------|-----|-----------|
| **N+1** | JOIN, subquery, DataLoader/Preload | Relacion rara vez accedida |
| **SELECT \*** | Solo columnas necesarias | Tablas chicas pocas columnas |
| **OFFSET pagination** | Cursor keyset: `WHERE id > $last ORDER BY id LIMIT N` | Tablas <1k o admin panels |
| **COUNT(\*)** en listados | Cachear, aproximar (`reltuples`), eliminar | Count exacto requisito negocio |
| **OR columnas distintas** | UNION ALL de queries indexadas | Pocas rows |
| **Funcion en WHERE** | Expression index | Funcion ya indexada |
| **Subquery correlacionada** | Reescribir como JOIN o LATERAL | Scalar subquery OK |

## CTEs

`WITH x AS MATERIALIZED (...)` fuerza ejecucion separada — util cuando PG inline CTE pierde filtro. Desde PG 12 optimizer decide auto; forzar solo si EXPLAIN muestra plan peor.

## LATERAL Joins (top-N por grupo)

`CROSS JOIN LATERAL (SELECT ... WHERE fk = parent.id ORDER BY col DESC LIMIT N)`. Requiere indice en `(fk, col DESC)`.

## Materialized Views

`CREATE MATERIALIZED VIEW` + unique index -> `REFRESH CONCURRENTLY` (no bloquea reads). Refresh via cron o trigger segun tolerancia staleness. No usar si datos necesitan ser real-time.
