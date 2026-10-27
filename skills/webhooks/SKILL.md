---
name: webhooks
description: "Outbound and inbound webhooks for Educabot apps (Go/TS): HMAC signing, anti-replay, idempotency, retries, DLQ, outbox pattern, subscriber management."
category: "api"
argument-hint: "[outbound|inbound] [service-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# webhooks — Outbound & Inbound

## When to use / NOT use

| Use | Do NOT use |
|------|---------|
| Notify B2B partners of events | Critical synchronous communication → API request/response |
| Third-party integrations (Stripe, MercadoPago) | Between internal services → pub/sub |
| Trigger workflows (Zapier/n8n) | Consumer needs the current state → GET |

## Inbound (you receive webhooks)

**Flow:** Provider → POST → verify signature → enqueue → **fast 200** (<2s) → Worker processes async

### Inbound checklist
- Signature verified (HMAC-SHA256 or provider SDK) over the **raw body**
- Timestamp check (<5min) anti-replay
- Idempotency by event-id (Redis SETNX with 7d TTL)
- Enqueue + 200 — async processing
- Log with event_id + trace_id
- Secret rotation runbook

## Outbound (you emit webhooks)

**Flow:** App event → outbox (DB row) → delivery worker → HTTP POST with HMAC signature → subscriber

### Payload & Headers

Headers: `X-Educabot-Event-Id`, `X-Educabot-Event-Type`, `X-Educabot-Timestamp`, `X-Educabot-Signature`

Signature: `HMAC-SHA256(secret, timestamp + "." + body)` — include the timestamp in the signed material (anti-replay)

### Transactional Outbox

- DB transaction: INSERT entity + INSERT `webhook_outbox` → atomic COMMIT
- Worker polls pending → delivers to subscribers → marks delivered
- Table: `id, aggregate_id, event_type, payload JSONB, status, attempts, next_attempt_at`

### Retry Schedule

```
immediate → +1m → +5m → +30m → +2h → +12h → +24h → DLQ
```

Each delay with ±25% jitter. Timeout/5xx/network → retry. 410 Gone/400 → straight to DLQ.

### Dead Letter

- `webhook_dlq` table with subscriber_id, event_id, payload, last_error
- Alert to the team, dashboard for manual replay, 30-day TTL

## Subscriber Management

- Model: `id, tenantId, url, secret (encrypted), events[] (glob), enabled, failStreak`
- Event filtering: glob match (`course.*`, `student.enrolled`)
- Auto-disable: `failStreak > 100` → disable + email the owner
- Dashboard: latest events, logs, replay button, secret rotation

## Security

### Inbound
- Mandatory HMAC, timestamp anti-replay, idempotency
- Rate limit per source IP, IP allowlist if the provider publishes one
- Raw body access (verify before parsing)

### Outbound
- Random secret ≥256 bits per subscriber, encrypted at rest
- TLS verify on outbound, 10s timeout
- **SSRF prevention:** don't accept URLs to private IPs, resolve DNS and re-validate
- Minimized payload (no unnecessary PII), secret NOT in logs

## Observability

- Metrics: `webhook_inbound_total{provider,result}`, `webhook_outbound_total{subscriber,status}`, `webhook_delivery_duration`, `outbox_pending_count`, `dlq_depth`
- Alerts: outbox depth >1000, DLQ growing, sustained failure rate >5%

## Anti-patterns

- Processing sync before the 200, no HMAC signature, signing only the body (replay)
- No idempotency, infinite retries without a DLQ, no jitter on retries
- No outbox (lost events), giant payload, unversioned payload
- Secret in a committed .env, logs with unredacted PII

## Checklist

- [ ] Inbound: signature + timestamp + idempotency + async
- [ ] Outbound: outbox pattern atomic with the DB
- [ ] Retry schedule with backoff + jitter + DLQ
- [ ] HMAC-SHA256 with the timestamp in the signed material
- [ ] Secrets encrypted at rest, NOT in logs
- [ ] SSRF guard on subscriber URLs
- [ ] Subscriber auto-disable after failStreak
- [ ] Metrics + alerts (outbox depth, DLQ)
- [ ] Public docs for subscribers (schema, verification, retries)
