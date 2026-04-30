---
name: async-ops
description: "Webhook handling and background job scheduling for backend services"
category: "backend"
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

Transactional outbox pattern + HMAC signature + exponential backoff retry + DLQ.

> → Read references/outbound-webhooks.md for outbox pattern, payload format, retry schedule, subscriber management y SSRF prevention

## JOB SCHEDULING & QUEUES

BullMQ + Redis default. Queues separated by criticality. Jobs idempotent with timeout.

> → Read references/job-scheduling.md for queue technology selection, job design principles, retry, scheduling, concurrency y graceful shutdown

## SHARED PATTERNS

**Idempotency:** unique event/job ID as dedup key (Redis SETNX or BullMQ jobId). Pass idempotency keys to external providers. Check entity state before side effects.

**Dead Letter Handling:** store in DLQ table / BullMQ failed set. Alert on growth. Dashboard for inspection + replay. 30-day retention. Auto-disable sustained failures.

**Observability:** metrics for `webhook_{inbound,outbound}_total`, `webhook_{outbox_pending,dlq_depth}`, `job_{enqueued,completed}_total`, `job_duration_seconds`, `queue_depth{state}`. Propagate `traceId` in payloads. Structured logs with event_id, job_id, queue.

**Alerts:** rising queue/outbox depth (throughput insufficient), DLQ growth > N/min (systemic), subscriber failure > 5% (endpoint down), failed jobs/min > threshold (page on-call).

## ANTI-PATTERNS

> → Read references/anti-patterns.md for lista completa (14 items)

## Checklist

> → Read references/checklist.md for checklist completo (8 items)
