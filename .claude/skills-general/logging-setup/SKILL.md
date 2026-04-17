---
name: logging-setup
description: "Logging estructurado para apps Educabot (Go/TS/React/RN): slog, pino, Cloud Logging, Loki, Datadog, JSON structured logs, correlation IDs (trace/span), PII scrubbing, log levels, sampling, retention, cost control. Usar para: logs, logging, slog, pino, winston, loki, datadog, cloud logging, log shipping, observability."
argument-hint: "[stack: go|ts|react|rn]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# logging-setup — Structured Logging

Logs estructurados para apps Educabot. Objetivo: **debuggable en prod, barato a escala, sin PII**.

## Cuándo usar

- Apps backend / servicios en prod
- Debugging distribuido (múltiples servicios)
- Compliance / audit trail
- Post-mortem de incidents

## Cuándo NO usar

- Para errores → `/error-tracking` (Sentry). Logs ≠ error tracker.
- Para métricas → `/observability-setup` (Prometheus/OTel).
- Scripts one-shot → `console.log` y listo.

---

## 1. Principios

1. **JSON estructurado** siempre — nunca strings libres en prod
2. **Una línea = un evento** — no multi-line, no pretty-print en prod
3. **Level + message + context** — todo evento tiene los tres
4. **Correlation ID** (trace_id, request_id, user_id, tenant_id) en cada línea
5. **Sin PII** — scrubber en el logger
6. **Sampling** en hot paths — no todo merece 100%
7. **Logs ≠ errors ≠ metrics ≠ traces** — cada uno tiene su destino

---

## 2. Stack — decisión

| Destino | Pros | Cons | Cuándo |
|---------|------|------|--------|
| **GCP Cloud Logging** | Integrado con GCP, trace linking nativo | $0.50/GiB ingest | **Default Educabot** (runtime GCP) |
| **Grafana Loki** | OSS, cheap, label-based | Full-text search limitado | Self-host / presupuesto |
| **Datadog Logs** | UI top, APM integration | $$$ a escala | Si ya pagan DD APM |
| **ELK / OpenSearch** | Búsqueda full-text | Ops pesado | Compliance logs / SIEM |
| **BetterStack / Axiom** | SaaS moderno, simple | SaaS, $$ creciente | Equipos chicos |

**Default Educabot:** Cloud Logging para runtime + Loki self-host para logs de alto volumen/cheap retention.

---

## 3. Go — slog (stdlib 1.21+)

```go
import (
  "log/slog"
  "os"
)

func initLogger() *slog.Logger {
  var h slog.Handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level:     parseLevel(os.Getenv("LOG_LEVEL")), // info default
    AddSource: false, // true en dev
    ReplaceAttr: scrubAttr, // scrub PII
  })
  return slog.New(h).With(
    slog.String("service", "alizia-api"),
    slog.String("env", os.Getenv("APP_ENV")),
    slog.String("version", os.Getenv("APP_VERSION")),
  )
}

// uso
log.Info("user logged in",
  slog.String("user_id", user.ID),
  slog.String("tenant_id", tenantID),
  slog.String("trace_id", traceID(ctx)),
)

log.Error("payment failed",
  slog.String("order_id", orderID),
  slog.Any("err", err),
)
```

### Context-aware logger
```go
// inyectar logger con request-scoped attrs
func LoggerMiddleware(base *slog.Logger) gin.HandlerFunc {
  return func(c *gin.Context) {
    reqLog := base.With(
      slog.String("request_id", c.GetHeader("X-Request-ID")),
      slog.String("trace_id", traceID(c.Request.Context())),
      slog.String("route", c.FullPath()),
    )
    c.Set("log", reqLog)
    c.Next()
  }
}

// en handler
log := c.MustGet("log").(*slog.Logger)
log.Info("course created", slog.String("course_id", id))
```

---

## 4. Node/TS — pino

```ts
import pino from 'pino';

export const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: {
    service: 'alizia-web',
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  },
  redact: {
    paths: ['password', '*.password', 'token', '*.token', 'authorization', 'req.headers.cookie', '*.dni', '*.cuit'],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }), // "info" no 30
  },
});

// request logger
import pinoHttp from 'pino-http';
app.use(pinoHttp({
  logger: log,
  customProps: (req) => ({ trace_id: req.headers['x-cloud-trace-context'] }),
  serializers: {
    req: (r) => ({ method: r.method, url: r.url, id: r.id }),
    res: (r) => ({ statusCode: r.statusCode }),
  },
}));
```

### Por qué pino (no winston)
- 5x más rápido
- JSON nativo por default
- Ecosistema maduro (pino-http, pino-pretty, pino-socket)
- Low overhead en hot paths

---

## 5. Cloud Logging — fields especiales

GCP Cloud Logging auto-indexa si usás el schema correcto:

