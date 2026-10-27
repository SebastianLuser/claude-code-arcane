# Batching — Large Data Migrations

- Batch size: 10k rows default (tune to load)
- Keyset pagination (`id > last_id`), never OFFSET
- Persistent checkpoint: store last_id in a control table
- Idempotent: N runs = same result
- Job separate from the schema migration
- Pauses between batches (100-500ms)
- Observability: progress log + throughput metrics
