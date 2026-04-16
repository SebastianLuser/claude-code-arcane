---
name: database-indexing
description: Diseño y mantenimiento de índices en PostgreSQL 15+. Tipos de índices, composite, partial, covering, CONCURRENTLY, detección de faltantes/no usados, bloat. Usar cuando se mencione índices, index, performance de queries por índices, seq scan, slow query por falta de índice, EXPLAIN.
stack: PostgreSQL 15+
---

# Database Indexing (PostgreSQL)

Skill para diseñar, crear y mantener índices en Postgres 15+ en el contexto multi-tenant de Educabot.

## Cuándo usar

- Queries lentas que hacen `Seq Scan` en tablas grandes.
- Diseño de schema nuevo: planificar índices antes de llenar la tabla.
- Revisión periódica: detectar índices faltantes o no usados.
- Bloat detectado, REINDEX necesario.
- Multi-tenant: asegurar que toda tabla con `tenant_id` lo tenga como primera columna del composite.

## Cuándo NO usar

- Tablas pequeñas (<10k rows): `Seq Scan` suele ser más rápido que un Index Scan.
- Columnas de baja cardinalidad (booleans, enums de 2-3 valores): mejor un **partial index**.
- Tablas con alta tasa de writes y lecturas raras: el costo de mantenimiento supera el beneficio.
- Para queries de full-text search: ver `/search-setup` (tsvector + GIN).
- Para analizar una query específica lenta: ver `/query-optimization` (EXPLAIN, plans).

---

## 1. Tipos de índices en Postgres

### B-tree (default)
Para equality, range y `ORDER BY`. Soporta `UNIQUE`. Es el 95% de los casos.

```sql
CREATE INDEX idx_users_email ON users (email);
CREATE UNIQUE INDEX idx_users_email_unique ON users (email);
```

### Hash
Solo equality. **Skip** — B-tree es igual o mejor en casi todos los casos y soporta más operadores.

### GIN
Arrays, `jsonb`, full-text (`tsvector`). Usar `jsonb_path_ops` si solo se usa `@>`.

```sql
CREATE INDEX idx_users_prefs ON users USING GIN (preferences jsonb_path_ops);
CREATE INDEX idx_posts_tags ON posts USING GIN (tags); -- text[]
```

Para full-text ver `/search-setup`.

### GiST
Geoespaciales (PostGIS), ranges, exclusion constraints.

```sql
CREATE INDEX idx_events_during ON events USING GIST (during); -- tstzrange
```

### BRIN
Tablas **enormes** ordenadas físicamente por la columna (timestamps, ids secuenciales). Tamaño en disco órdenes de magnitud menor que B-tree.

```sql
CREATE INDEX idx_audit_logs_ts_brin ON audit_logs USING BRIN (ts);
```

### Partial
Agrega `WHERE` a la definición. Reduce tamaño cuando el filtro es muy selectivo (soft-deletes, flags).

```sql
CREATE UNIQUE INDEX idx_users_email_active
  ON users (lower(email))
  WHERE deleted_at IS NULL;
```

### Covering (`INCLUDE`)
Agrega columnas al leaf del B-tree para habilitar **Index-Only Scan** sin ir al heap.

```sql
CREATE INDEX idx_grades_lookup
  ON grades (tenant_id, student_id)
  INCLUDE (score, period_id);
```

### Expression
Para queries con funciones sobre la columna.

```sql
CREATE INDEX idx_users_lower_email ON users (lower(email));
-- ahora: SELECT ... WHERE lower(email) = ? usa el índice
```

---

## 2. Cuándo crear un índice

Columnas usadas en:
- `WHERE` con alta selectividad (>100 rows devueltos dilute el beneficio).
- `JOIN` (especialmente FKs — ver sección 8).
- `ORDER BY` / `GROUP BY` frecuentes.
- Constraints `UNIQUE`.

Regla: si la query es frecuente y escanea miles de rows para devolver pocos, **indexar**.

---

## 3. Composite indexes y leftmost prefix

Un índice `(a, b, c)` sirve para queries que filtran por:
- `a`
- `a, b`
- `a, b, c`

**No sirve** para queries que filtran solo por `b`, `c`, o `b, c`.

