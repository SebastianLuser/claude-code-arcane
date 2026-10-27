# Engine Details — Search Setup

## Postgres FTS

- `tsvector GENERATED ALWAYS AS` column with `setweight` per field (A=title, B=description, C=tags)
- GIN index for FTS + GIN trigram for typos/ILIKE
- Multilingual: a `language` column -> the right dictionary, or `simple` as a generic one
- Limitations: weak typo handling, manual faceting with GROUP BY, basic highlighting

## Meilisearch

- Docker self-host, `MEILI_MASTER_KEY` only in the backend
- Search-only keys with a per-tenant `tenantTokenFilter`, never the master key in the frontend
- `searchableAttributes` ordered by importance, `filterableAttributes` for facets
- es/pt stopwords, cross-language synonyms, configurable typo tolerance
