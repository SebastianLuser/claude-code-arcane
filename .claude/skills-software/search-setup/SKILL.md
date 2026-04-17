---
name: search-setup
description: "Búsqueda para apps Educabot (Go/TS/React): Meilisearch, Typesense, Elasticsearch/OpenSearch, Algolia, Postgres FTS + pg_trgm, indexing pipeline, faceting, typo tolerance, multilingual (es/pt), relevancia tuning, autocomplete, permisos multi-tenant, sync DB→index, reindex. Usar para: search, elasticsearch, meilisearch, typesense, algolia, full text search, pg_trgm, faceting, autocomplete."
argument-hint: "[provider: meilisearch|typesense|elastic|algolia|pg-fts]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# search-setup — Search

Guía pragmática para implementar búsqueda en apps Educabot (Alizia, Tich, TUNI, Vigía). Cubre decisión de engine, indexing pipeline, multi-tenant, multilingüe es/pt, relevancia y operación (reindex, observabilidad).

Regla de oro: **no empieces con Elasticsearch**. El 80% de los casos Educabot resuelven con Postgres FTS o Meilisearch. Sumá complejidad solo cuando la métrica lo justifique (latencia p95, zero-result rate, escala de docs).

---

## Cuándo usar / NO usar

**Usar esta skill cuando:**
- Necesitás búsqueda full-text sobre catálogo (cursos, contenidos, usuarios, tickets, logs).
- Querés typo-tolerance, autocomplete, faceting o filtros combinados.
- El `WHERE col ILIKE '%x%'` ya se nota en latencia o no escala.
- Tenés que indexar data multilingüe (es/pt).
- Vas a exponer búsqueda al frontend con permisos multi-tenant.

**NO usar cuando:**
- Es un lookup exacto por PK/FK → índice B-tree, no search engine.
- Son <1000 filas estáticas → `LIKE` está bien, no overengineerar.
- La búsqueda es 1 vez al día en un admin interno → FTS simple de PG alcanza.
- El problema real es "no tengo filtros" → resolvelo con SQL + índices compuestos primero.

---

## 1. Decisión de engine

Tabla de decisión (ordenada por fit default Educabot):

| Engine | Cuándo | Pros | Contras |
|---|---|---|---|
| **Postgres FTS + pg_trgm** | Default simple. <10k docs, ya tenés PG, no querés otro servicio. | Cero infra extra, transaccional con la data, gratis. | Relevancia cruda, sin faceting nativo, sin typo serio. |
| **Meilisearch** | **Default Educabot para product search.** Cursos, contenidos, catálogo. | OSS, typo-tolerant out-of-the-box, facets, rápido, self-host fácil, docs claras. | No escala horizontalmente trivial, no full analytics. |
| **Typesense** | Alt a Meilisearch si querés cluster HA simple. | OSS, similar a Meili, clustering nativo, buena API. | Comunidad más chica, menos integraciones. |
| **Elasticsearch / OpenSearch** | Escala (>10M docs), analytics, logs, agregaciones complejas. | Ecosistema gigante, Kibana, agregaciones potentes. | Ops pesado, JVM, tuning difícil, caro en cloud. |
| **Algolia** | SaaS premium, time-to-market crítico, presupuesto holgado. | Cero ops, docs excelentes, InstantSearch listo. | $$$, vendor lock-in, data fuera, pricing por operación. |

**Default Educabot:** empezá con **Meilisearch** para catálogo + **Postgres FTS** para búsquedas transaccionales (tickets, logs, usuarios internos). Subí a OpenSearch solo si el volumen lo obliga.

---

## 2. Postgres FTS + pg_trgm (caso simple)

Para apps Educabot con catálogos chicos o búsqueda interna.

### Setup

```sql
-- Extension para fuzzy / typo
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Columna tsvector generada (Postgres 12+)
ALTER TABLE courses
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(tags, '')), 'C')
  ) STORED;

-- GIN index para FTS
CREATE INDEX idx_courses_search ON courses USING GIN (search_vector);

-- GIN trigram para typo / ILIKE rápido
CREATE INDEX idx_courses_title_trgm ON courses USING GIN (title gin_trgm_ops);
```

