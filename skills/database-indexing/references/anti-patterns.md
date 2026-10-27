# Anti-patterns - Database Indexing

- Indexing "just in case" — every index costs writes and space
- `CREATE INDEX` without `CONCURRENTLY` in prod (blocks writes)
- Wrong composite order (`created_at, tenant_id` when you always filter by tenant first)
- Expression mismatch: `WHERE lower(email)` without an expression index
- Redundant index: `(a, b)` + `(a)` — the second is already covered
- Not indexing the child FK
- Not running `EXPLAIN ANALYZE` after creation
- Hash index (use B-tree)
- GIN without `jsonb_path_ops` when you only use `@>`
- Never REINDEX — bloat accumulates degradation
- Indexing booleans without partial
- Drop without an observation period (>=1 month)
