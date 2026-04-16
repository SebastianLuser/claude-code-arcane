---
name: query-optimization
description: Optimización de queries SQL en PostgreSQL 15+. Leer EXPLAIN ANALYZE, detectar queries lentas con pg_stat_statements, fixear N+1, paginación, índices, CTEs, LATERAL joins. Stack Educabot Go+TS. Usar cuando se mencione query lenta, slow query, EXPLAIN, performance DB, timeout, N+1, optimizar SQL, pg_stat_statements.
---

# Query Optimization (PostgreSQL)

Skill para diagnosticar y optimizar queries SQL lentas en Postgres 15+ dentro del stack Educabot (Go + TypeScript, Cloud SQL GCP).

## Cuándo usar

- Una query tarda más de lo esperado (>100ms en OLTP, >1s en reporting)
- Dashboard docente / panel admin lento
- Timeouts intermitentes en endpoints de listado/búsqueda
- Revisión previa a deploy de queries nuevas
- Planificación de índices post bulk load / migración
- Detección proactiva de regresiones (top queries de `pg_stat_statements`)

## Cuándo NO usar

- El cuello de botella no es la DB (medir antes: APM, logs, latencia de red)
- Problemas de diseño de schema profundo → usar `/db-diagram` + revisión arquitectónica
- Creación de índices nuevos como única acción → ver `/database-indexing`
- Migraciones de datos que reescriben tablas → ver `/data-migrations`

---

## 1. Medir antes de optimizar

Regla: **sin EXPLAIN, no hay optimización**. Todo cambio debe validarse contra un plan real.

### 1.1 EXPLAIN ANALYZE BUFFERS

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
SELECT s.id, s.nombre, c.nombre AS curso
FROM alumnos s
JOIN cursos c ON c.id = s.curso_id
WHERE s.tenant_id = $1 AND s.activo = true
ORDER BY s.created_at DESC
LIMIT 50;
```

Cómo leer el output:

- **`Seq Scan` sobre tabla grande** → probable falta de índice (ok en tablas chicas <10k rows)
- **`Nested Loop` con muchas rows en el inner** → mal plan de join; suele mejorar con índice en la columna de join o reescribir
- **`Hash Join`** → generalmente bueno para joins de igualdad con datasets medianos/grandes
- **`Merge Join`** → bueno cuando ambos lados ya vienen ordenados (o hay índices que lo proveen)
- **`rows=` estimado vs `actual rows`** → si difieren >10x las estadísticas están desactualizadas → `ANALYZE tabla;`
- **`Buffers: shared hit=X read=Y`** → `hit` es cache (barato), `read` es disco (caro). Mucho `read` repetido en queries calientes = índice faltante o working set > shared_buffers
- **`Rows Removed by Filter: N`** → filtros aplicados post-scan; candidato a índice parcial o reescritura

Visualizar planes complejos: copiar/pegar en [explain.dalibo.com](https://explain.dalibo.com).

### 1.2 Detectar queries lentas: `pg_stat_statements`

Extensión estándar (habilitada en Cloud SQL vía flag `cloudsql.enable_pg_stat_statements`).

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT
  query,
  calls,
  ROUND(mean_exec_time::numeric, 2)  AS mean_ms,
  ROUND(total_exec_time::numeric, 2) AS total_ms,
  rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

- **Cloud SQL Query Insights** (GCP): dashboard automático con top queries, sin setup manual. Primer lugar a mirar en prod.
- **auto_explain**: para logging automático de planes lentos.
  ```
  shared_preload_libraries = 'auto_explain'
  auto_explain.log_min_duration = 500ms
  auto_explain.log_analyze = on
  auto_explain.log_buffers = on
  ```
- **pgbadger**: analizar logs de Postgres offline y generar reporte HTML.

---

## 2. Patrones comunes y cómo fixearlos

### 2.1 N+1 queries

Síntoma clásico del ORM: 1 query por cada row de la lista padre.

```go
// ❌ N+1
for _, curso := range cursos {
    db.Where("curso_id = ?", curso.ID).Find(&alumnos)
}
```

```go
// ✅ Batch
var ids []int64
for _, c := range cursos { ids = append(ids, c.ID) }
db.Where("curso_id = ANY(?)", pq.Array(ids)).Find(&alumnos)
```

SQL equivalente:

```sql
SELECT * FROM alumnos WHERE curso_id = ANY($1::bigint[]);
```

En TS/Prisma: `include: { alumnos: true }` (eager) o DataLoader para GraphQL.

### 2.2 `SELECT *`

Nunca en producción:

- Rompe index-only scans (el índice puede no cubrir todas las columnas)
- Más I/O y más ancho de banda
- Frágil ante `ALTER TABLE ADD COLUMN`

```sql
-- ❌
SELECT * FROM alumnos WHERE tenant_id = $1;

