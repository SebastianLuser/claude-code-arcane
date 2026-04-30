# Engine Details — Search Setup

## Postgres FTS

- Columna `tsvector GENERATED ALWAYS AS` con `setweight` por campo (A=title, B=description, C=tags)
- GIN index para FTS + GIN trigram para typo/ILIKE
- Multilingue: columna `language` -> dictionary correcto, o `simple` como generico
- Limitaciones: typo flojo, faceting manual con GROUP BY, highlighting basico

## Meilisearch

- Docker self-host, `MEILI_MASTER_KEY` solo en backend
- Search-only keys con `tenantTokenFilter` por tenant, nunca master key en frontend
- `searchableAttributes` ordenados por importancia, `filterableAttributes` para facets
- Stopwords es/pt, synonyms cross-language, typo tolerance configurable
