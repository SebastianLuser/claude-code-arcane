---
name: async-ops
description: "Webhook handling and background job scheduling for backend services"
argument-hint: "[webhooks|jobs|queues|full]"
user-invocable: true
allowed-tools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep"]
---
# async-ops — Webhooks & Background Job Scheduling

Stack: Fastify + Prisma + PostgreSQL + Redis + BullMQ + Zod + TypeScript.

## INBOUND WEBHOOKS (Receiving)

**Flow:** receive -> verify signature -> deduplicate -> enqueue -> respond 200 (< 2s). All processing async via queue.

**Signature:** use provider SDK when available. Custom: HMAC-SHA256 over `timestamp.body`. Require raw body access (verify before parsing). Always include timestamp in signed material.

**Anti-replay:** reject if timestamp differs from server time by > 5 minutes.

**Idempotency:** Redis SETNX with event ID as key, 7-day TTL. If exists, return 200 `already_processed`.

### Inbound Checklist
- [ ] Signature verified (HMAC-SHA256 or provider SDK)
- [ ] Timestamp anti-replay (< 5 min drift)
- [ ] Idempotency by event ID (Redis SETNX + TTL)
- [ ] Enqueue + fast 200 — processing async
- [ ] Structured log with event_id and trace_id
- [ ] Secret rotation plan documented

## OUTBOUND WEBHOOKS (Sending)

**Architecture:** event -> transactional outbox (DB row, same transaction as business op) -> delivery worker -> HTTP POST with HMAC -> subscriber. Failure: exponential backoff -> DLQ.

**Outbox pattern:** write event to outbox table in same DB transaction as business operation. Guarantees no events lost. Worker polls pending rows.

**Payload:** include `id`, `type`, `version`, `createdAt`, `data`. Minimize PII. Version schema for backward compatibility.

**Signature headers:** Event-Id, Event-Type, Timestamp, Signature (`sha256=...`). Sign `timestamp.body` (not body alone).

### Retry: immediate, +1m, +5m, +30m, +2h, +12h, +24h -> DLQ. All +/-25% jitter. Retry on: timeout/5xx/network. DLQ immediately on: 410, 400, sustained 401/403.

### Subscriber Management

Per-subscriber secret (>= 256 bits, encrypted at-rest), event filtering by glob (`course.*`), auto-disable after 100+ consecutive failures. Dashboard: deliveries, payload inspection, replay, secret rotation.

**SSRF prevention:** HTTPS only, reject private IPs (127.x, 10.x, 192.168.x, 169.254.x, ::1), re-validate after DNS resolution.

## JOB SCHEDULING & QUEUES

### Queue Technology

| Tool | When |
|------|------|
| **BullMQ + Redis** | **Default** — mature, Bull Board UI, scheduler, rate limiter |
| **pg-boss + PostgreSQL** | No Redis dependency, everything in Postgres |
| **k8s CronJob** | Simple scheduled scripts, no app logic needed |
| **Temporal** | Complex multi-step durable workflows |

### Queue Separation: `critical` (auth, payments — low latency), `default` (user-facing), `bulk` (imports, reports — long timeout). Separate worker pods per critical queue to prevent starvation.

### Job Design Principles

- **Idempotent**: use jobId for dedup, check state before acting
- **Timeout**: set per-job; long jobs checkpoint progress
- **Small payload**: store IDs not data (> 1MB degrades Redis)
- **No secrets in payload**: read from vault/env by reference

### Retry: 5 attempts default, exponential backoff (30s base), +/-25% jitter. Retry on network/5xx/timeout. No retry on 4xx/validation -> DLQ.

### Scheduling: cron recurring (`upsertJobScheduler`), delayed one-shot (`delay` option), event-driven (enqueue on domain event), dependent flows (`FlowProducer`).

### Concurrency: set worker `concurrency` per queue. Per-entity lock (Redis SETNX) for one-at-a-time. Worker-level `limiter` for downstream protection.

### Graceful Shutdown: handle SIGTERM, stop accepting jobs, wait for in-flight. Set k8s `terminationGracePeriodSeconds` (e.g., 60s).

## SHARED PATTERNS

**Idempotency:** unique event/job ID as dedup key (Redis SETNX or BullMQ jobId). Pass idempotency keys to external providers. Check entity state before side effects.

**Dead Letter Handling:** store in DLQ table / BullMQ failed set. Alert on growth. Dashboard for inspection + replay. 30-day retention. Auto-disable sustained failures.

**Observability:** metrics for `webhook_{inbound,outbound}_total`, `webhook_{outbox_pending,dlq_depth}`, `job_{enqueued,completed}_total`, `job_duration_seconds`, `queue_depth{state}`. Propagate `traceId` in payloads. Structured logs with event_id, job_id, queue.

**Alerts:** rising queue/outbox depth (throughput insufficient), DLQ growth > N/min (systemic), subscriber failure > 5% (endpoint down), failed jobs/min > threshold (page on-call).

## ANTI-PATTERNS

No idempotency (double-charge/send), sync webhook processing before 200 (timeout cascades), no signature verification (forgery), signing body without timestamp (replay), unbounded retries without DLQ (flood on recovery), retries without jitter (thundering herd), no outbox (events lost between commit and enqueue), single queue for all types (starvation), cron on all pods without lock (N executions), no graceful shutdown (lost jobs), secrets/PII in payloads, missing correlation IDs, `removeOnComplete: true` on important jobs, giant payloads in Redis.

## REVIEW CHECKLIST

- [ ] Inbound: signature verified, anti-replay, idempotent, async processing
- [ ] Outbound: outbox pattern, HMAC signature, retry schedule, DLQ
- [ ] Subscriber URLs validated for SSRF
- [ ] Queues separated by criticality; jobs idempotent with timeout
- [ ] Retry + backoff + jitter; rate limiter on workers calling external APIs
- [ ] Graceful shutdown; DLQ with alerts and replay
- [ ] Metrics exported; correlation ID propagated through all chains
- [ ] No secrets/PII in payloads; Bull Board behind auth
