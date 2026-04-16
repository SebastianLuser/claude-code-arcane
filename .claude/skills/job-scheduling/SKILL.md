---
name: job-scheduling
description: "Sistema de background jobs y scheduling para apps Educabot (Go/TS): BullMQ, asynq, cron, priority queues, retries, rate limiting de workers, concurrency control, dead letter, graceful shutdown, observabilidad. Usar para: jobs, queue, workers, background tasks, cron, scheduled tasks, bullmq, asynq, sidekiq."
---

# job-scheduling — Background Jobs & Scheduling

Guía para ejecutar trabajo asíncrono y scheduled en apps Educabot. Stack: **BullMQ** (TS/Node) y **asynq** (Go) — ambos sobre Redis. Objetivo: reliable, observable, graceful.

## Cuándo usar

- Work que no debe bloquear el request HTTP (email, push, image processing)
- Operaciones caras (exports, reports, scraping)
- Fan-out de eventos (outbox → subscribers)
- Scheduled (cron: digest diario, cleanup, billing)
- Retry con backoff (llamadas a APIs externas flakes)

## Cuándo NO usar

- Operaciones síncronas rápidas (< 100ms) → hacer inline
- Single-instance cron con lock débil → usar k8s CronJob
- Pipelines de datos grandes → Dataflow/Airflow (tema aparte)
- Queue ligerísimo in-process (Go `chan` intra-pod) → no justifica Redis

---

## 1. Stack — decisión

| Tool | Stack | Pros | Cons | Cuándo |
|------|-------|------|------|--------|
| **BullMQ** | TS/Node | Maduro, UI (Bull Board), scheduler, rate limit | Solo Node | **Default TS** |
| **asynq** | Go | API clean, web UI, retry policy flexible | Menos ecosistema que Bull | **Default Go** |
| **River** | Go + Postgres | Sin Redis, transactional enqueue | Más joven | Go + queremos todo en PG |
| **Temporal** | Multi | Workflows long-running, durable | Setup pesado | Workflows complejos (billing, multi-step) |
| **k8s CronJob** | Any | Sin deps, schedule nativo | Sin retries granulares, cold start | Scheduled tasks simples |
| **GCP Cloud Tasks / SQS** | Managed | Sin mantener Redis | Costo, menos control | Escala + menos ops |

**Default Educabot:** BullMQ (TS) y asynq (Go) sobre Redis compartido (DB separada de cache).

---

## 2. Arquitectura

```
Producer (API / cron / event) → Redis queue → Worker pod(s)
                                                    ↓
                                         Success → log + metric
                                         Fail → retry con backoff
                                         Agotado → DLQ + alert
```

### Separar queues por criticidad
```
critical  (auth, payments)     — low latency, priority high
default   (user-facing)        — normal
bulk      (imports, reports)   — low priority, long timeout
scheduled (cron)               — por schedule
```

Worker pods distintos por queue crítica → no starvation.

---

## 3. BullMQ — TS

### Setup
```ts
import { Queue, Worker, QueueEvents } from 'bullmq';

const connection = { host: process.env.REDIS_HOST!, port: 6379, maxRetriesPerRequest: null };

export const emailQueue = new Queue('email', { connection, defaultJobOptions: {
  attempts: 5,
  backoff: { type: 'exponential', delay: 30_000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: false,
}});
```

### Producer
```ts
await emailQueue.add('welcome', { userId, to, locale }, {
  jobId: `welcome:${userId}`,     // idempotencia
  delay: 5_000,
  priority: 10,
});
```

### Worker
```ts
const worker = new Worker('email', async job => {
  log.info({ id: job.id, name: job.name }, 'processing');
  await sendEmail(job.data);
}, {
  connection,
  concurrency: 20,
  limiter: { max: 100, duration: 1000 },  // 100/sec throttle
});

worker.on('failed', (job, err) => log.error({ id: job?.id, err }, 'job failed'));
worker.on('completed', job => metrics.inc('jobs_completed', { queue: 'email' }));
```

### Scheduled (cron)
```ts
await emailQueue.upsertJobScheduler('daily-digest', { pattern: '0 8 * * *', tz: 'America/Argentina/Buenos_Aires' }, {
  name: 'daily-digest',
  data: {},
  opts: { removeOnComplete: true },
});
```

### Flows (jobs dependientes)
```ts
import { FlowProducer } from 'bullmq';
const flow = new FlowProducer({ connection });

await flow.add({
  name: 'export-and-email',
  queueName: 'email',
  data: { userId },
  children: [{ name: 'generate-export', queueName: 'exports', data: { userId } }],
});
```

---

## 4. asynq — Go

### Setup
```go
import "github.com/hibiken/asynq"

redisOpt := asynq.RedisClientOpt{Addr: os.Getenv("REDIS_HOST") + ":6379"}
client := asynq.NewClient(redisOpt)
```

