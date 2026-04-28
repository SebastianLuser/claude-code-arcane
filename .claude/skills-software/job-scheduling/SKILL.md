---
name: job-scheduling
description: "Background jobs y scheduling para apps Educabot (Go/TS): BullMQ, asynq, cron, priority queues, retries, DLQ, graceful shutdown, observabilidad."
argument-hint: "[stack: go|ts] [provider: bullmq|asynq|cron]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# job-scheduling — Background Jobs & Scheduling

**Default Educabot:** BullMQ (TS) y asynq (Go) sobre Redis. DB separada de cache.

## Cuándo usar / NO usar

| Usar | NO usar |
|------|---------|
| Work que no debe bloquear HTTP (email, push, img) | Operaciones síncronas <100ms |
| Operaciones caras (exports, reports) | Single-instance cron → k8s CronJob |
| Fan-out de eventos, retry con backoff | Pipelines datos grandes → Dataflow/Airflow |
| Scheduled (digest, cleanup, billing) | Queue ligerísimo in-process → Go `chan` |

## Stack Decision

| Tool | Stack | Cuándo |
|------|-------|--------|
| **BullMQ** | TS/Node | **Default TS** — maduro, UI, scheduler |
| **asynq** | Go | **Default Go** — API clean, retry flexible |
| **River** | Go + Postgres | Todo en PG, sin Redis |
| **Temporal** | Multi | Workflows long-running durables |
| **k8s CronJob** | Any | Scheduled tasks simples sin deps |

## Arquitectura

```
Producer → Redis queue → Worker pod(s) → Success/Fail → retry/DLQ
```

Separar queues por criticidad: `critical` (auth, payments) / `default` (user-facing) / `bulk` (imports) / `scheduled` (cron). Worker pods distintos por queue crítica.

## Retry Strategy

- **Attempts:** 5 general, 3 idempotentes caros, 10 para providers flakey
- **Backoff:** exponencial base 30s + jitter ±25%
- Network errors/5xx/timeouts → retry. 4xx → NO retry, a DLQ
- BullMQ: `UnrecoverableError` para no reintentar

## Idempotencia

- `jobId` como dedup key (BullMQ rechaza si existe en waiting/active)
- Lógica idempotente: check estado antes de ejecutar (`if order.status === 'paid' return`)
- Effects externos: pasar Idempotency-Key al provider (Stripe, SendGrid)

## Rate Limiting Workers

- BullMQ: `limiter: { max: 100, duration: 1000 }` en Worker
- Protege downstream (Stripe, OpenAI). Alt: token bucket Redis antes de la llamada

## Concurrency Control

- Por job type: `concurrency: N` en Worker
- Por entidad: Redis lock `SET NX` con TTL → delay y reencolar si locked

## Graceful Shutdown

- `SIGTERM` → `worker.close()` (deja de tomar, espera in-flight) → `process.exit(0)`
- k8s: `terminationGracePeriodSeconds: 60`
- Jobs largos: diseñar para resumir (persistir progreso en DB)

## Scheduled vs k8s CronJob

| Uso | Herramienta |
|-----|-------------|
| Cron app-aware, necesita worker pool | BullMQ/asynq scheduler |
| Cron script independiente | k8s CronJob (`concurrencyPolicy: Forbid`) |
| Workflow multi-step durable | Temporal |

## Dead Letter & Dashboard

- Tras agotar retries: BullMQ → `failed` set, asynq → `archived`
- **Bull Board** / **asynqmon**: waiting/active/completed/failed/delayed, retry manual
- Alert: failed count/min > threshold → page on-call

## Observabilidad

- Métricas: `job_enqueued/completed/duration/retry_count`, `queue_depth{state}`, `worker_concurrency_active`
- Correlation ID: propagar `traceId` en payload → worker lo ata al trace
- Dashboard: queue depth, duration p95, retry rate, failed count

## Anti-patterns

- Handler sin idempotencia, sin graceful shutdown, queue única para todo
- Retry infinito, payload >MB en Redis (usar referencia), secret en payload
- Sin DLQ, concurrency=100 sin rate limit, scheduled en todos los pods sin lock
- Logs sin correlation ID, `removeOnComplete: true` en jobs importantes

## Checklist

- [ ] Queue por criticidad (critical/default/bulk)
- [ ] Attempts + backoff + jitter configurados
- [ ] Idempotencia (jobId + lógica)
- [ ] Timeout por job razonable
- [ ] Graceful shutdown implementado
- [ ] Rate limit si llama APIs externas
- [ ] DLQ con alerta
- [ ] Métricas + dashboard
- [ ] Correlation ID en logs
- [ ] Payload sin PII/secrets
