# Indexing Pipeline (Outbox Pattern)

- **Nunca indexar desde el handler HTTP** — async con outbox + worker
- DB transaction: INSERT entity + INSERT outbox_event -> COMMIT
- Worker poll outbox -> batch hasta 500 docs -> POST a Meili -> mark processed
- Retries con backoff, DLQ tras N fallos. Siempre agregar `tenantId` al doc

## Reindex (Alias Switch)

- Nunca DELETE + CREATE + reindex en prod. Usar `swapIndexes`:
  1. Crear `courses_v2` con settings nuevos -> reindex full -> verificar -> swap -> borrar viejo