### Query pattern

```sql
-- Full-text con ranking
SELECT id, title, ts_rank(search_vector, query) AS rank
FROM courses, plainto_tsquery('spanish', $1) query
WHERE search_vector @@ query
  AND tenant_id = $2
ORDER BY rank DESC
LIMIT 20;

-- Typo tolerance con trigram (fallback)
SELECT id, title, similarity(title, $1) AS sim
FROM courses
WHERE title % $1 AND tenant_id = $2
ORDER BY sim DESC
LIMIT 20;
```

**Nota multilingüe:** si mezclás es/pt, guardá `language` en la fila y generá dos columnas tsvector (`search_vector_es`, `search_vector_pt`) o usá `simple` como dictionary genérico.

**Limitaciones:**
- Typo tolerance flojo (pg_trgm es char-ngram, no lingüístico).
- Faceting con counts → hay que hacerlo a mano con GROUP BY.
- Highlighting básico (`ts_headline`).

Si empezás a pelearte con estas → subí a Meilisearch.

---

## 3. Meilisearch (default product search)

### Instance + bootstrap

```yaml
# docker-compose.yml
services:
  meilisearch:
    image: getmeili/meilisearch:v1.6
    environment:
      - MEILI_MASTER_KEY=${MEILI_MASTER_KEY}
      - MEILI_ENV=production
    volumes:
      - meili_data:/meili_data
    ports:
      - "7700:7700"
```

**Keys:**
- `MEILI_MASTER_KEY`: solo en backend, nunca en código.
- Generá **search-only keys** con `expiresAt` y filtro forzado por `tenantId` (tenant-scoped key).
- Nunca expongas master key en frontend.

### Index `courses` — settings

```json
{
  "searchableAttributes": ["title", "description", "tags", "author"],
  "filterableAttributes": ["tenantId", "category", "level", "language", "published"],
  "sortableAttributes": ["createdAt", "popularity"],
  "rankingRules": [
    "words",
    "typo",
    "proximity",
    "attribute",
    "sort",
    "exactness",
    "popularity:desc"
  ],
  "stopWords": ["el", "la", "de", "que", "y", "a", "o", "do", "da"],
  "synonyms": {
    "programacion": ["coding", "programación", "programming"],
    "mate": ["matematica", "matemática", "matemáticas"]
  },
  "typoTolerance": {
    "enabled": true,
    "minWordSizeForTypos": { "oneTypo": 4, "twoTypos": 8 }
  },
  "faceting": { "maxValuesPerFacet": 100 }
}
```

**Tip:** `searchableAttributes` está ordenado por importancia. `title` primero = matches en título rankean más alto.

---

## 4. Indexing pipeline (outbox pattern)

**Anti-patrón común:** llamar a Meili/ES desde el handler HTTP (acople + latencia + falla si el index está caído).

**Patrón correcto:** outbox + worker async.

### Flow

```
[ HTTP POST /courses ]
        │
        ▼
  DB transaction:
    - INSERT course
    - INSERT outbox_event (type='course.upserted', payload=...)
  COMMIT
        │
        ▼ (async)
  [ Indexer Worker ]
    - Poll outbox_events WHERE processed_at IS NULL
    - Batch por tipo (hasta 500 docs)
    - POST a Meili /indexes/courses/documents
    - UPDATE outbox_events SET processed_at = NOW()
```

### Tabla outbox

```sql
CREATE TABLE outbox_events (
  id BIGSERIAL PRIMARY KEY,
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_outbox_pending ON outbox_events (created_at) WHERE processed_at IS NULL;
```

### Go indexer (ejemplo Alizia-BE style)

