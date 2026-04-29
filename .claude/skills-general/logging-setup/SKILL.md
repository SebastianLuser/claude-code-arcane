---
name: logging-setup
description: "Structured logging: slog/pino, Cloud Logging, Loki, correlation IDs, PII scrubbing, sampling, cost control."
category: "observability"
argument-hint: "[stack: go|ts|react|rn]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# logging-setup — Structured Logging

Objetivo: **debuggable en prod, barato a escala, sin PII**.

## Principios

1. JSON estructurado siempre — nunca strings libres en prod
2. Una línea = un evento — no multi-line/pretty-print
3. Level + message + context en todo evento
4. Correlation ID (trace_id, request_id, user_id, tenant_id) en cada línea
5. Sin PII — scrubber en el logger
6. Sampling en hot paths
7. Logs ≠ errors ≠ metrics ≠ traces — cada uno su destino

## Stack Decision

| Destino | Cuándo |
|---------|--------|
| **GCP Cloud Logging** | **Default Educabot** (runtime GCP), $0.50/GiB ingest |
| Grafana Loki | Self-host, alto volumen barato |
| Datadog Logs | Si ya pagan DD APM |
| ELK/OpenSearch | Compliance/SIEM full-text |

Default: Cloud Logging (runtime) + Loki (alto volumen/cheap retention).

## Setup por Stack

**Go (slog stdlib 1.21+):** `slog.NewJSONHandler` con level configurable, ReplaceAttr para PII scrubbing, base fields (service, env, version). Middleware Gin inyecta request-scoped attrs (request_id, trace_id, route) en context.

**Node/TS (pino):** level via env, base fields, `redact.paths` para PII (password, token, authorization, cookie, dni, cuit), `pinoHttp` middleware con custom props (trace_id) y serializers compactos. Pino > winston: 5x más rápido, JSON nativo.

**Cloud Logging fields:** `severity` (DEBUG-CRITICAL), `logging.googleapis.com/trace` (auto-link a Cloud Trace), `httpRequest` (método/status/latency como columnas). Cloud Run/GKE: stdout se loguea automáticamente.

**React/frontend:** errores → Sentry, analytics → Mixpanel/Amplitude. Si necesitás logs centralizados: buffer + batch + flush a `/api/logs`, solo warn+ en prod. Evitar loguear interacciones rutinarias.

**React Native:** errores → Sentry, analytics → Mixpanel. Debug en campo: `react-native-logs` (archivos rotados), upload con consent. Nunca PII en logs del device.

## Correlation / Trace IDs

OTel W3C Trace Context (`traceparent`). Todo log en un request con mismo trace_id. Go: `trace.SpanFromContext(ctx).SpanContext().TraceID()`.

## Log Levels

| Level | Uso |
|-------|-----|
| DEBUG | Flujo interno. Off en prod salvo troubleshooting |
| INFO | Eventos normales. Default prod |
| WARN | Recuperable ("retry 2/3"). Mirar tendencias |
| ERROR | Falla operación, sistema sigue. → Sentry también |
| FATAL | Se muere el servicio. Raro. Page on-call |

Si nadie va a hacer algo con la línea → bájala de level o sacala.

## Sampling

Cloud Logging ~$0.50/GiB. Estrategia: siempre errores 100%, samplear éxitos (5-10%). Con OTel tracing, bajar INFO a 1-5%.

> → Read references/pii-audit-access.md for PII scrubbing fields, audit log schema, access log fields, and retention/cost tables

> → Read references/anti-patterns.md for common logging anti-patterns

> → Read references/checklist.md for the 12-item implementation checklist

## Checklist

- [ ] Log destination chosen and configured (Cloud Logging, Loki, Datadog, or ELK)
- [ ] Correlation IDs (trace_id, request_id) injected in every log line via middleware
- [ ] PII scrubbing in place (password, token, authorization, cookie, dni, cuit redacted)
- [ ] Sampling strategy defined (errors 100%, success paths 5-10%)
- [ ] Log levels set correctly per environment (DEBUG off in prod, INFO as default)
- [ ] JSON structured format enforced — no free-form strings in production
