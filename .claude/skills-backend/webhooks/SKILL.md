---
name: webhooks
description: "Webhooks outbound e inbound para apps Educabot (Go/TS): firma HMAC, anti-replay, idempotencia, retries, DLQ, outbox pattern, subscriber management."
category: "api"
argument-hint: "[outbound|inbound] [service-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# webhooks — Outbound & Inbound

## Cuándo usar / NO usar

| Usar | NO usar |
|------|---------|
| Notificar B2B de eventos | Comunicación síncrona crítica → API request/response |
| Integraciones terceros (Stripe, MercadoPago) | Entre servicios internos → pub/sub |
| Trigger workflows (Zapier/n8n) | Consumer necesita estado actual → GET |

## Inbound (recibís webhooks)

**Flow:** Provider → POST → verify signature → enqueue → **200 rápido** (<2s) → Worker procesa async

### Checklist inbound
- Firma verificada (HMAC-SHA256 o provider SDK) sobre **raw body**
- Timestamp check (<5min) anti-replay
- Idempotencia por event-id (Redis SETNX con TTL 7d)
- Enqueue + 200 — procesamiento async
- Log con event_id + trace_id
- Secret rotation runbook

## Outbound (emitís webhooks)

**Flow:** App event → outbox (DB row) → delivery worker → HTTP POST con firma HMAC → subscriber

### Payload & Headers

Headers: `X-Educabot-Event-Id`, `X-Educabot-Event-Type`, `X-Educabot-Timestamp`, `X-Educabot-Signature`

Firma: `HMAC-SHA256(secret, timestamp + "." + body)` — incluir timestamp en material firmado (anti-replay)

### Transactional Outbox

- DB transaction: INSERT entity + INSERT `webhook_outbox` → COMMIT atómico
- Worker poll pending → deliver a subscribers → mark delivered
- Tabla: `id, aggregate_id, event_type, payload JSONB, status, attempts, next_attempt_at`

### Retry Schedule

```
immediate → +1m → +5m → +30m → +2h → +12h → +24h → DLQ
```

Cada delay con jitter ±25%. Timeout/5xx/network → retry. 410 Gone/400 → DLQ directo.

### Dead Letter

- Tabla `webhook_dlq` con subscriber_id, event_id, payload, last_error
- Alerta al team, dashboard para replay manual, TTL 30 días

## Subscriber Management

- Modelo: `id, tenantId, url, secret (encrypted), events[] (glob), enabled, failStreak`
- Event filtering: glob match (`course.*`, `student.enrolled`)
- Auto-disable: `failStreak > 100` → disable + email al owner
- Dashboard: últimos eventos, logs, botón replay, rotación secret

## Security

### Inbound
- HMAC obligatoria, timestamp anti-replay, idempotencia
- Rate limit por source IP, allowlist IPs si provider lo publica
- Raw body access (verificar antes de parsear)

### Outbound
- Secret random ≥256 bits por subscriber, encriptado at-rest
- TLS verify en outbound, timeout 10s
- **SSRF prevention:** no aceptar URLs a IPs privadas, resolver DNS y re-validar
- Payload minimizado (no PII innecesaria), secret NO en logs

## Observabilidad

- Métricas: `webhook_inbound_total{provider,result}`, `webhook_outbound_total{subscriber,status}`, `webhook_delivery_duration`, `outbox_pending_count`, `dlq_depth`
- Alertas: outbox depth >1000, DLQ incrementando, failure rate >5% sostenido

## Anti-patterns

- Procesar sync antes de 200, sin firma HMAC, firmar solo body (replay)
- Sin idempotencia, retries infinitos sin DLQ, sin jitter en retries
- Sin outbox (eventos perdidos), payload gigante, sin versionado payload
- Secret en .env committeado, logs con PII sin redacción

## Checklist

- [ ] Inbound: firma + timestamp + idempotencia + async
- [ ] Outbound: outbox pattern atómico con DB
- [ ] Retry schedule con backoff + jitter + DLQ
- [ ] HMAC-SHA256 con timestamp en material firmado
- [ ] Secrets encriptados at-rest, NO en logs
- [ ] SSRF guard en URLs subscribers
- [ ] Subscriber auto-disable tras failStreak
- [ ] Métricas + alertas (outbox depth, DLQ)
- [ ] Docs públicos para subscribers (schema, verificación, retries)
