# Outbound Webhooks (Sending)

**Architecture:** event -> transactional outbox (DB row, same transaction as business op) -> delivery worker -> HTTP POST with HMAC -> subscriber. Failure: exponential backoff -> DLQ.

**Outbox pattern:** write event to outbox table in same DB transaction as business operation. Guarantees no events lost. Worker polls pending rows.

**Payload:** include `id`, `type`, `version`, `createdAt`, `data`. Minimize PII. Version schema for backward compatibility.

**Signature headers:** Event-Id, Event-Type, Timestamp, Signature (`sha256=...`). Sign `timestamp.body` (not body alone).

## Retry

Immediate, +1m, +5m, +30m, +2h, +12h, +24h -> DLQ. All +/-25% jitter. Retry on: timeout/5xx/network. DLQ immediately on: 410, 400, sustained 401/403.

## Subscriber Management

Per-subscriber secret (>= 256 bits, encrypted at-rest), event filtering by glob (`course.*`), auto-disable after 100+ consecutive failures. Dashboard: deliveries, payload inspection, replay, secret rotation.

**SSRF prevention:** HTTPS only, reject private IPs (127.x, 10.x, 192.168.x, 169.254.x, ::1), re-validate after DNS resolution.
