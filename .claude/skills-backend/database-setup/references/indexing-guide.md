# Indexing Guide — PostgreSQL

## Tipos de índice

| Tipo | Cuándo | Cuándo NO |
|------|--------|-----------|
| **B-tree** | Equality, range, ORDER BY (95% de casos) | Full-text, arrays, geo |
| **GIN** | Arrays, jsonb, tsvector, trigram | Tablas con muchos writes |
| **GiST** | Geo, ranges, nearest-neighbor | Queries de igualdad simples |
| **BRIN** | Tablas enormes ordenadas (timestamps, series temporales) | Datos no correlacionados |

## Composite: orden de columnas

**Regla:** Igualdad primero → rango después → ORDER BY al final.

```sql
-- Correcto: tenant_id (igualdad) → created_at (rango) → status (ORDER BY)
CREATE INDEX idx_orders_tenant_date ON orders (tenant_id, created_at, status);

-- Incorrecto: rango primero — el índice no puede usar tenant_id para saltar
CREATE INDEX idx_bad ON orders (created_at, tenant_id);
```

Un índice `(a, b, c)` sirve para queries sobre `a`, `a+b`, y `a+b+c` — pero NO para solo `b` o `c`.

## Variantes útiles

### Partial index
Reduce tamaño del índice cuando la mayoría de rows no matchea la condición:
```sql
CREATE INDEX idx_orders_pending ON orders (created_at)
WHERE status = 'pending' AND deleted_at IS NULL;
```

### Covering index (INCLUDE)
Evita heap access si todas las columnas del SELECT están en el índice:
```sql
CREATE INDEX idx_users_email_covering ON users (email)
INCLUDE (id, name, tenant_id);
-- Una query SELECT id, name, tenant_id WHERE email = ? no toca la tabla
```

### Expression index
Necesario cuando el WHERE usa una función sobre la columna:
```sql
CREATE INDEX idx_users_email_lower ON users (lower(email));
-- Permite: WHERE lower(email) = lower($1)
```

## CREATE INDEX CONCURRENTLY

Obligatorio en tablas con tráfico en producción. No bloquea writes.

```sql
-- Correcto para producción:
CREATE INDEX CONCURRENTLY idx_orders_tenant ON orders (tenant_id);

-- Nunca en producción sin CONCURRENTLY (ACCESS SHARE LOCK bloquea writes):
CREATE INDEX idx_orders_tenant ON orders (tenant_id);
```

**Restricción:** No puede correr dentro de una transacción.
- golang-migrate: usar `-- +migrate NoTransaction`
- Prisma: `--create-only` + editar SQL manualmente

**Si falla:** queda estado `INVALID`. Detectar y limpiar:
```sql
SELECT indexname FROM pg_indexes
JOIN pg_index ON pg_index.indexrelid = pg_indexes.indexrelid::regclass
WHERE NOT indisvalid AND tablename = 'orders';

-- Limpiar y reintentar:
DROP INDEX CONCURRENTLY idx_orders_tenant;
CREATE INDEX CONCURRENTLY idx_orders_tenant ON orders (tenant_id);
```

## JSONB

Para containment (`@>`): GIN con `jsonb_path_ops` (4x más pequeño que el default):
```sql
CREATE INDEX idx_metadata_gin ON events USING GIN (metadata jsonb_path_ops);
-- Permite: WHERE metadata @> '{"type": "login"}'
```

Para un solo key: expression index:
```sql
CREATE INDEX idx_preferences_role ON users ((preferences->>'role'));
-- Permite: WHERE preferences->>'role' = 'admin'
```

## FK child columns — siempre indexar

PostgreSQL NO crea índices automáticamente en columnas FK del lado hijo.
Un DELETE/UPDATE en el padre hace Seq Scan en el hijo sin índice:

```sql
-- Siempre agregar junto al FK:
ALTER TABLE orders ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id);
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders (tenant_id, user_id);
```

## Detectar índices problemáticos

### Faltantes (Seq Scan en tablas grandes)
```sql
SELECT relname, seq_scan, idx_scan, n_live_tup
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan AND n_live_tup > 10000
ORDER BY seq_scan DESC;
```

### No usados (candidatos a DROP)
```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
-- Solo DROP tras ≥1 mes de observación en producción
```

### Bloat (índices fragmentados)
```sql
-- Reconstruir sin downtime:
REINDEX INDEX CONCURRENTLY idx_orders_tenant;
```
