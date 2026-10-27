---
name: job-scheduling
description: "Background jobs and scheduling for Educabot apps (Go/TS): BullMQ, asynq, cron, priority queues, retries, DLQ, graceful shutdown, observability."
category: "backend"
argument-hint: "[stack: go|ts] [provider: bullmq|asynq|cron]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# job-scheduling — Background Jobs & Scheduling

**Educabot default:** BullMQ (TS) and asynq (Go) on Redis. A DB separate from the cache.

## When to use / NOT use

| Use | Do NOT use |
|------|---------|
| Work that must not block HTTP (email, push, img) | Synchronous operations <100ms |
| Expensive operations (exports, reports) | Single-instance cron → k8s CronJob |
| Event fan-out, retry with backoff | Large data pipelines → Dataflow/Airflow |
| Scheduled (digest, cleanup, billing) | Very light in-process queue → Go `chan` |

## Stack Decision

| Tool | Stack | When |
|------|-------|--------|
| **BullMQ** | TS/Node | **TS default** — mature, UI, scheduler |
| **asynq** | Go | **Go default** — clean API, flexible retry |
| **River** | Go + Postgres | Everything in PG, no Redis |
| **Temporal** | Multi | Durable long-running workflows |
| **k8s CronJob** | Any | Simple scheduled tasks with no deps |

## Architecture

```
Producer → Redis queue → Worker pod(s) → Success/Fail → retry/DLQ
```

Split queues by criticality: `critical` (auth, payments) / `default` (user-facing) / `bulk` (imports) / `scheduled` (cron). Separate worker pods per critical queue.

## Retry Strategy

- **Attempts:** 5 in general, 3 for expensive idempotent ones, 10 for flaky providers
- **Backoff:** exponential, 30s base + ±25% jitter
- Network errors/5xx/timeouts → retry. 4xx → NO retry, to the DLQ
- BullMQ: `UnrecoverableError` to skip retries

## Idempotency

- `jobId` as the dedup key (BullMQ rejects it if it exists in waiting/active)
- Idempotent logic: check the state before executing (`if order.status === 'paid' return`)
- External effects: pass an Idempotency-Key to the provider (Stripe, SendGrid)

## Rate Limiting Workers

- BullMQ: `limiter: { max: 100, duration: 1000 }` on the Worker
- Protects downstream (Stripe, OpenAI). Alt: a Redis token bucket before the call

## Concurrency Control

- Per job type: `concurrency: N` on the Worker
- Per entity: Redis lock `SET NX` with a TTL → delay and requeue if locked

## Graceful Shutdown

- `SIGTERM` → `worker.close()` (stops taking jobs, waits for in-flight ones) → `process.exit(0)`
- k8s: `terminationGracePeriodSeconds: 60`
- Long jobs: design them to resume (persist progress in the DB)

## Scheduled vs k8s CronJob

| Use | Tool |
|-----|-------------|
| App-aware cron that needs the worker pool | BullMQ/asynq scheduler |
| Standalone cron script | k8s CronJob (`concurrencyPolicy: Forbid`) |
| Durable multi-step workflow | Temporal |

## Dead Letter & Dashboard

- After exhausting retries: BullMQ → `failed` set, asynq → `archived`
- **Bull Board** / **asynqmon**: waiting/active/completed/failed/delayed, manual retry
- Alert: failed count/min > threshold → page on-call

## Observability

- Metrics: `job_enqueued/completed/duration/retry_count`, `queue_depth{state}`, `worker_concurrency_active`
- Correlation ID: propagate `traceId` in the payload → the worker ties it to the trace
- Dashboard: queue depth, duration p95, retry rate, failed count

## Anti-patterns

- Handler without idempotency, without graceful shutdown, a single queue for everything
- Infinite retry, payload >MB in Redis (use a reference), secret in the payload
- No DLQ, concurrency=100 without a rate limit, scheduled jobs on every pod without a lock
- Logs without a correlation ID, `removeOnComplete: true` on important jobs

## Checklist

- [ ] Queue per criticality (critical/default/bulk)
- [ ] Attempts + backoff + jitter configured
- [ ] Idempotency (jobId + logic)
- [ ] Reasonable per-job timeout
- [ ] Graceful shutdown implemented
- [ ] Rate limit if it calls external APIs
- [ ] DLQ with an alert
- [ ] Metrics + dashboard
- [ ] Correlation ID in logs
- [ ] Payload without PII/secrets
