# Distributed Tracing Setup Details

## Backend Selection

| Backend | When |
|---------|------|
| **Google Cloud Trace** | Default for GCP (Cloud Run/GKE) |
| **Grafana Tempo** | Self-hosted, pairs with Loki |
| **Datadog APM** | Enterprise Datadog org |
| **Jaeger OSS** | Local dev / fallback |

Always export via OTLP — switch backends without code changes.

## Setup Decisions

| Decision | Guideline |
|----------|-----------|
| Instrumentation | Auto-instrumentation first. Manual spans only for business-critical ops. |
| Propagation | W3C Trace Context. Async (PubSub/Kafka): manual inject/extract in message attributes. |
| Sampling dev | 100% `AlwaysSample` |
| Sampling prod | 10% `ParentBased(TraceIDRatioBased(0.1))` |
| Sampling errors | 100% via tail-based sampling in OTel Collector |
| Frontend web | 1-5% (browser traffic is massive) |
| Log correlation | `trace_id` + `span_id` in every structured log line |

## Span Design Rules

- Resource attributes: `service.name`, `deployment.environment`
- Span attributes: user.id, tenant.id, http.route — never PII
- Always `RecordError()` + `SetStatus(Error)` on failures; always `defer span.End()`
- SDK initializes BEFORE other imports (Node: `--require`)

## OTel Collector (tail-based sampling)

Deploy between app and backend to capture 100% errors, 100% slow traces (>1000ms), probabilistic for rest.
