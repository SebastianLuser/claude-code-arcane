---
name: webhooks
description: "Diseño e implementación de webhooks (outbound e inbound) para apps Educabot (Go/TS): firma HMAC, timestamps anti-replay, idempotencia, retries con backoff, DLQ, queue-based delivery, dashboard para subscribers. Usar para: webhooks, http callbacks, eventos, integraciones, stripe webhooks, event delivery."
---

# webhooks — Outbound & Inbound Webhooks

Guía para webhooks en apps Educabot. Cubre el rol de **emisor** (notificamos a terceros/clientes) e **inbound** (recibimos de Stripe, proveedores, etc). Énfasis en reliability, seguridad y operabilidad.

## Cuándo usar

- Notificar a clientes B2B de eventos (course.created, student.enrolled)
- Integraciones con terceros (Stripe, SendGrid, MercadoPago)
- Desacoplar sistemas internos (event-driven)
- Trigger de workflows externos (Zapier/n8n/Make)

## Cuándo NO usar

- Para comunicación **síncrona** crítica → usar API request/response
- Entre servicios internos bajo tu control → pub/sub (Kafka/Pub/Sub/NATS)
- Cuando el consumer necesita **el estado actual**, no el evento (usar GET)

---

## 1. Inbound (recibís webhooks)

### Flow
```
Provider → POST /webhooks/<provider> → verify signature → enqueue → 200 OK (fast)
                                                              ↓
                                                    Worker procesa async
```

**Crítico:** responder **200 rápido** (< 2s). Todo el procesamiento pesado va a queue.

### Endpoint Fastify — Stripe
```ts
import Stripe from 'stripe';
import { Queue } from 'bullmq';

const stripe = new Stripe(process.env.STRIPE_SECRET!, { apiVersion: '2024-06-20' });
const queue = new Queue('stripe-events', { connection: redisConn });

app.post('/webhooks/stripe', {
  config: { rawBody: true },  // para verificar firma
}, async (req, reply) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody!,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    req.log.warn({ err }, 'invalid stripe signature');
    return reply.code(400).send({ error: 'invalid signature' });
  }

  // idempotencia
  const dedup = await redis.set(`stripe:event:${event.id}`, '1', 'EX', 7*24*3600, 'NX');
  if (dedup !== 'OK') {
    return reply.code(200).send({ status: 'already_processed' });
  }

  await queue.add(event.type, event, { jobId: event.id, removeOnComplete: 1000 });
  return reply.code(200).send({ received: true });
});
```

### Go / Gin — genérico HMAC
```go
r.POST("/webhooks/partner-x", func(c *gin.Context) {
    body, _ := io.ReadAll(c.Request.Body)
    sig := c.GetHeader("X-PartnerX-Signature")
    ts := c.GetHeader("X-PartnerX-Timestamp")

    // anti-replay
    t, _ := strconv.ParseInt(ts, 10, 64)
    if math.Abs(float64(time.Now().Unix()-t)) > 300 {
        c.Status(http.StatusBadRequest)
        return
    }

    mac := hmac.New(sha256.New, []byte(os.Getenv("PARTNERX_SECRET")))
    mac.Write([]byte(ts + "." + string(body)))
    expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
    if !hmac.Equal([]byte(expected), []byte(sig)) {
        c.Status(http.StatusUnauthorized)
        return
    }

    eventID := c.GetHeader("X-PartnerX-Event-Id")
    if !claimEventID(eventID) {  // redis SETNX
        c.JSON(200, gin.H{"status": "duplicate"})
        return
    }

    if err := publishToQueue(body); err != nil {
        c.Status(http.StatusInternalServerError)  // provider reintentará
        return
    }
    c.JSON(200, gin.H{"received": true})
})
```

### Inbound checklist
- [ ] Firma verificada (HMAC-SHA256 o provider SDK)
- [ ] Timestamp check (< 5min) anti-replay
- [ ] Idempotencia por event-id (Redis SETNX con TTL)
- [ ] Enqueue + 200 rápido — procesamiento async
- [ ] Log estructurado con event_id y trace_id
- [ ] Retry tolerance: manejar duplicados del provider
- [ ] Secret rotation plan documentado

---

## 2. Outbound (emitís webhooks)

### Componentes
```
App emits event
     ↓
Event outbox (DB row)
     ↓
Delivery worker
     ↓
HTTP POST con firma HMAC
     ↓
Subscriber endpoint
     ↓
200? → mark delivered
4xx/5xx/timeout? → backoff + retry → DLQ si agota
```

### Payload
```json
{
  "id": "evt_01H7ABC...",
  "type": "course.created",
  "version": "1.0",
  "createdAt": "2026-04-14T12:00:00Z",
  "data": {
    "courseId": "c_xyz",
    "teacherId": "t_abc",
    "name": "Math 101"
  }
}
```

