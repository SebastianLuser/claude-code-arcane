# Indexing Pipeline (Outbox Pattern)

- **Never index from the HTTP handler** — async with outbox + worker
- DB transaction: INSERT entity + INSERT outbox_event -> COMMIT
- Worker polls the outbox -> batches up to 500 docs -> POST to Meili -> marks processed
- Retries with backoff, DLQ after N failures. Always add `tenantId` to the doc

## Reindex (Alias Switch)

- Never DELETE + CREATE + reindex in prod. Use `swapIndexes`:
  1. Create `courses_v2` with the new settings -> full reindex -> verify -> swap -> delete the old one