-- ✅
SELECT id, nombre, email FROM alumnos WHERE tenant_id = $1;
```

### 2.3 `OFFSET` grande (pagination)

`OFFSET 100000` le dice a Postgres: "escaneá y descartá 100k rows". Fatal.

```sql
-- ❌ offset-based
SELECT id, nombre, created_at
FROM actividades
ORDER BY created_at DESC
LIMIT 20 OFFSET 100000;

-- ✅ keyset pagination (cursor)
SELECT id, nombre, created_at
FROM actividades
WHERE (created_at, id) < ($1, $2)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

Necesita índice compuesto `(created_at DESC, id DESC)`.

### 2.4 `COUNT(*)` exacto en tablas grandes

```sql
-- ❌ caro en tablas con millones de rows
SELECT COUNT(*) FROM eventos WHERE tenant_id = $1;

-- ✅ estimación rápida (ok para "sobre ~12k resultados")
SELECT reltuples::bigint AS approx_rows
FROM pg_class WHERE relname = 'eventos';

-- ✅ exacto con filtro → requiere índice covering
CREATE INDEX idx_eventos_tenant ON eventos(tenant_id) INCLUDE (id);
```

### 2.5 `ORDER BY` sin `LIMIT` en tablas enormes

Postgres tiene que ordenar todo el resultset. Siempre paginar.

### 2.6 `LIKE '%foo%'`

B-tree no sirve (solo prefix `'foo%'`). Opciones:

```sql
-- ✅ pg_trgm + GIN para substring search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_alumnos_nombre_trgm
  ON alumnos USING GIN (nombre gin_trgm_ops);

SELECT * FROM alumnos WHERE nombre ILIKE '%perez%';

-- ✅ full-text search para búsquedas tipo buscador
ALTER TABLE actividades ADD COLUMN tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('spanish', titulo || ' ' || descripcion)) STORED;
CREATE INDEX idx_actividades_tsv ON actividades USING GIN(tsv);

SELECT * FROM actividades WHERE tsv @@ plainto_tsquery('spanish', 'fracciones');
```

### 2.7 Funciones en `WHERE` rompen el índice

```sql
-- ❌ no usa índice en created_at
WHERE date(created_at) = '2026-04-15'

-- ✅ usa el índice
WHERE created_at >= '2026-04-15'
  AND created_at <  '2026-04-16'
```

Alternativa: índice funcional `CREATE INDEX ... ON t (date(created_at));` solo si se repite mucho.

### 2.8 `OR` con columnas distintas

El planner suele elegir mal. Reescribir:

```sql
-- ❌
SELECT * FROM alumnos
WHERE email = $1 OR dni = $2;

-- ✅
SELECT * FROM alumnos WHERE email = $1
UNION ALL
SELECT * FROM alumnos WHERE dni = $2 AND email IS DISTINCT FROM $1;
```

### 2.9 Subqueries correlacionadas

```sql
-- ❌ correlacionada, se ejecuta por row
SELECT c.id,
  (SELECT COUNT(*) FROM alumnos a WHERE a.curso_id = c.id) AS total
FROM cursos c;

-- ✅ JOIN + GROUP BY
SELECT c.id, COUNT(a.id) AS total
FROM cursos c
LEFT JOIN alumnos a ON a.curso_id = c.id
GROUP BY c.id;
```

---

## 3. Join planning

- Postgres reordena joins automáticamente hasta **8 tablas** (`join_collapse_limit = 8`). Más allá, el orden escrito gana.
- **No hay hints nativos**. Si el plan es malo: reescribir (CTE materializada, subquery, o partir la query).
- Asegurar índices en **ambos lados** de las columnas de join.

### 3.1 CTEs: `MATERIALIZED` vs `NOT MATERIALIZED`

Desde PG 12 los CTE se inlinean por default cuando se usan 1 vez. Forzar comportamiento cuando importa:

```sql
WITH top_alumnos AS MATERIALIZED (      -- barrera de optimización, se ejecuta 1 vez
  SELECT alumno_id, SUM(puntos) pts
  FROM puntajes
  WHERE periodo = '2026-T1'
  GROUP BY alumno_id
)
SELECT a.nombre, t.pts
FROM top_alumnos t
JOIN alumnos a ON a.id = t.alumno_id
ORDER BY t.pts DESC LIMIT 10;
```

Usar `NOT MATERIALIZED` para permitir inline (mejor si el CTE es filtrado después).

### 3.2 `LATERAL` join — top N por grupo

Caso clásico: **últimas 3 calificaciones por alumno**.

```sql
SELECT a.id, a.nombre, c.*
FROM alumnos a
LEFT JOIN LATERAL (
  SELECT id, nota, created_at
  FROM calificaciones
  WHERE alumno_id = a.id
  ORDER BY created_at DESC
  LIMIT 3
) c ON true
WHERE a.tenant_id = $1;
```

Requiere índice `(alumno_id, created_at DESC)`.

### 3.3 Parallel query

Automático cuando:
- `max_parallel_workers_per_gather > 0`
- La tabla es grande
- La query se considera "parallel-safe"

Verificar en EXPLAIN: buscar `Gather` / `Gather Merge` + `Workers Planned`. Si se espera paralelismo y no aparece → revisar funciones marcadas `VOLATILE` o configuración.

---

## 4. Estadísticas y planner

- `ANALYZE tablename;` tras bulk loads / migraciones grandes. Autovacuum normalmente alcanza.
- **Multi-column statistics** para columnas correlacionadas (ej: `provincia` y `ciudad`):

  ```sql
  CREATE STATISTICS stx_alumnos_geo (dependencies, ndistinct)
    ON provincia, ciudad FROM alumnos;
  ANALYZE alumnos;
  ```

- Revisar `pg_stats` si las estimaciones siguen malas.

---

## 5. Materialized views

Para reportes agregados pesados que no necesitan tiempo real:

```sql
CREATE MATERIALIZED VIEW mv_dashboard_docente AS
SELECT docente_id, curso_id, COUNT(*) AS entregas, AVG(nota) AS promedio
FROM calificaciones
GROUP BY docente_id, curso_id;

CREATE UNIQUE INDEX ON mv_dashboard_docente (docente_id, curso_id);

-- Refresh programado (cron / pg_cron / job Go)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_docente;
```

`CONCURRENTLY` requiere índice único y no bloquea lecturas.

---

## 6. Prepared statements y connection pooling

- **Prepared statements** reusan el plan → menos parseo/planning. `pgx` y `lib/pq` los usan por default. Prisma también.
- Ojo con **generic plans**: tras varias ejecuciones, Postgres puede elegir un plan genérico peor que el custom. Si pasa, en `pgx` considerar `PreferSimpleProtocol`.
- **Pool de conexiones**:
  - Go: `pgxpool` (nativo pgx). Tamaño típico: `num_cpus * 2` a `4`.
  - TS: `pg.Pool` (node-postgres) o Prisma (pool interno).
  - App con muchas conexiones cortas → **PgBouncer** en **transaction mode** delante de Cloud SQL. Reduce overhead y evita agotar `max_connections`.
- Más conexiones ≠ más throughput. Exceso causa context switching y lock contention.

---

## 7. Multi-tenant (Educabot)

Todas las tablas de dominio tienen `tenant_id` (escuela/organización). Reglas:

- **Siempre filtrar por `tenant_id` primero** en el WHERE.
- Índices compuestos que empiezan por `tenant_id`:
  ```sql
  CREATE INDEX idx_alumnos_tenant_curso ON alumnos (tenant_id, curso_id);
  ```
- Row-Level Security (RLS) opcional como red de seguridad.
- Nunca listar sin `tenant_id` — incluso en queries de reporting internos.

---

## 8. Ejemplo end-to-end

**Query original** — dashboard docente, 2.1s:

```sql
SELECT c.nombre, COUNT(DISTINCT a.id) AS alumnos,
       (SELECT AVG(nota) FROM calificaciones WHERE curso_id = c.id) AS promedio
FROM cursos c
LEFT JOIN alumnos a ON a.curso_id = c.id
WHERE c.docente_id = $1
GROUP BY c.id, c.nombre
ORDER BY c.nombre;
```