### Producer
```go
type WelcomeEmailPayload struct { UserID string; To string; Locale string }

payload, _ := json.Marshal(WelcomeEmailPayload{...})
task := asynq.NewTask("email:welcome", payload,
    asynq.MaxRetry(5),
    asynq.Timeout(30*time.Second),
    asynq.Queue("default"),
    asynq.TaskID("welcome:"+userID),
)
info, err := client.Enqueue(task)
```

### Worker
```go
srv := asynq.NewServer(redisOpt, asynq.Config{
    Concurrency: 20,
    Queues: map[string]int{
        "critical": 6,
        "default":  3,
        "bulk":     1,
    },
    RetryDelayFunc: func(n int, e error, t *asynq.Task) time.Duration {
        return time.Duration(1<<uint(n)) * time.Minute  // exp backoff
    },
})

mux := asynq.NewServeMux()
mux.HandleFunc("email:welcome", handleWelcomeEmail)

if err := srv.Run(mux); err != nil { log.Fatal(err) }
```

### Scheduled
```go
scheduler := asynq.NewScheduler(redisOpt, nil)
scheduler.Register("0 8 * * *", asynq.NewTask("digest:daily", nil))
scheduler.Run()
```

---

## 5. Retry strategy

### Defaults
- **attempts:** 5 para jobs generales, 3 para idempotentes caros, 10 para push a provider flakey
- **backoff:** exponential con base 30s (30s → 1m → 2m → 4m → 8m)
- **jitter:** ±25% para evitar thundering herd

### Qué reintentar
- Network errors, 5xx, timeouts → retry
- 4xx del downstream (datos malos) → **NO retry**, a DLQ
- Validation errors propios → no retry

```ts
try {
  await callExternalAPI();
} catch (err) {
  if (err.status >= 400 && err.status < 500) {
    throw new UnrecoverableError(`client error ${err.status}`);  // BullMQ no retry
  }
  throw err;  // retry
}
```

---

## 6. Idempotencia

Job puede ejecutarse > 1 vez (retry, duplicate enqueue). Diseñar pensando en ello.

### jobId como dedup
```ts
await queue.add('process', data, { jobId: `process:${entityId}` });
// BullMQ rechaza si jobId existe en waiting/active
```

### Lógica idempotente
```ts
async function processPayment(job) {
  const { orderId } = job.data;
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (order.status === 'paid') return;  // ya hecho
  await chargeStripe(order);
  await db.order.update({ where: { id: orderId }, data: { status: 'paid' } });
}
```

### Effects externos — Idempotency-Key
Pasar key a provider (Stripe, SendGrid) → ellos no cobran/envían duplicado.

---

## 7. Rate limiting de workers

Protege a providers downstream (Stripe, Twilio, OpenAI).

### BullMQ
```ts
new Worker('openai-calls', handler, {
  connection,
  concurrency: 5,
  limiter: { max: 20, duration: 60_000 },  // 20/min global para esta queue
});
```

### asynq
```go
// middleware a mano con token bucket
```

### Alternativa: rate limit dentro del handler
Usar skill `/rate-limiting` Lua script contra Redis antes de la llamada. Si no hay token → delay y reencolar.

---

## 8. Concurrency control

### Por job type
```ts
new Worker('heavy', handler, { concurrency: 2 });  // solo 2 en paralelo
```

### Lock por entidad (no procesar 2 jobs del mismo user simultáneo)
```ts
const lock = await redis.set(`lock:job:${userId}`, '1', 'EX', 60, 'NX');
if (lock !== 'OK') {
  await job.moveToDelayed(Date.now() + 5000);
  return;
}
try { await handle(job); } finally { await redis.del(`lock:job:${userId}`); }
```

Para entidad "un job por X a la vez". Usar redlock si necesitás algo más robusto.

---

## 9. Graceful shutdown

Pod killed → worker debe terminar job in-flight antes de morir.

```ts
// preStop en k8s: ~30s para terminar
process.on('SIGTERM', async () => {
  await worker.close();  // deja de tomar nuevos, espera in-flight
  await queue.close();
  process.exit(0);
});
```

```go
sigCh := make(chan os.Signal, 1)
signal.Notify(sigCh, syscall.SIGTERM, syscall.SIGINT)
go func() { <-sigCh; srv.Shutdown() }()
```

```yaml
# k8s
terminationGracePeriodSeconds: 60
lifecycle:
  preStop:
    exec:
      command: ['/bin/sh', '-c', 'sleep 15']  # drain del ingress primero
```

Jobs de corrida larga: diseñar para resumir — persistir progreso en DB o usar Temporal/Step Functions.

---

## 10. Scheduled vs k8s CronJob

| Uso | Herramienta |
|-----|-------------|
| Cron app-aware, necesita worker pool | BullMQ scheduler / asynq scheduler |
| Cron script independiente, single-run | k8s CronJob |
| Workflow multi-step durable | Temporal |

