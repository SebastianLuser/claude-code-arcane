# Operating a vector database

Choosing the database is section 3 of the skill. This is what keeps it fast, correct and recoverable in production. For pgvector schema and queries see also `/pgvector-search`.

## Index tuning

| Index | Build | Query knob | Use when |
|---|---|---|---|
| **HNSW** | `m` (links per node, default 16), `ef_construction` (default 64) | `ef_search`: higher = better recall, slower | Default choice; good recall at low latency, more memory |
| **IVFFlat** (pgvector) | `lists`: about rows/1000 up to 1M rows, about √rows above | `probes`: start near √lists | Memory-tight, mostly static data; build it **after** loading the data |

pgvector specifics:

- `SET hnsw.ef_search = 100;` per session or transaction (default 40). Tune it against measured recall, not by feel.
- **Filtered queries can return fewer rows than `LIMIT`**: the index finds `ef_search` neighbors first, then the `WHERE` drops some. pgvector 0.8+ fixes this with iterative scans: `SET hnsw.iterative_scan = relaxed_order;` (or `strict_order`). On older versions raise `ef_search` or use a partial index per frequent filter.
- Building a big HNSW index: raise `maintenance_work_mem` for the session and use `max_parallel_maintenance_workers`; build with `CREATE INDEX CONCURRENTLY` on a live table.
- The operator class must match the query operator: `vector_cosine_ops` with `<=>`, `vector_l2_ops` with `<->`, `vector_ip_ops` with `<#>`. A mismatch silently skips the index (check with `EXPLAIN`).
- `halfvec` (half precision) halves memory and storage with little recall loss; check it with the recall set below.

Qdrant: create a payload index on every field you filter by, and keep vectors `on_disk` when RAM is the limit. Pinecone and Qdrant use namespaces or collections per tenant; see the tenant rules in `/ai-security`.

## Measure recall

Keep a fixed set of 100–500 real queries. For each, compare the index result with an exact search (brute force: in pgvector, the same query with the index disabled via `SET enable_indexscan = off`). Track recall@k after every index, parameter or model change; alert if it drops.

## Changing the embedding model

Vectors from different models (or dimensions) are not comparable, so a model change means re-embedding everything:

1. Store the model name and dimension with every vector, or one index per model.
2. Build the new index next to the old one (a new column, table or collection).
3. Backfill, run the recall set and the RAG evals (`/llm-evals`) on the new index.
4. Switch reads, keep the old index for a rollback window, then drop it.

## Freshness and deletes

- Re-embed a document when its content changes; delete its chunks when it is deleted or access is revoked. A deleted document that still answers questions is a data leak.
- Track index lag (newest source change vs newest indexed change) as an SLI.
- pgvector: autovacuum must keep up after bulk updates and deletes; run `VACUUM ANALYZE` after large loads.

## Backup and restore

- pgvector: part of the normal Postgres backups (`/backup-strategy`); restoring rebuilds nothing extra, but large HNSW indexes take time to rebuild if you restore from a logical dump.
- Qdrant: collection snapshots, stored outside the node; test a restore.
- Managed services: check what the provider backs up and the restore time; if you can re-embed from source documents, record how long a full rebuild takes, since that is your real recovery time.