**EXPLAIN ANALYZE** muestra:
- Seq Scan sobre `calificaciones` (8M rows)
- Subquery correlacionada se ejecuta por curso

**Fix**:

```sql
CREATE INDEX idx_calif_curso ON calificaciones(curso_id) INCLUDE (nota);
CREATE INDEX idx_alumnos_curso ON alumnos(curso_id);
CREATE INDEX idx_cursos_docente ON cursos(docente_id);

SELECT c.nombre,
       COUNT(DISTINCT a.id) AS alumnos,
       AVG(cal.nota)        AS promedio
FROM cursos c
LEFT JOIN alumnos a        ON a.curso_id = c.id
LEFT JOIN calificaciones cal ON cal.curso_id = c.id
WHERE c.docente_id = $1
GROUP BY c.id, c.nombre
ORDER BY c.nombre;
```

Resultado: **2.1s → 40ms**.

---

## Anti-patterns

- ❌ Optimizar sin medir — **EXPLAIN ANALYZE primero**, siempre.
- ❌ Agregar un índice "por si acaso" sin verificar que el plan realmente cambie.
- ❌ ORM ciego: `Model.findAll()` y filtrar en memoria.
- ❌ `SELECT *` en código de aplicación.
- ❌ OFFSET-based pagination en datasets grandes.
- ❌ `COUNT(*)` exacto cuando la UI solo necesita "más de 10k".
- ❌ N+1 invisible del ORM (falta de eager loading / DataLoader).
- ❌ Pedalear queries sin `ANALYZE` tras un bulk load o migración grande.
- ❌ No monitorear `pg_stat_statements` / Query Insights periódicamente.
- ❌ Pool de conexiones sin tunear → demasiadas conexiones causan thrashing.
- ❌ Funciones sobre columnas indexadas en el WHERE.
- ❌ Olvidar `tenant_id` en queries multi-tenant.

---

## Checklist antes de dar por optimizada una query

- [ ] Capturé el `EXPLAIN (ANALYZE, BUFFERS)` original (baseline).
- [ ] Identifiqué el/los nodos problemáticos (Seq Scan, Nested Loop ancho, Rows Removed alto, read >> hit).
- [ ] Verifiqué estimado vs actual rows — si >10x de diferencia, corrí `ANALYZE`.
- [ ] Revisé si hay índice útil; si no, lo diseñé (composite, partial, covering, funcional).
- [ ] Reescribí patrones anti: SELECT *, OFFSET grande, función en WHERE, N+1, subquery correlacionada.
- [ ] Validé el nuevo `EXPLAIN ANALYZE` — el plan cambió como esperaba.
- [ ] Medí mejora real en ms (no solo "se ve mejor").
- [ ] Confirmé que no rompí otras queries (índices nuevos pueden afectar writes y otros planes).
- [ ] Agregué la query a observabilidad si es crítica (log / métrica).
- [ ] Documenté en PR: query antes/después, plan antes/después, impacto.

---

## Output esperado ✅

Al ejecutar esta skill entregar:

1. **Diagnóstico**: qué está mal y por qué (con el fragmento de EXPLAIN que lo demuestra).
2. **Propuesta**: query reescrita + índices/statistics/MV propuestos, con SQL listo para aplicar.
3. **Validación**: EXPLAIN ANALYZE antes y después, tiempo antes/después.
4. **Riesgos**: impacto en writes, tamaño de índice, necesidad de `REINDEX` o ventana de mantenimiento.
5. **Seguimiento**: qué monitorear post-deploy (Cloud SQL Query Insights, `pg_stat_statements`).

---

## Herramientas

- `pg_stat_statements` — top queries por tiempo total / latencia media.
- **Cloud SQL Query Insights** (GCP) — dashboard automático de performance.
- `auto_explain` — logging de planes de queries lentas.
- `pgbadger` — análisis offline de logs de Postgres.
- [explain.dalibo.com](https://explain.dalibo.com) — visualización interactiva de planes.
- `pg_trgm`, `tsvector` — búsqueda por substring / full-text.

---

## Delegación

- Diseño y mantenimiento de índices → **`/database-indexing`**.
- Migraciones de datos masivas / rewrites de tabla → **`/data-migrations`**.
- Diagrama de relaciones y revisión de schema → **`/db-diagram`**.
- Auditoría integral de performance del proyecto → **`/audit-dev`** + **`/optimize`**.
