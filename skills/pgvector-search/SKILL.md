---
name: pgvector-search
description: "Semantic search with Postgres + pgvector: embeddings, schema with a vector column, HNSW/IVFFlat indexes, similarity queries and RAG. Use to implement semantic search or retrieval on Postgres."
category: "backend"
argument-hint: "[setup|index|query|rag]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# pgvector-search — Semantic search with Postgres

## MANDATORY WORKFLOW

**Before generating or modifying code/schema, complete these steps in order.**

### Step 0: Gather Requirements
1. **Embedding model** and dimension (e.g. OpenAI `text-embedding-3-small` = 1536; Cohere = 1024)
2. **Volume** of vectors (decides the index: HNSW for high recall, IVFFlat for large datasets/frequent writes)
3. **Distance metric:** cosine (`<=>`, default for text) / L2 (`<->`) / inner product (`<#>`)
4. Is it for RAG (retrieval + LLM) or just similarity ranking?

### Step 1: Enable the extension + schema
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE documents (
  id bigserial PRIMARY KEY,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb
);
```

### Step 2: Index
```sql
-- HNSW: best recall/latency, recommended by default
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);
-- IVFFlat (alternative for very large datasets): set lists ≈ rows/1000
```

### Step 3: Insert embeddings
Generate the embedding of `content` with the model and store it. (If you use Next + AI SDK, see the `ai-sdk-setup` skill.)
```ts
const { embedding } = await embed({ model, value: content });
await sql`INSERT INTO documents (content, embedding) VALUES (${content}, ${JSON.stringify(embedding)})`;
```

### Step 4: Similarity query
```sql
SELECT content, 1 - (embedding <=> $1) AS similarity
FROM documents
ORDER BY embedding <=> $1   -- uses the index
LIMIT 5;
```

### Step 5: Good practices
- **Chunk** the content before embedding (not whole documents)
- Filter by `metadata` (jsonb) + similarity for hybrid search
- `SET hnsw.ef_search` to tune recall vs latency
- Re-embed if the model changes (the dimension must match)
- Do not mix embeddings from different models in the same column

## Wrap-up

Verify the index is used (`EXPLAIN ANALYZE` must show Index Scan, not Seq Scan) and measure recall/latency with real queries. Schema + index + query validated → setup **READY**. Confirm schema changes with the user before applying them. Next step: the `ai-sdk-setup` skill to generate embeddings, or `database-indexing` for tuning.

---

_Inspired by `postgres-semantic-search` from [laguagu/claude-code-nextjs-skills](https://github.com/laguagu/claude-code-nextjs-skills). Adapted to the Arcane format. Related: the `database-indexing` skill._