```json
{
  "severity": "ERROR",
  "message": "payment failed",
  "logging.googleapis.com/trace": "projects/my-proj/traces/abc123",
  "logging.googleapis.com/spanId": "def456",
  "logging.googleapis.com/labels": { "tenant_id": "t_1", "env": "prod" },
  "httpRequest": { "requestMethod": "POST", "status": 402, "latency": "0.42s" }
}
```

- `severity`: DEBUG/INFO/WARNING/ERROR/CRITICAL → filtros en UI
- `trace`: link automático a Cloud Trace
- `httpRequest`: Log Explorer muestra método/status/latency como columnas

### Setup en Cloud Run / GKE
stdout/stderr se loguea automáticamente — no necesitás shipping agent.

---

## 6. Correlation / trace IDs

### Propagar entre servicios
```
Client ─► LB ─► service-a ─► service-b
         trace_id=abc123 header consistente
```

Usar OpenTelemetry W3C Trace Context:
```
traceparent: 00-abc123...-def456-01
```

### En cada log
```go
func traceID(ctx context.Context) string {
  sc := trace.SpanFromContext(ctx).SpanContext()
  if sc.HasTraceID() { return sc.TraceID().String() }
  return ""
}
```

Todo log dentro de un request debe tener el mismo `trace_id`. Así filtrás por trace y ves el flujo completo.

---

## 7. React / frontend

Frontend **no debería loggear mucho al backend**. Lo importante ya va:
- Errores → Sentry
- Analytics → skill `/observability-setup` o Mixpanel/Amplitude

Si necesitás logs de frontend centralizados:
```ts
// cliente propio, bufferea + batch + flush
const logger = createLogger({
  endpoint: '/api/logs',
  batchSize: 20,
  flushMs: 5000,
  level: import.meta.env.MODE === 'dev' ? 'debug' : 'warn',
});

logger.warn('course video failed to load', { courseId, errorCode });
```

Evitar loguear interacciones rutinarias — ruido + costo + privacy.

---

## 8. React Native

Similar: errores → Sentry; analytics → Mixpanel/Amplitude.

Para logs de debug en campo:
- `console.log` + `react-native-logs` (archivos locales rotados)
- Upload opcional con consent del user (diagnóstico)

Nunca incluir PII en logs locales del device.

---

## 9. Log levels — cuándo cada uno

| Level | Uso |
|-------|-----|
| **DEBUG** | Flujo interno, valores intermedios. Off en prod salvo troubleshooting. |
| **INFO** | Eventos normales del sistema ("user signed in", "job finished"). Default prod. |
| **WARN** | Algo raro pero recuperable ("retry 2/3", "stale cache"). Mirar tendencias. |
| **ERROR** | Falla de una operación, pero el sistema sigue. → Sentry también. |
| **FATAL/CRITICAL** | Se muere el servicio. Raro. Page on-call. |

Regla: si nadie va a hacer algo con la línea → bájala de level o sacala.

---

## 10. Sampling

Ingest en Cloud Logging ~$0.50/GiB. En servicios high-QPS, INFO por request puede costar cientos/mes.

### Head-based
```go
if rand.Float64() < 0.1 { log.Info(...) } // 10%
```

### Smarter: siempre errores, samplear éxitos
```go
if status >= 400 || rand.Float64() < 0.05 {
  log.Info("request complete", ...)
}
```

### Pino sampling
```ts
const log = pino({ level: 'info', mixin: () => ({ sampled: true }) });
// plus logic en wrapper
```

**Trazas** reemplazan muchos logs de request — si tenés OTel, bajá INFO a sampled 1-5%.

---

## 11. PII scrubbing

Campos prohibidos en logs:
- password / tokens / API keys
- DNI/CPF/CUIT/RFC
- email (hash si hace falta correlación)
- dirección, teléfono
- contenido de mensajes/chats de usuarios
- datos de tarjetas

### Go — ReplaceAttr
```go
func scrubAttr(groups []string, a slog.Attr) slog.Attr {
  switch a.Key {
  case "password", "token", "authorization", "dni", "cuit", "cpf":
    return slog.String(a.Key, "[REDACTED]")
  case "email":
    return slog.String(a.Key, hashEmail(a.Value.String()))
  }
  return a
}
```

### Pino — redact
Ya mostrado en sección 4.

### Log de request body
Nunca loguear `req.body` crudo. Si necesitás debug, loguear fields específicos no-sensibles.

---

## 12. Retention & cost

| Log type | Retention | Por qué |
|----------|-----------|---------|
| Application logs | 30d hot, 90d cold | Debug reciente; archivar más |
| Access logs (LB) | 30d | Usage analytics |
| Audit logs (auth, admin) | 1 año mínimo | Compliance |
| Security logs (SIEM) | 1+ año | LGPD/GDPR audit |
| Debug logs prod | 7-14d | Cost control |

### Reducir costo
- Sampling (sección 10)
- Level ≥ INFO en prod, WARN en rutas triviales
- Excluir healthchecks/liveness de logs
- Loki para logs de alto volumen baratos + Cloud Logging para críticos
- Archive a GCS para long-term cold storage

---

## 13. Lo que NO debe estar en logs

