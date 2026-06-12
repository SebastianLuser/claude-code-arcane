---
name: pgvector-search
description: "Búsqueda semántica con Postgres + pgvector: embeddings, schema con columna vector, índices HNSW/IVFFlat, queries de similitud y RAG. Usar para implementar semantic search o retrieval sobre Postgres."
category: "backend"
argument-hint: "[setup|index|query|rag]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# pgvector-search — Búsqueda semántica con Postgres

## MANDATORY WORKFLOW

**Antes de generar o modificar código/schema, completar estos pasos en orden.**

### Step 0: Gather Requirements
1. **Modelo de embeddings** y dimensión (ej: OpenAI `text-embedding-3-small` = 1536; Cohere = 1024)
2. **Volumen** de vectores (define el índice: HNSW para alta recall, IVFFlat para datasets grandes/escritura frecuente)
3. **Métrica de distancia:** cosine (`<=>`, default para texto) / L2 (`<->`) / inner product (`<#>`)
4. ¿Es para RAG (retrieval + LLM) o solo ranking de similitud?

### Step 1: Habilitar extensión + schema
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE documents (
  id bigserial PRIMARY KEY,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb
);
```

### Step 2: Índice
```sql
-- HNSW: mejor recall/latencia, recomendado por defecto
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);
-- IVFFlat (alternativa para datasets muy grandes): definir lists ≈ rows/1000
```

### Step 3: Insertar embeddings
Generar el embedding del `content` con el modelo y guardarlo. (Si usás Next + AI SDK, ver skill `ai-sdk-setup`.)
```ts
const { embedding } = await embed({ model, value: content });
await sql`INSERT INTO documents (content, embedding) VALUES (${content}, ${JSON.stringify(embedding)})`;
```

### Step 4: Query de similitud
```sql
SELECT content, 1 - (embedding <=> $1) AS similarity
FROM documents
ORDER BY embedding <=> $1   -- usa el índice
LIMIT 5;
```

### Step 5: Buenas prácticas
- **Chunking** del contenido antes de embeddear (no documentos enteros)
- Filtrar por `metadata` (jsonb) + similitud para hybrid search
- `SET hnsw.ef_search` para tunear recall vs latencia
- Re-embeddear si cambia el modelo (la dimensión debe matchear)
- No mezclar embeddings de modelos distintos en la misma columna

## Cierre

Verificar que el índice se usa (`EXPLAIN ANALYZE` debe mostrar Index Scan, no Seq Scan) y medir recall/latencia con queries reales. Schema + índice + query validados → setup **READY**. Confirmar cambios de schema con el usuario antes de aplicarlos. Siguiente paso: skill `ai-sdk-setup` para generar embeddings, o `database-indexing` para tuning.

---

_Inspirado en `postgres-semantic-search` de [laguagu/claude-code-nextjs-skills](https://github.com/laguagu/claude-code-nextjs-skills). Adaptado al formato Arcane. Relacionado: skill `database-indexing`._
