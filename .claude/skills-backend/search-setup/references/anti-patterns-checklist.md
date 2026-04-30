# Anti-patterns & Checklist — Search Setup

## Anti-patterns

- Indexar desde handler HTTP, `LIKE '%x%'` sobre 1M filas, master key en frontend
- Reindex sin alias swap, sin filtro tenantId forzado, input directo a `filter:`
- Empezar con Elasticsearch "por si escalamos", un index por usuario, synonyms sin curar
- Sin metricas zero-result/CTR, debounce 0ms, soft-delete sin borrar del index

## Checklist

- [ ] Engine elegido con justificacion
- [ ] Indexing async via outbox
- [ ] `tenantId` forzado en todos los filtros backend
- [ ] Master key NO en frontend ni repo
- [ ] Search-only key o proxy implementado
- [ ] Rate limit en endpoint de search
- [ ] Settings del index versionados en repo
- [ ] Script reindex con alias swap testeado en staging
- [ ] Stopwords y synonyms por idioma (es/pt)
- [ ] Debounce >=150ms en autocomplete
- [ ] Metricas: latency p95, zero-result, index lag
- [ ] Soft-delete -> delete del index tambien
- [ ] E2E test: upsert DB -> en <=5s aparece en search
