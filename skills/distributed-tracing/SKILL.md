---
name: distributed-tracing
description: "Distributed tracing with OpenTelemetry: Go/TS/React/RN setup, Cloud Trace, Tempo, Datadog, sampling, correlation with logs."
category: "observability"
argument-hint: "[stack: go|ts|react|rn] [provider: gcp|tempo|datadog]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Distributed Tracing — OpenTelemetry + Cloud Trace

**Educabot standard:** OTel SDK + OTLP exporter → **Google Cloud Trace** (prod), local Jaeger (dev). Always OTLP, so you can switch backends without touching code.

## Backends

| Backend | When |
|---|---|
| **Google Cloud Trace** | Default (Cloud Run/GKE), billed per span |
| Grafana Tempo | Self-host, budget-conscious, pairs with Loki+Grafana |
| Datadog APM | Org with DD enterprise |
| Honeycomb | Complex debugging, high-cardinality BubbleUp |
| Jaeger OSS | Local dev / fallback |

## Setup per Stack

**Go (Gin):** `InitTracing()` with the Cloud Trace exporter, resource attributes (service.name, deployment.environment), `ParentBased(TraceIDRatioBased)` sampler, `TraceContext+Baggage` propagator. Middleware: `otelgin.Middleware("service-name")`. HTTP client: `otelhttp.NewTransport()`. DB: `otelsql.Open()`. Custom span: `tracer.Start(ctx, "op")` + `defer span.End()` + `span.SetAttributes()` + `span.RecordError()`.

**Node/TS:** `NodeSDK` with auto-instrumentations (disable fs). Import BEFORE any other require (`--require ./dist/tracing.js`). Resource: service.name + environment. Sampler: `ParentBased(TraceIDRatioBased(0.1))` in prod. Custom span: `tracer.startActiveSpan()` + try/catch/finally with `span.end()`.

**React web:** `WebTracerProvider` + `FetchInstrumentation` with `propagateTraceHeaderCorsUrls`. Sample 1-5% (browser traffic is huge).

**React Native:** same approach as web; watch bundle size and battery.

## Propagation

HTTP: automatic with otelhttp/auto-instrumentation (`traceparent` header). PubSub/Kafka: manual inject/extract into message attributes with `MapCarrier`.

## Sampling

| Environment | Rate | Sampler |
|---|---|---|
| Dev/staging | 100% | AlwaysSample |
| Prod | 10% | TraceIDRatioBased(0.1) + ParentBased |
| Errors/high latency | 100% | Tail-based (Collector) |

Tail-based requires an intermediate OTel Collector with policies: errors (status_code ERROR), slow (threshold_ms 1000), random (10%).

## Correlation with Logs

Include `trace_id` + `span_id` in every log line. Cloud Logging: `logging.googleapis.com/trace` → direct link in the Cloud Trace UI.

## Errors & Attributes

`span.RecordError(err)` + `span.SetStatus(codes.Error, msg)`. OK attributes: user.id, tenant.id, result.count, http.route. **NOT:** email, password, tokens, free-form content, full DB responses.

Link with Bugsnag: include trace_id in the error metadata → jump from Bugsnag to Cloud Trace.

## Anti-patterns

- 100% sampling in prod → exploding bill
- No propagation → orphan spans
- PII in attributes
- Spans too fine-grained (every helper) → overhead + noise
- No correlation with logs
- Forgetting `span.End()` → memory leak
- `log.Printf("took %dms")` instead of spans
- Manually instrumenting what auto-instrumentation already covers
- Exporting directly without a Collector → no tail sampling and no PII filter
- traceparent not propagated in PubSub/Kafka
- AlwaysSample on React web in prod

## Checklist

- [ ] OTel SDK initialized before any dependency
- [ ] service.name + deployment.environment as resource attributes
- [ ] Propagator: TraceContext + Baggage
- [ ] Sampler: ParentBased(TraceIDRatioBased), 10% prod, 100% dev
- [ ] HTTP server middleware (otelgin / auto-instr)
- [ ] HTTP client wrapped (otelhttp / auto-instr)
- [ ] DB driver wrapped (otelsql / Prisma instr)
- [ ] PubSub/Kafka: manual inject/extract of traceparent
- [ ] Logs include trace_id + span_id
- [ ] span.RecordError + SetStatus(Error) on error paths
- [ ] Clean shutdown on SIGTERM
- [ ] No PII in attributes (grep email|password|token)
- [ ] Frontend samples <=5%
- [ ] Intermediate Collector for tail sampling in prod