```sql
CREATE INDEX idx_grades_tenant_created
  ON grades (tenant_id, created_at);

-- Usa el índice:
WHERE tenant_id = ? AND created_at > ?
WHERE tenant_id = ?

-- NO usa el índice:
WHERE created_at > ?
```

### Orden de columnas en composite
1. **Igualdad primero** (`tenant_id = ?`, `status = ?`)
2. **Rango después** (`created_at > ?`, `score BETWEEN ...`)
3. **`ORDER BY` al final** si queres habilitar sorted index scan

---

## 4. Índices únicos

```sql
CREATE UNIQUE INDEX idx_users_email_unique
  ON users (email);

-- Con soft-delete: unicidad solo entre registros activos
CREATE UNIQUE INDEX idx_users_email_active_unique
  ON users (email)
  WHERE deleted_at IS NULL;
```

---

## 5. `CREATE INDEX CONCURRENTLY` en producción

**Obligatorio** en tablas grandes en prod: no bloquea writes. No puede correr dentro de una transacción, por lo que la migración debe separarse (ver `/data-migrations`).

```sql
CREATE INDEX CONCURRENTLY idx_grades_tenant_student
  ON grades (tenant_id, student_id, period_id);
```

Si falla, queda un índice `INVALID`. Detectar y dropear:

```sql
SELECT schemaname, relname, indexrelname
FROM pg_stat_user_indexes
JOIN pg_index USING (indexrelid)
WHERE NOT indisvalid;

DROP INDEX CONCURRENTLY idx_nombre_invalido;
```

---

## 6. Detectar índices faltantes

Tablas grandes con más `Seq Scan` que `Index Scan` son candidatas:

```sql
SELECT
  schemaname, relname,
  seq_scan, idx_scan,
  n_live_tup,
  pg_size_pretty(pg_relation_size(relid)) AS size
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
  AND n_live_tup > 10000
ORDER BY seq_scan DESC;
```

Luego: revisar las queries reales contra esa tabla (`pg_stat_statements`) y ver qué `WHERE` se repite.

---

## 7. Detectar índices no usados

Índices que nunca se usan cuestan writes y espacio. Tras **1 mes** de observación en prod:

```sql
SELECT
  schemaname, relname, indexrelname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

Dropear con `DROP INDEX CONCURRENTLY` para recuperar espacio y acelerar writes.

> Excepción: índices únicos que respaldan constraints. No se dropean aunque nunca aparezcan en `idx_scan`.

---

## 8. Foreign keys: NO se indexan automático

Postgres **no** crea índice automático en columnas FK. Sin índice, cada `DELETE`/`UPDATE` en el parent hace seq scan de la child para validar la constraint.

```sql
-- Siempre que haya FK:
CREATE INDEX CONCURRENTLY idx_grades_student_id ON grades (student_id);
```

---

## 9. EXPLAIN tras crear

Verificar que la query efectivamente usa el índice:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM grades WHERE tenant_id = 1 AND student_id = 42;
```

Plan nodes esperables:
- **Index Scan**: usa el índice y lee heap.
- **Index Only Scan**: covering index hit (ideal).
- **Bitmap Heap Scan**: útil para filtros menos selectivos o combinación de índices.
- **Seq Scan**: el índice no se está usando — revisar.

Ver `/query-optimization` para análisis completo de planes.

---

## 10. Bloat y `REINDEX`

Los índices B-tree se bloatean con updates/deletes. Monitorear:

```sql
-- requiere extensión pgstattuple
SELECT * FROM pgstattuple('idx_users_email');
```

Reparar sin bloquear:

```sql
REINDEX INDEX CONCURRENTLY idx_users_email;
-- o pg_repack para casos severos
```

Agendar `REINDEX CONCURRENTLY` en mantenimiento trimestral para índices calientes.

---

## 11. JSONB indexing

Para queries con `@>` (contains) — el caso más común:

```sql
CREATE INDEX idx_users_prefs_gin
  ON users USING GIN (preferences jsonb_path_ops);
```

`jsonb_path_ops` es ~4x más pequeño que el GIN default. Solo usá el default si necesitás `?`, `?&`, `?|`.

No indexes todo el jsonb si solo consultás un key: mejor expression index.