- ❌ Secrets / tokens / passwords
- ❌ PAN / CVV (PCI violation)
- ❌ PII (email, DNI, dirección)
- ❌ Contenido libre de usuarios (mensajes, tareas)
- ❌ Session cookies completas
- ❌ Authorization headers
- ❌ Bodies de request/response crudos
- ❌ Stack traces con paths locales del dev en prod

---

## 14. Access logs (HTTP)

```
method path status latency user_id tenant_id trace_id ip user_agent
```

- `remote_addr`: si hay proxy, usar `X-Forwarded-For` (primero, validado)
- `latency`: siempre incluir — detectar endpoints lentos
- `user_agent`: útil para debug mobile vs web
- Excluir `/health`, `/ready`, `/metrics` del access log

---

## 15. Audit logs (compliance)

Separados de application logs — append-only, retention larga.

Eventos a auditar:
- Login / logout / signup
- Cambio de password / MFA
- Cambio de rol / permisos
- Acceso a datos sensibles (PII de menores)
- Creación/borrado de tenant
- Export de datos (GDPR requests)
- Admin actions

Schema:
```sql
audit_logs (id, actor_id, actor_type, action, target_type, target_id, tenant_id, ip, user_agent, metadata jsonb, created_at)
```

Write-only, no update/delete jamás. Backup off-cluster.

---

## 16. Alerting desde logs

Log-based metrics en Cloud Logging:
```
resource.type="cloud_run_revision"
severity="ERROR"
jsonPayload.module="payments"
```
→ convertir a métrica → alerta si > N/min.

Para errores de app **preferir Sentry** (dedupe, grouping, volumen). Para anomalías de acceso / security → log-based es el camino.

---

## 17. Testing

- Logger inyectable (no global import) para test
- Capturar logs en test: `slogtest.NewRecorder()` / pino test transport
- Assert **estructura** (keys, level) no strings exactos

```ts
it('logs with trace_id', async () => {
  const entries: any[] = [];
  const log = pino({ }, { write: (s) => entries.push(JSON.parse(s)) });
  await handler({ log });
  expect(entries[0]).toMatchObject({ level: 'info', trace_id: expect.any(String) });
});
```

---

## 18. Anti-patterns

- ❌ `console.log` en prod (Node) → sin estructura, sin level
- ❌ Logs con `printf`-style interpolation → imposible de parsear
- ❌ Multi-line logs en prod (stack trace raw) → grep ≠ trabajable
- ❌ Todo a INFO → señal ahogada por ruido
- ❌ Sin correlation_id → debug multi-servicio imposible
- ❌ PII en logs → GDPR/LGPD fine
- ❌ Logs como sustituto de métricas (count eventos grepeando logs es caro)
- ❌ Retention infinita → costo explota
- ❌ Logs del healthcheck cada 5s → spam
- ❌ `log.info(JSON.stringify(bigObject))` en hot path
- ❌ `logger.error(err)` sin contexto (orderID, userID)
- ❌ Logger global que se instancia en cada call
- ❌ Shipping de logs sync (bloquea handler) → usar async/batch

---

## 19. Checklist review

```markdown
- [ ] slog/pino/logger estructurado JSON en prod
- [ ] Level configurable via env
- [ ] Base fields: service, env, version, region
- [ ] Request-scoped: trace_id, request_id, user_id, tenant_id
- [ ] PII scrubber activo
- [ ] severity mapeada al provider (Cloud Logging/Loki)
- [ ] Sampling en hot paths
- [ ] Healthchecks excluidos
- [ ] Audit logs separados con retention ≥ 1 año
- [ ] Access logs con latency
- [ ] Retention policy definida por tipo
- [ ] Log-based alerts críticos configurados
- [ ] Tests que validan estructura
- [ ] Cost review mensual (GiB/día por servicio)
```

---

## 20. Output final

```
✅ Logging — Alizia
   📝 slog (Go) + pino (Node) → JSON structured
   ☁️  Cloud Logging runtime (GCP) + Loki archivo
   🔗 trace_id/request_id/tenant_id en todas las líneas
   🔐 PII scrubber (password/token/dni/cuit/email-hash)
   📊 Sampling 10% INFO success, 100% errors
   🗃️  Retention: app 30/90d, audit 1yr, security SIEM 1+ yr
   🚨 Log-based alerts: auth anomaly, 5xx spike, audit high-risk

Próximos pasos:
  1. Moverse a Loki para app logs (saving ~60% ingest)
  2. Dashboard cost-per-service en Grafana
  3. Runbook "grep + trace" para on-call
```

## Delegación

**Coordinar con:** `sre-lead`, `security-architect`, `backend-architect`, `platform-lead`
**Reporta a:** `sre-lead`

**Skills relacionadas:**
- `/error-tracking` — Sentry para errores (no logs)
- `/observability-setup` — metrics + traces complementan logs
- `/incident` — runbook usa logs + traces
- `/secret-management` — no loguear secrets
- `/security-hardening` — PII policy, audit logs retention