```go
type Indexer struct {
    meili  *meilisearch.Client
    db     *gorm.DB
    logger *slog.Logger
}

func (i *Indexer) Run(ctx context.Context) error {
    ticker := time.NewTicker(2 * time.Second)
    defer ticker.Stop()
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-ticker.C:
            if err := i.processBatch(ctx); err != nil {
                i.logger.Error("indexer batch failed", "err", err)
            }
        }
    }
}

func (i *Indexer) processBatch(ctx context.Context) error {
    var events []OutboxEvent
    if err := i.db.WithContext(ctx).
        Where("processed_at IS NULL").
        Order("created_at ASC").
        Limit(500).
        Find(&events).Error; err != nil {
        return err
    }
    if len(events) == 0 {
        return nil
    }

    docs := make([]map[string]any, 0, len(events))
    deletes := make([]string, 0)
    for _, e := range events {
        switch e.EventType {
        case "upserted":
            var doc map[string]any
            _ = json.Unmarshal(e.Payload, &doc)
            doc["tenantId"] = e.TenantID
            docs = append(docs, doc)
        case "deleted":
            deletes = append(deletes, e.AggregateID.String())
        }
    }

    idx := i.meili.Index("courses")
    if len(docs) > 0 {
        if _, err := idx.UpdateDocuments(docs); err != nil {
            return err
        }
    }
    if len(deletes) > 0 {
        if _, err := idx.DeleteDocuments(deletes); err != nil {
            return err
        }
    }

    ids := lo.Map(events, func(e OutboxEvent, _ int) int64 { return e.ID })
    return i.db.WithContext(ctx).
        Model(&OutboxEvent{}).
        Where("id IN ?", ids).
        Update("processed_at", time.Now()).Error
}
```

**Reglas:**
- No sync en el request HTTP. Latencia del usuario ≠ latencia de indexado.
- Batching obligatorio (500 docs o 1MB, lo que venga primero).
- Retries con backoff, tras N fallos → mover a DLQ.
- Siempre agregar `tenantId` al doc antes de indexar.

---

## 5. Multi-tenant

Dos estrategias:

### A. Filtro por tenantId (recomendado para <100 tenants)

- Un solo index `courses`.
- Cada doc lleva `tenantId`.
- Toda query agrega `filter: "tenantId = X"` (forzado en el backend).
- Search-only key con `tenantTokenFilter` por tenant.

**Pro:** barato, reindex único, synonyms compartidos.
**Contra:** si un tenant tiene 10M docs y otro 100, el grande degrada al chico.

### B. Index por tenant

- Un index `courses_{tenantId}` por tenant.
- Aislamiento total, per-tenant tuning.

**Pro:** aislamiento, delete tenant = delete index.
**Contra:** más ops, synonyms duplicados, reindex en loop.

**Default Educabot:** A (filtro) hasta que un tenant justifique B.

### Token scoping (Meili)

```go
tenantToken, _ := client.GenerateTenantToken(
    apiKeyUID,
    map[string]interface{}{
        "courses": map[string]interface{}{
            "filter": fmt.Sprintf("tenantId = %q", tenantID),
        },
    },
    &meilisearch.TenantTokenOptions{
        ExpiresAt: time.Now().Add(1 * time.Hour),
    },
)
// Devolver tenantToken al frontend, NO el master key.
```

---

## 6. Permisos y exposición al frontend

**Reglas no negociables:**

1. **Nunca** exponer `MEILI_MASTER_KEY` al frontend.
2. Opciones válidas:
   - **Proxy endpoint backend:** frontend llama a `/api/search`, backend firma y forwardea a Meili. Más control, observabilidad, rate limit.
   - **Tenant token (search-only):** frontend llama directo a Meili con token corto tenant-scoped. Menos latencia, menos control.
3. Default Educabot: **proxy endpoint**. Al pasar a InstantSearch masivo, evaluar tenant token.
4. Rate limit del endpoint de search (ver `/rate-limiting`).
5. Input sanitization: no es SQLi, pero filtros de usuario no deben inyectar operadores (`filter: user_input` → jamás).

---

## 7. Multilingüe es/pt

Educabot opera en LatAm → español + portugués (Brasil).

- **Postgres FTS:** dictionary `spanish` o `portuguese`; si mezclás, columna `language` y usar el dict correcto.
- **Meilisearch:** detecta segmentación por idioma automáticamente (v1.2+). Pero:
  - Agregá `language` en el doc.
  - Stopwords específicas (es: `el, la, de`; pt: `o, a, do, da`).
  - Synonyms cross-language si querés que "matemática" matchee "matemática" en pt.
