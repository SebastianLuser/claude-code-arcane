---
name: distributed-tracing
description: "Distributed tracing con OpenTelemetry: setup Go/TS/React/RN, Cloud Trace, Tempo, Datadog, sampling, correlación con logs."
category: "observability"
argument-hint: "[stack: go|ts|react|rn] [provider: gcp|tempo|datadog]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Distributed Tracing — OpenTelemetry + Cloud Trace

**Standard Educabot:** OTel SDK + OTLP exporter → **Google Cloud Trace** (prod), Jaeger local (dev). Siempre OTLP para switchear backend sin tocar código.

## Backends

| Backend | Cuándo |
|---|---|
| **Google Cloud Trace** | Default (Cloud Run/GKE), factura por span |
| Grafana Tempo | Self-host, budget-conscious, parea con Loki+Grafana |
| Datadog APM | Org con DD enterprise |
| Honeycomb | Debug complejo, high-cardinality BubbleUp |
| Jaeger OSS | Dev local / fallback |

## Setup por Stack

**Go (Gin):** `InitTracing()` con Cloud Trace exporter, resource attributes (service.name, deployment.environment), `ParentBased(TraceIDRatioBased)` sampler, `TraceContext+Baggage` propagator. Middleware: `otelgin.Middleware("service-name")`. HTTP client: `otelhttp.NewTransport()`. DB: `otelsql.Open()`. Custom span: `tracer.Start(ctx, "op")` + `defer span.End()` + `span.SetAttributes()` + `span.RecordError()`.

**Node/TS:** `NodeSDK` con auto-instrumentations (disable fs). Import ANTES que cualquier otro require (`--require ./dist/tracing.js`). Resource: service.name + environment. Sampler: `ParentBased(TraceIDRatioBased(0.1))` prod. Custom span: `tracer.startActiveSpan()` + try/catch/finally con `span.end()`.

**React web:** `WebTracerProvider` + `FetchInstrumentation` con `propagateTraceHeaderCorsUrls`. Samplear 1-5% (tráfico browser enorme).

**React Native:** mismo approach que web, cuidado con bundle size y battery.

## Propagación

HTTP: automático con otelhttp/auto-instrumentation (header `traceparent`). PubSub/Kafka: inject/extract manual en message attributes con `MapCarrier`.

## Sampling

| Entorno | Rate | Sampler |
|---|---|---|
| Dev/staging | 100% | AlwaysSample |
| Prod | 10% | TraceIDRatioBased(0.1) + ParentBased |
| Errores/latencia alta | 100% | Tail-based (Collector) |

Tail-based requiere OTel Collector intermedio con policies: errors (status_code ERROR), slow (threshold_ms 1000), random (10%).

## Correlación con Logs

Incluir `trace_id` + `span_id` en cada log line. Cloud Logging: `logging.googleapis.com/trace` → link directo en Cloud Trace UI.

## Errores & Attributes

`span.RecordError(err)` + `span.SetStatus(codes.Error, msg)`. Attributes OK: user.id, tenant.id, result.count, http.route. **NO:** email, password, tokens, contenido libre, responses completas de DB.

Link con Bugsnag: incluir trace_id en metadata del error → saltar desde Bugsnag a Cloud Trace.

## Anti-patterns

- Sampling 100% en prod → factura explosiva
- Sin propagation → spans huérfanos
- PII en attributes
- Spans demasiado finos (cada helper) → overhead + ruido
- Sin correlación con logs
- Olvidar `span.End()` → memory leak
- `log.Printf("took %dms")` en vez de spans
- Instrumentar manual lo que auto-instrumentation ya cubre
- Exportar directo sin Collector → no hay tail sampling ni filtro PII
- traceparent no propagado en PubSub/Kafka
- AlwaysSample en React web prod

## Checklist

- [ ] SDK OTel inicializado antes de cualquier dependencia
- [ ] service.name + deployment.environment como resource attributes
- [ ] Propagator: TraceContext + Baggage
- [ ] Sampler: ParentBased(TraceIDRatioBased), 10% prod, 100% dev
- [ ] HTTP server middleware (otelgin / auto-instr)
- [ ] HTTP client wrapped (otelhttp / auto-instr)
- [ ] DB driver wrapped (otelsql / Prisma instr)
- [ ] PubSub/Kafka: inject/extract manual de traceparent
- [ ] Logs incluyen trace_id + span_id
- [ ] span.RecordError + SetStatus(Error) en paths de error
- [ ] Shutdown limpio en SIGTERM
- [ ] Sin PII en attributes (grep email|password|token)
- [ ] Frontend samplea <=5%
- [ ] Collector intermedio para tail-sampling en prod
