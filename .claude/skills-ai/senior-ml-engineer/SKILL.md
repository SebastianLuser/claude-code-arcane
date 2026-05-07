---
name: senior-ml-engineer
description: "ML engineering for productionizing models, building MLOps pipelines, and integrating LLMs. Covers deployment, feature stores, drift monitoring, RAG systems, and cost optimization."
category: "ai"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Senior ML Engineer

Production ML engineering patterns for model deployment, MLOps infrastructure, and LLM integration. May write or edit Dockerfiles, Kubernetes manifests, pipeline configs, and monitoring rules.

## Model Deployment Workflow

1. Export model to standardized format (ONNX, TorchScript, SavedModel)
2. Package with dependencies in Docker container
3. Deploy to staging, run integration tests
4. Deploy canary (5% traffic) to production
5. Monitor latency and error rates for 1 hour
6. Promote to full production if metrics pass
7. **Validation:** p95 latency < 100ms, error rate < 0.1%

### Serving Options

| Option | Latency | Throughput | Use Case |
|--------|---------|------------|----------|
| FastAPI + Uvicorn | Low | Medium | REST APIs, small models |
| Triton Inference Server | Very Low | Very High | GPU inference, batching |
| TorchServe | Low | High | PyTorch models |
| Ray Serve | Medium | High | Complex pipelines, multi-model |

## MLOps Pipeline Setup

1. Configure feature store (Feast, Tecton) for training data
2. Set up experiment tracking (MLflow, Weights & Biases)
3. Create training pipeline with hyperparameter logging
4. Register model in model registry with version metadata
5. Configure staging deployment triggered by registry events
6. Set up A/B testing infrastructure for model comparison
7. Enable drift monitoring with alerting
8. **Validation:** New models automatically evaluated against baseline

### Retraining Triggers

| Trigger | Detection | Action |
|---------|-----------|--------|
| Scheduled | Cron (weekly/monthly) | Full retrain |
| Performance drop | Accuracy < threshold | Immediate retrain |
| Data drift | PSI > 0.2 | Evaluate, then retrain |
| New data volume | X new samples | Incremental update |

## LLM Integration Workflow

1. Create provider abstraction layer for vendor flexibility
2. Implement retry logic with exponential backoff
3. Configure fallback to secondary provider
4. Set up token counting and context truncation
5. Add response caching for repeated queries
6. Implement cost tracking per request
7. Add structured output validation with Pydantic
8. **Validation:** Response parses correctly, cost within budget

> See references/llm_integration_guide.md for provider abstraction patterns and cost management details.

## RAG System Implementation

1. Choose vector database (Pinecone, Qdrant, Weaviate)
2. Select embedding model based on quality/cost tradeoff
3. Implement document chunking strategy
4. Create ingestion pipeline with metadata extraction
5. Build retrieval with query embedding and reranking
6. Format context and send to LLM
7. **Validation:** Response references retrieved context, no hallucinations

> See references/rag_system_architecture.md for vector DB comparison, chunking strategies, and hybrid search patterns.

## Model Monitoring

1. Set up latency tracking (p50, p95, p99)
2. Configure error rate alerting
3. Implement input data drift detection
4. Track prediction distribution shifts
5. Log ground truth when available
6. Compare model versions with A/B metrics
7. Set up automated retraining triggers

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| p95 latency | > 100ms | > 200ms |
| Error rate | > 0.1% | > 1% |
| PSI (drift) | > 0.1 | > 0.2 |
| Accuracy drop | > 2% | > 5% |

> See references/mlops_production_patterns.md for Kubernetes manifests, Feast examples, and monitoring code.

## Tools

```bash
# Model deployment
python scripts/model_deployment_pipeline.py --model model.pkl --target staging

# RAG system scaffolding
python scripts/rag_system_builder.py --config rag_config.yaml --analyze

# ML monitoring setup
python scripts/ml_monitoring_suite.py --config monitoring.yaml --deploy
```

## Tech Stack

| Category | Tools |
|----------|-------|
| ML Frameworks | PyTorch, TensorFlow, Scikit-learn, XGBoost |
| LLM Frameworks | LangChain, LlamaIndex, DSPy |
| MLOps | MLflow, Weights & Biases, Kubeflow |
| Data | Spark, Airflow, dbt, Kafka |
| Deployment | Docker, Kubernetes, Triton |
| Databases | PostgreSQL, BigQuery, Pinecone, Redis |
