---
name: search-setup
description: "Búsqueda para apps Educabot (Go/TS/React): Meilisearch, Typesense, Elasticsearch, Postgres FTS + pg_trgm, indexing pipeline, faceting, multi-tenant, multilingual es/pt."
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

## Postgres FTS

- Columna `tsvector GENERATED ALWAYS AS` con `setweight` por campo (A=title, B=description, C=tags)
- GIN index para FTS + GIN trigram para typo/ILIKE
- Multilingüe: columna `language` → dictionary correcto, o `simple` como genérico
- Limitaciones: typo flojo, faceting manual con GROUP BY, highlighting básico

## Meilisearch

- Docker self-host, `MEILI_MASTER_KEY` solo en backend
- Search-only keys con `tenantTokenFilter` por tenant, nunca master key en frontend
- `searchableAttributes` ordenados por importancia, `filterableAttributes` para facets
- Stopwords es/pt, synonyms cross-language, typo tolerance configurable

## Indexing Pipeline (Outbox Pattern)

- **Nunca indexar desde el handler HTTP** — async con outbox + worker
- DB transaction: INSERT entity + INSERT outbox_event → COMMIT
- Worker poll outbox → batch hasta 500 docs → POST a Meili → mark processed
- Retries con backoff, DLQ tras N fallos. Siempre agregar `tenantId` al doc

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

## Reindex (Alias Switch)

- Nunca DELETE + CREATE + reindex en prod. Usar `swapIndexes`:
  1. Crear `courses_v2` con settings nuevos → reindex full → verificar → swap → borrar viejo

## Observabilidad

- Query latency p50/p95/p99 (alertar si p95 > 200ms)
- Zero-result rate (target <5%), CTR@5 (<20% = relevancia mala)
- Index lag (outbox pendientes), failed events
- Log sampling queries 1% (sin PII)

## Anti-patterns

- Indexar desde handler HTTP, `LIKE '%x%'` sobre 1M filas, master key en frontend
- Reindex sin alias swap, sin filtro tenantId forzado, input directo a `filter:`
- Empezar con Elasticsearch "por si escalamos", un index por usuario, synonyms sin curar
- Sin métricas zero-result/CTR, debounce 0ms, soft-delete sin borrar del index

## Checklist

- [ ] Engine elegido con justificación
- [ ] Indexing async vía outbox
- [ ] `tenantId` forzado en todos los filtros backend
- [ ] Master key NO en frontend ni repo
- [ ] Search-only key o proxy implementado
- [ ] Rate limit en endpoint de search
- [ ] Settings del index versionados en repo
- [ ] Script reindex con alias swap testeado en staging
- [ ] Stopwords y synonyms por idioma (es/pt)
- [ ] Debounce ≥150ms en autocomplete
- [ ] Métricas: latency p95, zero-result, index lag
- [ ] Soft-delete → delete del index también
- [ ] E2E test: upsert DB → en ≤5s aparece en search