### Headers
```
X-Educabot-Event-Id: evt_01H7ABC...
X-Educabot-Event-Type: course.created
X-Educabot-Timestamp: 1712345678
X-Educabot-Signature: sha256=abc123...
Content-Type: application/json
User-Agent: Educabot-Webhooks/1.0
```

### Firma
```go
func signWebhook(secret string, timestamp int64, body []byte) string {
    mac := hmac.New(sha256.New, []byte(secret))
    fmt.Fprintf(mac, "%d.%s", timestamp, body)
    return "sha256=" + hex.EncodeToString(mac.Sum(nil))
}
```

**No** firmar solo el body (vulnerable a replay). Incluir timestamp en el material firmado.

---

## 3. Transactional outbox pattern

Evita perder eventos entre "DB commit" y "enqueue":

```sql
CREATE TABLE webhook_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | delivered | failed
  attempts INT NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ
);
CREATE INDEX idx_outbox_pending ON webhook_outbox (next_attempt_at) WHERE status = 'pending';
```

### En el service
```ts
await prisma.$transaction(async (tx) => {
  const course = await tx.course.create({ data: { ... } });
  await tx.webhookOutbox.create({
    data: {
      aggregateId: course.id,
      eventType: 'course.created',
      payload: { courseId: course.id, ... },
    },
  });
});
// commit atómico: si el insert del evento falla, la course no se crea
```

### Worker
```ts
// cada N segundos
const pending = await prisma.webhookOutbox.findMany({
  where: { status: 'pending', nextAttemptAt: { lte: new Date() } },
  take: 100,
});
for (const row of pending) {
  await deliverToAllSubscribers(row);
}
```

---

## 4. Retries

### Schedule sugerido
```
attempt 1:  immediate
attempt 2:  +1m
attempt 3:  +5m
attempt 4:  +30m
attempt 5:  +2h
attempt 6:  +12h
attempt 7:  +24h
→ DLQ
```

Cada delay con **jitter** ±25%.

### Qué cuenta como retry
- Timeout (> 10s)
- 5xx del subscriber
- Network error

### Qué NO cuenta (dead letter directo)
- 410 Gone (endpoint eliminado)
- 400 Bad Request (probablemente payload inválido, no va a arreglarse)
- 401/403 sostenido (secret rotado del lado del subscriber)

### Implementación con BullMQ
```ts
await queue.add('deliver', { outboxId }, {
  attempts: 7,
  backoff: { type: 'exponential', delay: 60_000 },
  removeOnFail: false,  // dejamos para DLQ
});
```

---

## 5. Dead Letter Queue (DLQ)

Tras agotar retries:
1. Mover a tabla `webhook_dlq`
2. Alerta al team de ops / al subscriber (email)
3. Dashboard para reintentar manual
4. TTL de 30 días