### k8s CronJob ejemplo
```yaml
apiVersion: batch/v1
kind: CronJob
metadata: { name: cleanup-sessions }
spec:
  schedule: "0 4 * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: cleanup
              image: alizia-api:latest
              command: ['node', 'dist/scripts/cleanup-sessions.js']
          restartPolicy: OnFailure
```

**Concurrency: Forbid** → no arrancar si el anterior aún corre.
**Activedeadline** para matar runs stuck.

---

## 11. Dead Letter & manual intervention

Tras agotar retries:
- BullMQ: `removeOnFail: false` → queda en `failed` set
- asynq: archiva en `archived` por N días

### Dashboard
- **Bull Board** (BullMQ) — monta en `/admin/queues` con auth
- **asynqmon** (asynq) — binario standalone o deploy

Muestra: waiting / active / completed / failed / delayed. Reintento manual + payload inspection.

### Alert
Failed count / min > threshold → page on-call.

---

## 12. Observabilidad

### Métricas
```
job_enqueued_total{queue, name}
job_completed_total{queue, name, status}
job_duration_seconds{queue, name}
job_retry_count{queue, name}
queue_depth{queue, state}   # waiting/active/delayed
worker_concurrency_active{queue}
```

### Exports
- BullMQ: `bullmq-prometheus-exporter` (comunidad) o instrumentar a mano con `QueueEvents`
- asynq: expone `/metrics` con flag, plug prometheus

### Logs
Correlation ID: propagar `traceId` en el payload del job → worker lo ata al trace.

### Dashboard
- Queue depth por queue (alerta si sube sostenido)
- Duration p95
- Retry rate por job type
- Failed count

---

## 13. Testing

### Unit
```ts
const worker = new Worker('test', handler, { connection: mockConn });
await worker.run();  // procesa uno y termina
expect(mockService).toHaveBeenCalledWith(...);
```

### Integration
Redis container en CI, enqueue real, assert que el handler corrió + estado DB.

### Fake timers para scheduled
```ts
vi.useFakeTimers();
vi.setSystemTime(new Date('2026-04-14T08:00:00'));
// trigger scheduler tick
```

---

## 14. Seguridad

- [ ] Payloads no contienen PII innecesaria (ver en Redis = disponible para cualquier ops)
- [ ] Secrets no en payload — job referencia por ID, worker lee de vault
- [ ] Redis con auth + TLS, network policy
- [ ] Admin UI (Bull Board) con auth + audit log
- [ ] Rate limit de enqueue por user (evitar bomba)
- [ ] Validación del payload en el worker (schema) — no confiar que el producer es perfecto

---

## 15. Anti-patterns

- ❌ Handler sin idempotencia → retries → doble-envío
- ❌ Sin graceful shutdown → jobs perdidos a mitad
- ❌ Queue única para todo → bulk satura critical
- ❌ Retry infinito → flood a downstream cuando vuelve
- ❌ Payload gigante en Redis (> MB) → usar referencia (key a DB/S3)
- ❌ Secret en el payload
- ❌ Sin dead letter → fallos silenciosos
- ❌ Worker con concurrency = 100 sin rate limit → DoS al downstream
- ❌ Scheduled en todos los pods sin lock → N ejecuciones en paralelo
- ❌ Logs sin correlation ID → imposible debuggear cadena
- ❌ `removeOnComplete: true` en jobs importantes → perdés trazabilidad

---

## 16. Checklist review

```markdown
- [ ] Queue correcta según criticidad (critical/default/bulk)
- [ ] Attempts + backoff + jitter configurados
- [ ] Idempotencia (jobId + lógica)
- [ ] Timeout por job razonable
- [ ] Graceful shutdown implementado
- [ ] Rate limit si llama APIs externas
- [ ] DLQ / failed queue con alerta
- [ ] Métricas expuestas y dashboard
- [ ] Correlation ID en logs
- [ ] Payload sin PII/secrets
- [ ] Tests: happy path + retry + DLQ
```

---

## 17. Output final

```
✅ Job scheduling — Alizia (TS stack)
   🚦 Queues: critical / default / bulk (workers separados)
   🔁 Retries: 5 attempts, exp backoff 30s base + jitter
   ⏰ Scheduled: digest-daily (8am AR), cleanup-sessions (4am)
   🧪 Rate limit worker openai: 20/min
   🛑 Graceful shutdown: 60s drain
   📊 Bull Board /admin/queues + Prometheus exporter

Próximos pasos:
  1. DLQ alert en PagerDuty
  2. Bull Board detrás de auth admin
  3. Load test de queue critical (skill /performance-test)
```

## Delegación

**Coordinar con:** `backend-architect`, `sre-lead`
**Reporta a:** `backend-architect`

**Skills relacionadas:**
- `/rate-limiting` — proteger downstream desde worker
- `/observability-setup` — métricas + correlation IDs
- `/webhooks` — outbox + worker de delivery
- `/email-service` / `/notification-service` — consumidores de queue
- `/incident` — fallos en DLQ como señal
