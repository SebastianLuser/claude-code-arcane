---
name: logging-setup
description: "Logging estructurado para apps Educabot (Go/TS/React/RN): slog, pino, Cloud Logging, Loki, Datadog, JSON structured logs, correlation IDs (trace/span), PII scrubbing, log levels, sampling, retention, cost control. Usar para: logs, logging, slog, pino, winston, loki, datadog, cloud logging, log shipping, observability."
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

## PII Scrubbing

Campos prohibidos: password, tokens, API keys, DNI/CPF/CUIT, email (hash si correlación), dirección, teléfono, contenido mensajes usuarios, tarjetas. Go: `ReplaceAttr` en slog handler. Pino: `redact.paths`. Nunca loguear `req.body` crudo.

## Retention & Cost

| Tipo | Retention |
|------|-----------|
| Application | 30d hot, 90d cold |
| Access (LB) | 30d |
| Audit (auth, admin) | 1 año min |
| Security (SIEM) | 1+ año |
| Debug prod | 7-14d |

Reducir costo: sampling, level ≥ INFO, excluir healthchecks, Loki para alto volumen, GCS para cold storage.

## Access Logs

Fields: method, path, status, latency, user_id, tenant_id, trace_id, ip, user_agent. Excluir /health, /ready, /metrics.

## Audit Logs

Separados de app logs — append-only, retention larga. Eventos: login/logout/signup, password/MFA change, role/permisos change, acceso PII menores, tenant CRUD, GDPR exports, admin actions. Schema: `(id, actor_id, actor_type, action, target_type, target_id, tenant_id, ip, user_agent, metadata jsonb, created_at)`. Write-only, no update/delete. Backup off-cluster.

## Anti-patterns

- `console.log` en prod (sin estructura/level), printf-style interpolation, multi-line logs
- Todo a INFO (señal ahogada), sin correlation_id, PII en logs
- Logs como sustituto de métricas, retention infinita, healthcheck spam
- `JSON.stringify(bigObject)` en hot path, `logger.error(err)` sin contexto
- Logger global instanciado en cada call, shipping sync (bloquea handler)

## Checklist

- [ ] slog/pino JSON en prod, level configurable via env
- [ ] Base fields: service, env, version
- [ ] Request-scoped: trace_id, request_id, user_id, tenant_id
- [ ] PII scrubber activo
- [ ] Severity mapeada al provider
- [ ] Sampling en hot paths, healthchecks excluidos
- [ ] Audit logs separados con retention ≥1 año
- [ ] Access logs con latency
- [ ] Retention policy por tipo
- [ ] Log-based alerts configurados
- [ ] Tests validan estructura (keys, level)
- [ ] Cost review mensual