- Si el frontend sabe el idioma del user, pasá `filter: "language = 'es'"` para achicar el espacio de búsqueda.

---

## 8. Autocomplete / instant search

- Debounce 150ms en el frontend. No hagas 1 request por keystroke.
- `limit: 5-10` en autocomplete, no 50.
- Meili tiene `/indexes/.../search` con `attributesToHighlight` — usalo para resaltar match.
- Cache del lado del frontend (last 20 queries) para back/forward instantáneo.
- En Postgres: `LEFT(title, 50)` + trigram alcanza para admin panels.

### React client (TS)

```tsx
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";

export function SearchBox({ tenantToken }: { tenantToken: string }) {
  const [q, setQ] = useState("");
  const [debounced] = useDebounce(q, 150);
  const [hits, setHits] = useState<Course[]>([]);

  useEffect(() => {
    if (!debounced) return setHits([]);
    const ctrl = new AbortController();
    fetch(`${MEILI_URL}/indexes/courses/search`, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Authorization": `Bearer ${tenantToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: debounced,
        limit: 8,
        attributesToHighlight: ["title"],
      }),
    })
      .then(r => r.json())
      .then(d => setHits(d.hits))
      .catch(() => {});
    return () => ctrl.abort();
  }, [debounced, tenantToken]);

  return (
    <div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar cursos..." />
      <ul>{hits.map(h => <li key={h.id}>{h.title}</li>)}</ul>
    </div>
  );
}
```

---

## 9. Faceting y filtros

- Declarar atributos en `filterableAttributes` (Meili) antes de filtrar.
- UI: checkboxes por categoría / nivel / idioma. Counts vienen en la respuesta (`facetDistribution`).
- Regla: siempre mostrar count al lado del filtro ("Matemática (42)").
- Filtros combinados con AND: `filter: "category = 'math' AND level = 'beginner'"`.
- OR dentro de misma facet, AND entre facets — convención de InstantSearch.

---

## 10. Relevancia tuning

Iterativo, dirigido por datos, no por gut feeling.

**Palancas:**
- **Ranking rules order:** subí `exactness` si los usuarios se quejan de matches raros.
- **Synonyms:** "mate" = "matemática" = "matemáticas". Curar desde search logs.
- **Boosts:** `popularity:desc` al final del ranking; o `sort: ["featured:desc"]` en queries.
- **Stopwords:** eliminar palabras funcionales del idioma.
- **Typo tolerance:** ajustar `minWordSizeForTypos` para evitar falsos positivos en códigos.

**Workflow de mejora:**
1. Medir: query latency p95, zero-result rate, CTR@5.
2. Sample 50 queries con 0 results → ver qué falta (synonym, typo, doc missing).
3. Ajustar settings o corpus.
4. Reindex, medir de nuevo.

---

## 11. Reindex full (alias switch)

**Nunca** hagas `DELETE index + CREATE index + reindex` en prod. Queda minutos sin búsqueda.

**Patrón alias switch (Meili ≥1.6 con `swapIndexes`):**

```
1. Index actual: courses (servido)
2. Crear courses_v2 vacío con settings nuevos
3. Reindex full desde DB → courses_v2 (async, horas si hace falta)
4. Verificar counts, spot-check queries
5. POST /swap-indexes [{indexes: ["courses", "courses_v2"]}]
6. Borrar el viejo (ahora llamado courses_v2)
```

En Elasticsearch/OpenSearch es el mismo patrón con aliases.

**Triggers típicos de full reindex:**
- Cambio de schema de doc (nuevo campo searchable).
- Cambio de settings irreversibles (stopwords, typoTolerance drástica).
- Recovery tras corrupción / data drift.

---

## 12. Observabilidad

Métricas mínimas a exponer (ver `/observability-setup`):

- **Query latency p50 / p95 / p99.** Alertá si p95 > 200ms.
- **Zero-result rate.** Target <5%. Si sube, hay gap de corpus o de synonyms.
- **CTR@5 / @10.** Cuántos clickean algo del top 5. <20% = relevancia mala.
- **Index lag:** `now() - max(created_at)` de outbox pendientes. Alertá si >30s.
- **Outbox backlog size:** filas sin procesar.
- **Failed events:** attempts > N.

Log estructurado de cada query (sampling 1%): `{tenantId, query, resultCount, latencyMs, filters}`.

---

## Anti-patterns (❌)

- ❌ **Indexar desde el handler HTTP** ("sync write"). Acople + latencia + falla en cascada.
- ❌ **Query DB live con `LIKE '%x%'`** sobre 1M filas sin índice. Full scan garantizado.
- ❌ **API key master en el frontend.** Exposición total. Usá tenant token o proxy.
- ❌ **Reindex all sin alias switch en prod.** Downtime de búsqueda.
- ❌ **Sin filtro de tenantId forzado en backend.** Leak cross-tenant.
- ❌ **Pasar input de usuario directo a `filter:`.** Inyección de operadores.
- ❌ **Empezar con Elasticsearch "por si escalamos".** YAGNI. Ops pesado gratis.
- ❌ **Un index por usuario** (en vez de por tenant). Explosión de índices.
- ❌ **Synonyms sin curar.** Se degrada relevancia. Revisalo trimestralmente.
- ❌ **Sin métricas de zero-result / CTR.** Tuning a ciegas.
- ❌ **Debounce 0ms en autocomplete.** DDoS a tu propio search.
- ❌ **Borrar docs por soft-delete pero dejarlos en el index.** Resultados fantasma.

---

## Checklist review

Antes de mergear / deployar una feature de search:

- [ ] Engine elegido con justificación (no "porque sí").
- [ ] Indexing es async vía outbox, no en el handler.
- [ ] `tenantId` forzado en todos los filtros backend.
- [ ] `MEILI_MASTER_KEY` / equivalente NO está en frontend ni en repo.
- [ ] Search-only key o proxy implementado.
- [ ] Rate limit en endpoint de search.
- [ ] Settings del index versionados en repo (`meili/courses.settings.json`).
- [ ] Script de reindex full documentado y testeado en staging.
- [ ] Alias switch pattern para cambios breaking.
- [ ] Stopwords y synonyms por idioma (es/pt).
- [ ] Debounce ≥150ms en autocomplete.
- [ ] Métricas: latency p95, zero-result, index lag.
- [ ] Log sampling de queries (sin PII).
- [ ] Soft-delete → delete del index también.
- [ ] Test e2e: upsert DB → en ≤5s aparece en search.

---

## Output final (✅)

Al terminar la setup, entregá un resumen así:

```
✅ Search — Alizia

