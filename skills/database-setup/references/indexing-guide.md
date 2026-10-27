# Indexing Guide — PostgreSQL

## Index types

| Type | When | When NOT |
|------|--------|-----------|
| **B-tree** | Equality, range, ORDER BY (95% of cases) | Full-text, arrays, geo |
| **GIN** | Arrays, jsonb, tsvector, trigram | Write-heavy tables |
| **GiST** | Geo, ranges, nearest-neighbor | Simple equality queries |
| **BRIN** | Huge ordered tables (timestamps, time series) | Uncorrelated data |

## Composite: column order

**Rule:** Equality first → range next → ORDER BY last.

```sql
-- Correct: tenant_id (equality) → created_at (range) → status (ORDER BY)
CREATE INDEX idx_orders_tenant_date ON orders (tenant_id, created_at, status);

-- Wrong: range first — the index cannot use tenant_id to skip ahead
CREATE INDEX idx_bad ON orders (created_at, tenant_id);
```

An `(a, b, c)` index serves queries on `a`, `a+b`, and `a+b+c` — but NOT on `b` or `c` alone.

## Useful variants

### Partial index
Shrinks the index when most rows do not match the condition:
```sql
CREATE INDEX idx_orders_pending ON orders (created_at)
WHERE status = 'pending' AND deleted_at IS NULL;
```

### Covering index (INCLUDE)
Avoids heap access if every column in the SELECT is in the index:
```sql
CREATE INDEX idx_users_email_covering ON users (email)
INCLUDE (id, name, tenant_id);
-- A SELECT id, name, tenant_id WHERE email = ? query does not touch the table
```

### Expression index
Required when the WHERE applies a function to the column:
```sql
CREATE INDEX idx_users_email_lower ON users (lower(email));
-- Enables: WHERE lower(email) = lower($1)
```

## CREATE INDEX CONCURRENTLY

Mandatory on tables with production traffic. Does not block writes.

```sql
-- Correct for production:
CREATE INDEX CONCURRENTLY idx_orders_tenant ON orders (tenant_id);

-- Never in production without CONCURRENTLY (ACCESS SHARE LOCK blocks writes):
CREATE INDEX idx_orders_tenant ON orders (tenant_id);
```

**Restriction:** It cannot run inside a transaction.
- golang-migrate: use `-- +migrate NoTransaction`
- Prisma: `--create-only` + edit the SQL by hand

**If it fails:** it is left in the `INVALID` state. Detect and clean up:
```sql
SELECT indexname FROM pg_indexes
JOIN pg_index ON pg_index.indexrelid = pg_indexes.indexrelid::regclass
WHERE NOT indisvalid AND tablename = 'orders';

-- Clean up and retry:
DROP INDEX CONCURRENTLY idx_orders_tenant;
CREATE INDEX CONCURRENTLY idx_orders_tenant ON orders (tenant_id);
```

## JSONB

For containment (`@>`): GIN with `jsonb_path_ops` (4x smaller than the default):
```sql
CREATE INDEX idx_metadata_gin ON events USING GIN (metadata jsonb_path_ops);
-- Enables: WHERE metadata @> '{"type": "login"}'
```

For a single key: expression index:
```sql
CREATE INDEX idx_preferences_role ON users ((preferences->>'role'));
-- Enables: WHERE preferences->>'role' = 'admin'
```

## FK child columns — always index

PostgreSQL does NOT automatically create indexes on FK columns on the child side.
A DELETE/UPDATE on the parent does a Seq Scan on the child without an index:

```sql
-- Always add it alongside the FK:
ALTER TABLE orders ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id);
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders (tenant_id, user_id);
```

## Detect problematic indexes

### Missing (Seq Scan on large tables)
```sql
SELECT relname, seq_scan, idx_scan, n_live_tup
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan AND n_live_tup > 10000
ORDER BY seq_scan DESC;
```

### Unused (DROP candidates)
```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
-- Only DROP after ≥1 month of observation in production
```

### Bloat (fragmented indexes)
```sql
-- Rebuild without downtime:
REINDEX INDEX CONCURRENTLY idx_orders_tenant;
```
