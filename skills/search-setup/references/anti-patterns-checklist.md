# Anti-patterns & Checklist — Search Setup

## Anti-patterns

- Indexing from the HTTP handler, `LIKE '%x%'` over 1M rows, master key in the frontend
- Reindex without alias swap, no forced tenantId filter, raw input passed to `filter:`
- Starting with Elasticsearch "in case we scale", one index per user, uncurated synonyms
- No zero-result/CTR metrics, 0ms debounce, soft-delete without removing from the index

## Checklist

- [ ] Engine chosen with a justification
- [ ] Async indexing via outbox
- [ ] `tenantId` forced in every backend filter
- [ ] Master key NOT in the frontend or the repo
- [ ] Search-only key or proxy implemented
- [ ] Rate limit on the search endpoint
- [ ] Index settings versioned in the repo
- [ ] Reindex script with alias swap tested in staging
- [ ] Stopwords and synonyms per language (es/pt)
- [ ] Debounce >=150ms on autocomplete
- [ ] Metrics: latency p95, zero-result, index lag
- [ ] Soft-delete -> delete from the index too
- [ ] E2E test: DB upsert -> shows up in search in <=5s
