---
name: logging-setup
description: "Structured logging: slog/pino, Cloud Logging, Loki, correlation IDs, PII scrubbing, sampling, cost control."
category: "observability"
argument-hint: "[stack: go|ts|react|rn]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# logging-setup — Structured Logging

Goal: **debuggable in prod, cheap at scale, no PII**.

## Principles

1. Always structured JSON — never free-form strings in prod
2. One line = one event — no multi-line/pretty-print
3. Level + message + context on every event
4. Correlation ID (trace_id, request_id, user_id, tenant_id) on every line
5. No PII — scrubber in the logger
6. Sampling on hot paths
7. Logs ≠ errors ≠ metrics ≠ traces — each has its own destination

## Stack Decision

| Destination | When |
|---------|--------|
| **GCP Cloud Logging** | **Educabot default** (GCP runtime), $0.50/GiB ingest |
| Grafana Loki | Self-host, cheap high volume |
| Datadog Logs | If you already pay for DD APM |
| ELK/OpenSearch | Compliance/SIEM full-text |

Default: Cloud Logging (runtime) + Loki (high volume/cheap retention).

## Setup per Stack

**Go (slog stdlib 1.21+):** `slog.NewJSONHandler` with a configurable level, ReplaceAttr for PII scrubbing, base fields (service, env, version). Gin middleware injects request-scoped attrs (request_id, trace_id, route) into the context.

**Node/TS (pino):** level via env, base fields, `redact.paths` for PII (password, token, authorization, cookie, dni, cuit), `pinoHttp` middleware with custom props (trace_id) and compact serializers. Pino > winston: 5x faster, native JSON.

**Cloud Logging fields:** `severity` (DEBUG-CRITICAL), `logging.googleapis.com/trace` (auto-link to Cloud Trace), `httpRequest` (method/status/latency as columns). Cloud Run/GKE: stdout is logged automatically.

**React/frontend:** errors → Sentry, analytics → Mixpanel/Amplitude. If you need centralized logs: buffer + batch + flush to `/api/logs`, only warn+ in prod. Avoid logging routine interactions.

**React Native:** errors → Sentry, analytics → Mixpanel. Field debugging: `react-native-logs` (rotated files), upload with consent. Never PII in device logs.

## Correlation / Trace IDs

OTel W3C Trace Context (`traceparent`). Every log within a request carries the same trace_id. Go: `trace.SpanFromContext(ctx).SpanContext().TraceID()`.

## Log Levels

| Level | Use |
|-------|-----|
| DEBUG | Internal flow. Off in prod except for troubleshooting |
| INFO | Normal events. Prod default |
| WARN | Recoverable ("retry 2/3"). Watch the trends |
| ERROR | An operation fails, the system keeps going. → Sentry too |
| FATAL | The service dies. Rare. Page on-call |

If nobody is going to act on the line → lower its level or remove it.

## Sampling

Cloud Logging ~$0.50/GiB. Strategy: always 100% of errors, sample successes (5-10%). With OTel tracing, lower INFO to 1-5%.

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
