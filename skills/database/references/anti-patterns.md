# Database Anti-patterns

| # | Don't | Do instead |
|---|-------|------------|
| 1 | FKs sin índice en la tabla hija | Indexar siempre la columna FK del lado hijo |
| 2 | Relaciones circulares en schema | Romper ciclos con tabla de join intermedia |
| 3 | God tables (50+ columnas) | Separar en entidades con relación explícita |
| 4 | DDL y backfill de datos en la misma migration | Una migration = un cambio; backfill en archivo separado |
| 5 | Editar migrations ya mergeadas | Siempre nueva migration hacia adelante |
| 6 | DROP sin grace period | expand-contract: deprecar → migrar → DROP en release N+3 |
| 7 | `CREATE INDEX` sin CONCURRENTLY en prod | `CREATE INDEX CONCURRENTLY` fuera de transacción |
| 8 | N+1 sin detectar | Prisma `include` / JOIN / DataLoader |
| 9 | `SELECT *` en hot paths | `select` con columnas específicas |
| 10 | OFFSET pagination en tablas grandes | Cursor keyset (`WHERE id > $last LIMIT N`) |
| 11 | Queries sin `EXPLAIN ANALYZE` | Validar plan antes y después de cada cambio |
| 12 | Raw SQL con interpolación de strings | Siempre prepared statements / parámetros |
| 13 | Sin pool limits ni timeouts | `max(2, cores*2)` pool; timeout 5s connect / 30s statement |
| 14 | Seeds ejecutables en prod | Guard explícito `if APP_ENV == production: exit` |
| 15 | Seeds no idempotentes | Upsert con ON CONFLICT, nunca INSERT ciego |
| 16 | Backups sin restauración probada | Test de restore trimestral documentado |
