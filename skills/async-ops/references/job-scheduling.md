# Job Scheduling & Queues

## Queue Technology

| Tool | When |
|------|------|
| **BullMQ + Redis** | **Default** — mature, Bull Board UI, scheduler, rate limiter |
| **pg-boss + PostgreSQL** | No Redis dependency, everything in Postgres |
| **k8s CronJob** | Simple scheduled scripts, no app logic needed |
| **Temporal** | Complex multi-step durable workflows |

## Queue Separation

`critical` (auth, payments — low latency), `default` (user-facing), `bulk` (imports, reports — long timeout). Separate worker pods per critical queue to prevent starvation.

## Job Design Principles

- **Idempotent**: use jobId for dedup, check state before acting
- **Timeout**: set per-job; long jobs checkpoint progress
- **Small payload**: store IDs not data (> 1MB degrades Redis)
- **No secrets in payload**: read from vault/env by reference

## Retry

5 attempts default, exponential backoff (30s base), +/-25% jitter. Retry on network/5xx/timeout. No retry on 4xx/validation -> DLQ.

## Scheduling

Cron recurring (`upsertJobScheduler`), delayed one-shot (`delay` option), event-driven (enqueue on domain event), dependent flows (`FlowProducer`).

## Concurrency

Set worker `concurrency` per queue. Per-entity lock (Redis SETNX) for one-at-a-time. Worker-level `limiter` for downstream protection.

## Graceful Shutdown

Handle SIGTERM, stop accepting jobs, wait for in-flight. Set k8s `terminationGracePeriodSeconds` (e.g., 60s).
