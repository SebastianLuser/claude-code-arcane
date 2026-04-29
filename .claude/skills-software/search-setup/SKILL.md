---
name: search-setup
description: "Búsqueda para apps Educabot (Go/TS/React): Meilisearch, Typesense, Elasticsearch, Postgres FTS + pg_trgm, indexing pipeline, faceting, multi-tenant, multilingual es/pt."
category: "backend"
argument-hint: "[provider: meilisearch|typesense|elastic|algolia|pg-fts]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# search-setup — Search

**Default Educabot:** Meilisearch para catálogo + Postgres FTS para búsquedas transaccionales. No empezar con Elasticsearch.

## Engine Decision

| Engine | Cuándo | Pros | Cons |
|--------|--------|------|------|
| **Postgres FTS + pg_trgm** | <10k docs, ya tenés PG | Cero infra extra, transaccional | Relevancia cruda, sin facets nativos |
| **Meilisearch** | **Default catálogo** | Typo-tolerant, facets, rápido, OSS | No escala horizontal trivial |
| **Typesense** | Alt a Meili con HA | Clustering nativo, buena API | Comunidad más chica |
| **Elasticsearch/OpenSearch** | >10M docs, analytics | Ecosistema, agregaciones | Ops pesado, JVM, caro |
| **Algolia** | SaaS, time-to-market | Cero ops, InstantSearch | $$$, vendor lock-in |

> → Read references/engine-details.md for Postgres FTS and Meilisearch configuration specifics

> → Read references/indexing-pipeline.md for outbox pattern, async indexing, and reindex alias swap

## Multi-tenant

| Estrategia | Cuándo | Pro | Contra |
|------------|--------|-----|--------|
| Filtro por `tenantId` | **Default** (<100 tenants) | Barato, reindex único | Grande degrada al chico |
| Index por tenant | Aislamiento requerido | Per-tenant tuning | Más ops, synonyms duplicados |

Tenant tokens Meili: scoped con filtro `tenantId` forzado, TTL 1h.

## Frontend Exposure

- **Default:** proxy endpoint backend (`/api/search`) — más control, observabilidad, rate limit
- Alternativa: tenant token directo a Meili (menos latencia, menos control)
- Rate limit en search endpoint. Input sanitization: nunca pasar user input directo a `filter:`

## Autocomplete

- Debounce ≥150ms, `limit: 5-10`, `attributesToHighlight` para resaltar match
- Cache frontend (last 20 queries) para back/forward instantáneo

> → Read references/observability.md for search metrics, latency alerting, zero-result tracking

> → Read references/anti-patterns-checklist.md for anti-patterns and pre-deployment checklist
