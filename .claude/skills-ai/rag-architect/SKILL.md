---
name: rag-architect
description: "Design, implement, and optimize production-grade RAG pipelines covering document chunking, embedding model selection, vector databases, retrieval strategies, and evaluation frameworks."
category: "ai"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# RAG Architect

Comprehensive tools and knowledge for designing, implementing, and optimizing production-grade RAG (Retrieval-Augmented Generation) pipelines.

## Core Competencies

### 1. Document Processing & Chunking Strategies

| Strategy | Best For | Pros | Cons |
|----------|----------|------|------|
| **Fixed-Size** | Uniform documents, consistent sizes | Predictable, simple | May break semantic units |
| **Sentence-Based** | Narrative text, articles | Preserves language boundaries | Variable chunk sizes |
| **Paragraph-Based** | Structured docs, technical docs | Preserves logical structure | Highly variable sizes |
| **Semantic** | Long-form, research papers | Maintains semantic coherence | Complex, computationally expensive |
| **Recursive** | Mixed content types | Optimal chunk utilization | Complex logic |
| **Document-Aware** | Multi-format collections | Preserves structure and metadata | Format-specific implementation |

> See references/chunking_strategies_comparison.md for detailed implementation guidance.

### 2. Embedding Model Selection

| Model Tier | Dimensions | Speed | Use Case |
|-----------|-----------|-------|----------|
| Fast | 128-384 | ~14k tokens/sec | Simple domains, prototyping |
| Balanced | 512-768 | ~2.8k tokens/sec | Most applications |
| Quality | 1024-1536 | API-dependent | Complex domains |
| Specialized | Varies | Varies | Code, scientific, multilingual |

> See references/embedding_model_benchmark.md for full model comparison.

### 3. Vector Database Selection

| Database | Type | Best For | Key Feature |
|----------|------|----------|-------------|
| **Pinecone** | Managed | Production, managed service | Auto-scaling, metadata filtering |
| **Weaviate** | Open source | Complex data types | GraphQL API, multi-modal |
| **Qdrant** | Rust-based | High-performance | Low memory footprint |
| **Chroma** | Embedded | Development, prototyping | SQLite-based, easy setup |
| **pgvector** | SQL extension | Existing PostgreSQL infra | ACID compliance, joins |

### 4. Retrieval Strategies

- **Dense Retrieval**: Semantic similarity via embedding cosine similarity. Good for paraphrasing.
- **Sparse Retrieval**: Keyword-based (TF-IDF, BM25). Good for exact matches.
- **Hybrid Retrieval**: Dense + sparse with Reciprocal Rank Fusion (RRF).
- **Reranking**: Two-stage approach with cross-encoders for higher precision.

### 5. Query Transformation Techniques

- **HyDE**: Generate hypothetical answer, embed that instead of query
- **Multi-Query**: Generate 3-5 query variations, retrieve for each, merge results
- **Step-Back Prompting**: Generate broader version of specific query for general context

### 6. Context Window Optimization

- **Dynamic Assembly**: Most relevant chunks first, diversity optimization, token budget management
- **Context Compression**: Summarize less relevant chunks, extract key facts, selective inclusion

### 7. Evaluation Frameworks

> See references/rag_evaluation_framework.md for comprehensive evaluation details.

| Metric | Target | Description |
|--------|--------|-------------|
| Faithfulness | >90% | Answer grounded in retrieved context |
| Context Relevance | >0.8 | Retrieved chunks relevant to query |
| Answer Relevance | >0.85 | Answer addresses original question |
| Precision@K | Varies | % of top-K results that are relevant |
| NDCG@K | Varies | Normalized Discounted Cumulative Gain |

### 8. Production Patterns

- **Caching**: Query-level, semantic, chunk-level, multi-level (Redis hot, disk warm)
- **Streaming**: Progressive loading, incremental generation, real-time updates
- **Fallbacks**: Graceful degradation, cache fallbacks, alternative sources

### 9. Cost Optimization

- **Embeddings**: Batch processing, caching, model selection, update only changed docs
- **Vector DB**: Index optimization, quantization, tiered storage, auto-scaling
- **Queries**: Routing, result caching, batch querying, metadata filtering

### 10. Guardrails & Safety

- **Content**: Toxicity detection, PII handling, content validation, source verification
- **Query**: Injection prevention, rate limiting, input validation, access controls
- **Response**: Hallucination detection, confidence scoring, source attribution, uncertainty handling

## Implementation Best Practices

1. Requirements gathering: understand use case, scale, quality requirements
2. Data analysis: analyze document corpus characteristics
3. Prototype: build minimal viable RAG pipeline
4. Chunking optimization: test different strategies
5. Retrieval tuning: optimize parameters and thresholds
6. Evaluation setup: implement comprehensive metrics
7. Production deployment: scale-ready with monitoring

## Monitoring & Maintenance

- **Query analytics**: Track patterns and performance
- **Retrieval metrics**: Monitor precision, recall, latency
- **Generation quality**: Track faithfulness and relevance
- **System health**: Database performance and availability
- **Cost tracking**: Embedding and vector database costs
- **Document refresh**: Handle new documents and updates
- **Index maintenance**: Regular optimization
- **Model updates**: Evaluate and migrate to improved models
