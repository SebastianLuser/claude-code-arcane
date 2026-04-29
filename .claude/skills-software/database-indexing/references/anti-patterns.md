# Anti-patterns - Database Indexing

- Indexar "por las dudas" — cada indice cuesta writes y espacio
- `CREATE INDEX` sin `CONCURRENTLY` en prod (bloquea writes)
- Orden incorrecto en composite (`created_at, tenant_id` cuando siempre filtras por tenant primero)
- Expression mismatch: `WHERE lower(email)` sin expression index
- Indice redundante: `(a, b)` + `(a)` — segundo ya cubierto
- No indexar child FK
- No correr `EXPLAIN ANALYZE` post-creacion
- Hash index (usar B-tree)
- GIN sin `jsonb_path_ops` cuando solo usas `@>`
- Nunca REINDEX — bloat acumula degradacion
- Indexar booleans sin partial
- Drop sin periodo observacion (>=1 mes)
