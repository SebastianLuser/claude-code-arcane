# Checklists - Database Indexing

## Checklist pre-creacion

- [ ] Tabla >10k rows
- [ ] Queries concretas identificadas
- [ ] EXPLAIN actual muestra Seq Scan costoso
- [ ] Orden composite: igualdad -> rango -> ORDER BY
- [ ] `tenant_id` primera columna
- [ ] Partial si filtro recurrente (`deleted_at IS NULL`, `status = 'active'`)
- [ ] `INCLUDE` si query solo toca columnas indexables
- [ ] FK tiene su propio indice
- [ ] `CONCURRENTLY` y migration fuera de transaccion
- [ ] Post-creacion: EXPLAIN ANALYZE confirma plan
- [ ] No redundante con indice existente

## Checklist periodica

- [ ] `idx_scan = 0` tras 1 mes -> candidato a drop
- [ ] Tablas con `seq_scan >> idx_scan` -> indice faltante
- [ ] Indices INVALID detectados y dropeados
- [ ] Bloat medido en indices calientes
- [ ] REINDEX CONCURRENTLY de bloated