Engine:            Meilisearch 1.6 (self-host, docker)
Index principal:   courses (45.2k docs, 3 tenants)
Pipeline:          Postgres outbox → Go indexer (batch 500, 2s poll)
Exposición:        Backend proxy /api/search + rate limit 30 req/min/user
Multi-tenant:      Filtro forzado tenantId (search-only key scoped)
Idiomas:           es, pt (stopwords + synonyms curados)
Reindex:           Script meili-reindex.sh con alias swap, probado en staging
Observabilidad:    p95=42ms, zero-result=3.1%, index lag p95=1.4s

Próximos pasos:
- Synonyms "programación" (falta variantes pt)
- Boost por popularidad (CTR data desde la semana 3)
- Evaluar facet "formato" cuando haya >5 valores
```

---

## Delegación

**Delegar a:**
- `backend-architect` — Cuando el pipeline afecta arquitectura de servicios (nuevo worker, colas, eventos cross-service).
- `database-architect` — Cuando hay que decidir índices PG, partitioning de outbox, replicación read-only para indexer.

**Skills relacionadas:**
- `/observability-setup` — Métricas de search (latency, zero-result, CTR).
- `/i18n-setup` — Idiomas del corpus, detección de locale, stopwords por idioma.
- `/rate-limiting` — Proteger endpoint de search de abuso / scraping.
- `/caching-strategy` — Cache de queries frecuentes, invalidación cuando reindexás.
