# Checklists - Database Indexing

## Pre-creation checklist

- [ ] Table >10k rows
- [ ] Specific queries identified
- [ ] Current EXPLAIN shows a costly Seq Scan
- [ ] Composite order: equality -> range -> ORDER BY
- [ ] `tenant_id` first column
- [ ] Partial if the filter recurs (`deleted_at IS NULL`, `status = 'active'`)
- [ ] `INCLUDE` if the query only touches indexable columns
- [ ] FK has its own index
- [ ] `CONCURRENTLY` and the migration outside a transaction
- [ ] Post-creation: EXPLAIN ANALYZE confirms the plan
- [ ] Not redundant with an existing index

## Periodic checklist

- [ ] `idx_scan = 0` after 1 month -> drop candidate
- [ ] Tables with `seq_scan >> idx_scan` -> missing index
- [ ] INVALID indexes detected and dropped
- [ ] Bloat measured on hot indexes
- [ ] REINDEX CONCURRENTLY the bloated ones