```sql
CREATE INDEX idx_users_role
  ON users ((preferences->>'role'));
```

---

## 12. Multi-tenant Educabot

Casi toda tabla de producto lleva `tenant_id`. Todo índice compuesto debe empezar por `tenant_id` para que RLS y queries filtradas por tenant lo aprovechen:

```sql
CREATE INDEX CONCURRENTLY idx_grades_tenant_student
  ON grades (tenant_id, student_id, period_id);

CREATE INDEX CONCURRENTLY idx_users_active_email
  ON users (lower(email))
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_audit_logs_ts_brin
  ON audit_logs USING BRIN (ts);
```

---

## Anti-patterns

- ❌ Indexar "por las dudas" — cada índice cuesta writes y espacio.
- ❌ `CREATE INDEX` sin `CONCURRENTLY` en prod sobre tablas grandes (bloquea writes).
- ❌ Orden incorrecto en composite (`(created_at, tenant_id)` cuando siempre filtrás por `tenant_id` primero).
- ❌ `WHERE lower(email) = ?` sin expression index — no usa índice de `email`.
- ❌ Índice redundante: tener `(a, b)` y también `(a)` (el segundo ya está cubierto por el primero).
- ❌ No indexar la columna child de una FK.
- ❌ No correr `EXPLAIN (ANALYZE)` tras crear un índice para confirmar que se usa.
- ❌ Hash index (usá B-tree).
- ❌ GIN sin `jsonb_path_ops` cuando solo usás `@>` (4x más grande de lo necesario).
- ❌ Nunca hacer `REINDEX` — bloat acumulado degrada performance.
- ❌ Indexar booleans o enums de baja cardinalidad sin hacerlo **partial**.
- ❌ Dropear índices "no usados" sin periodo de observación (>= 1 mes).

---

## Checklist antes de crear un índice

- [ ] La tabla tiene >10k rows (si no, probablemente no vale).
- [ ] Identifiqué la/s query/s concretas que lo aprovechan.
- [ ] `EXPLAIN (ANALYZE)` actual muestra `Seq Scan` costoso.
- [ ] Orden del composite: igualdad → rango → ORDER BY.
- [ ] Multi-tenant: `tenant_id` es la primera columna.
- [ ] Si aplica filtro recurrente (`deleted_at IS NULL`, `status = 'active'`): partial.
- [ ] Si la query solo toca columnas indexables: considerar `INCLUDE` para Index-Only Scan.
- [ ] Si es FK: tiene su propio índice.
- [ ] Uso `CONCURRENTLY` y la migración está fuera de transacción.
- [ ] Post-creación: `EXPLAIN (ANALYZE, BUFFERS)` confirma el plan.
- [ ] Chequeé que no sea redundante con un índice ya existente.

## Checklist periódica (mensual / trimestral)

- [ ] `pg_stat_user_indexes` → identificar `idx_scan = 0` tras 1 mes.
- [ ] `pg_stat_user_tables` → tablas con `seq_scan >> idx_scan`.
- [ ] Índices `INVALID` (fallos de `CONCURRENTLY`).
- [ ] Bloat con `pgstattuple` en índices calientes.
- [ ] `REINDEX CONCURRENTLY` de índices bloated.

---

## Output esperado ✅

Tras aplicar la skill deberías tener:

- Migraciones idempotentes con `CREATE INDEX CONCURRENTLY IF NOT EXISTS`, fuera de transacción.
- Todos los FKs con índice en la child.
- Toda tabla multi-tenant con composite que empieza por `tenant_id`.
- `EXPLAIN (ANALYZE)` adjunto en el PR mostrando plan antes/después.
- Reporte periódico de índices no usados y plan de drop.
- Sin índices `INVALID` en `pg_index`.

---

## Delegación a otras skills

- **Análisis de una query lenta puntual** → `/query-optimization` (EXPLAIN avanzado, rewrites).
- **Full-text search** (tsvector, ranking, dictionaries) → `/search-setup`.
- **Migraciones sin downtime, separación de `CONCURRENTLY`** → `/data-migrations`.
- **Diagramar el schema antes de decidir índices** → `/db-diagram`.
- **Auditoría general de DB/app** → `/audit-dev`.