```sql
CREATE TABLE webhook_dlq (
  id UUID PRIMARY KEY,
  subscriber_id UUID NOT NULL,
  event_id TEXT NOT NULL,
  payload JSONB,
  last_error TEXT,
  failed_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. Subscriber management

### Modelo
```ts
model WebhookSubscriber {
  id         String   @id @default(cuid())
  tenantId   String
  url        String
  secret     String   // encrypted at-rest
  events     String[] // ['course.*', 'student.enrolled']
  enabled    Boolean  @default(true)
  createdAt  DateTime @default(now())
  failStreak Int      @default(0)  // para auto-disable
}
```

### Event filtering (glob)
```ts
function matches(event: string, patterns: string[]) {
  return patterns.some(p =>
    p === event || p.endsWith('*') && event.startsWith(p.slice(0, -1))
  );
}
```

### Auto-disable
Si `failStreak > 100` consecutivos → disable + email al owner.

### Dashboard (para subscribers)
Exponer UI con:
- Últimos eventos enviados (200/fail)
- Logs con payload + response status
- Botón "replay"
- Rotación de secret

---

## 7. Security

### Inbound
- [ ] Firma HMAC obligatoria — sin excepciones
- [ ] Timestamp anti-replay (< 5min)
- [ ] Idempotencia por event-id
- [ ] Rate limit por source IP (ver `/rate-limiting`)
- [ ] Allowlist de IPs del provider si aplica (Stripe publica rangos)
- [ ] Raw body access (no parsear antes de firmar)
- [ ] Secret rotation runbook

### Outbound
- [ ] Secret random ≥ 256 bits por subscriber
- [ ] Secret encriptado at-rest en DB
- [ ] TLS verify en outbound (no `rejectUnauthorized: false`)
- [ ] Timeout estricto (10s)
- [ ] SSRF prevention: no aceptar URLs a IPs privadas
- [ ] Payload minimizado — no PII innecesaria
- [ ] Secret NO aparece en logs

### SSRF guard (outbound)
```ts
function validateSubscriberURL(url: string) {
  const u = new URL(url);
  if (u.protocol !== 'https:') throw new Error('https only');
  const host = u.hostname;
  if (/^(127\.|10\.|192\.168\.|169\.254\.|::1)/.test(host)) {
    throw new Error('private IP not allowed');
  }
  // resolver DNS y re-validar IP (defense in depth)
}
```

---

## 8. Testing

### Para desarrollo
- **ngrok** / **Cloudflare Tunnel** para exponer localhost
- **Svix Play** / **webhook.site** — inspeccionar payloads
- **stripe-cli** — forward eventos a localhost

### En el sistema
```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
stripe trigger payment_intent.succeeded
```

### Tests
```ts
describe('webhook signing', () => {
  it('rejects tampered body', async () => {
    const sig = signWebhook(secret, ts, Buffer.from(validBody));
    const res = await fetch('/webhooks/partner-x', {
      method: 'POST',
      headers: { 'X-PartnerX-Signature': sig, 'X-PartnerX-Timestamp': String(ts) },
      body: tamperedBody,
    });
    expect(res.status).toBe(401);
  });

  it('rejects old timestamp', async () => {
    const old = Math.floor(Date.now() / 1000) - 600;
    // ... expect 400
  });

  it('is idempotent', async () => {
    const r1 = await postEvent(event);
    const r2 = await postEvent(event);
    expect(r2.body.status).toBe('duplicate');
  });
});
```

---

## 9. Observabilidad

### Métricas
```
webhook_inbound_total{provider, result="accepted|rejected|duplicate"}
webhook_outbound_total{subscriber_id, status}
webhook_delivery_duration_seconds{subscriber_id}
webhook_outbox_pending_count
webhook_dlq_depth
```

### Dashboard
- % success por subscriber (últimas 24h)
- p95 delivery latency
- Outbox depth (si sube → worker lento)
- Top failing subscribers (posible auto-disable)

### Alertas
- Outbox depth > 1000 → worker no da abasto
- DLQ incrementando > N/min → algo sistémico
- Failure rate > 5% sostenido con 1 subscriber → ¿endpoint caído?

---

## 10. Docs para subscribers

Documento público con:
- Formato del payload (schema por event type)
- Headers y ejemplo de verificación (código en Node/Python/Go)
- Política de retries y DLQ
- IPs de origen
- Cómo rotar secret
- Event types y versionado
- SLOs de delivery

---

## 11. Anti-patterns

- ❌ Procesar el webhook síncrono antes de responder 200 (timeout → provider reintentando → duplicados)
- ❌ Sin firma HMAC → forgery trivial
- ❌ Firmar solo el body (replay attack)
- ❌ Sin idempotencia → doble-charge / doble-email
- ❌ Retries infinitos sin DLQ → flood al subscriber
- ❌ Retries sin jitter → thundering herd al recuperarse el subscriber
- ❌ Sin outbox → eventos perdidos entre commit DB y enqueue
- ❌ Payload gigante → sujeto a 413 del subscriber
- ❌ Sin versionado del payload → breaking changes silenciosos
- ❌ Secret en .env committeado
- ❌ Logs con payload completo (PII) sin redacción

---

## 12. Output final

```
✅ Webhooks setup — Alizia → partner API
   📤 Outbound:
      - Outbox pattern con Postgres
      - BullMQ worker (8 réplicas)
      - Retry schedule: 7 intentos, 0m-24h, exponencial + jitter
      - DLQ con dashboard para replay
   📥 Inbound (Stripe):
      - HMAC + timestamp anti-replay
      - Idempotencia por event_id (Redis 7d)
      - Procesamiento async via queue
   🔐 Seguridad:
      - Secrets encriptados at-rest
      - SSRF guard en URLs de subscribers
   📊 Dashboard: <link Grafana webhooks>

Próximos pasos:
  1. Subscribers B2B: publicar docs + portal
  2. Alertas: outbox depth / DLQ growth
  3. Load test del worker (k6) — `/performance-test`
```

## Delegación

**Coordinar con:** `backend-architect`, `security-engineer`, `integrations-architect`
**Reporta a:** `backend-architect`

**Skills relacionadas:**
- `/api-design` — webhooks section (HMAC, payload versioning)
- `/security-hardening` — firma, SSRF, secret rotation
- `/rate-limiting` — proteger endpoints inbound
- `/observability-setup` — métricas + alertas
- `/db-migrations` — outbox table + DLQ
