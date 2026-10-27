---
name: search-setup
description: "Search for Educabot apps (Go/TS/React): Meilisearch, Typesense, Elasticsearch, Postgres FTS + pg_trgm, indexing pipeline, faceting, multi-tenant, multilingual es/pt."
category: "backend"
argument-hint: "[provider: meilisearch|typesense|elastic|algolia|pg-fts]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# search-setup — Search

**Educabot default:** Meilisearch for the catalog + Postgres FTS for transactional searches. Do not start with Elasticsearch.

## Engine Decision

| Engine | When | Pros | Cons |
|--------|--------|------|------|
| **Postgres FTS + pg_trgm** | <10k docs, you already have PG | Zero extra infra, transactional | Crude relevance, no native facets |
| **Meilisearch** | **Catalog default** | Typo-tolerant, facets, fast, OSS | Horizontal scaling is not trivial |
| **Typesense** | Alternative to Meili with HA | Native clustering, good API | Smaller community |
| **Elasticsearch/OpenSearch** | >10M docs, analytics | Ecosystem, aggregations | Heavy ops, JVM, expensive |
| **Algolia** | SaaS, time-to-market | Zero ops, InstantSearch | $$$, vendor lock-in |

> → Read references/engine-details.md for Postgres FTS and Meilisearch configuration specifics

> → Read references/indexing-pipeline.md for outbox pattern, async indexing, and reindex alias swap

## Multi-tenant

| Strategy | When | Pro | Con |
|------------|--------|-----|--------|
| Filter by `tenantId` | **Default** (<100 tenants) | Cheap, single reindex | A large tenant degrades a small one |
| Index per tenant | Isolation required | Per-tenant tuning | More ops, duplicated synonyms |

Meili tenant tokens: scoped with a forced `tenantId` filter, TTL 1h.

## Frontend Exposure

- **Default:** backend proxy endpoint (`/api/search`) — more control, observability, rate limit
- Alternative: tenant token straight to Meili (less latency, less control)
- Rate limit on the search endpoint. Input sanitization: never pass user input straight to `filter:`

## Autocomplete

- Debounce ≥150ms, `limit: 5-10`, `attributesToHighlight` to highlight the match
- Frontend cache (last 20 queries) for instant back/forward

> → Read references/observability.md for search metrics, latency alerting, zero-result tracking

> → Read references/anti-patterns-checklist.md for anti-patterns and pre-deployment checklist
