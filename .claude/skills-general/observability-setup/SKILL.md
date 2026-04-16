---
name: observability-setup
description: "Setup de observabilidad (logs + metrics + traces) para stacks Educabot. OpenTelemetry + Prometheus + Grafana + Loki + Sentry. Instrumentación en Go, TS Fastify, React+Vite, React Native. Usar para: observabilidad, monitoring, logs, metrics, traces, otel, prometheus, grafana, sentry."
---

# observability-setup — Observability Stack Generator

Setup de **los 3 pilares** (logs, metrics, traces) + **error tracking** para apps Educabot. Stack recomendado: **OpenTelemetry** (instrumentación) → **Prometheus + Loki + Tempo** (storage) → **Grafana** (UI) + **Sentry** (errores).

## Cuándo usar

- Nuevo servicio que necesita instrumentación desde día 1
- Servicio con logs tipo "printf" sin estructura → migrar a structured logging
- Incidente donde "no se ve nada" — agregar traces/metrics faltantes
- Standardizar stack entre Alizia, Tuni, etc.

## Los 3 pilares + 1

1. **Logs** — qué pasó. Structured JSON, level-aware.
2. **Metrics** — cuánto/qué tan rápido. RED (rate, errors, duration) + USE (utilization, saturation, errors).
3. **Traces** — cómo fluyó. Spans con parent-child, context propagation.
4. **Errors** (Sentry) — qué falló con stack trace y user context.

Correlación vía **trace_id** — presente en logs, traces y errors.

## Stack recomendado Educabot

| Capa | Herramienta | Notas |
|------|-------------|-------|
| Instrumentación | **OpenTelemetry SDK** | Estándar, vendor-neutral |
| Logs | **Loki** | Grep-like, barato, integra con Grafana |
| Metrics | **Prometheus** | Pull model, kube-native |
| Traces | **Tempo** | Barato, integra con Loki/Prometheus |
| UI unificada | **Grafana** | Dashboards + alerts + correlation |
| Errors | **Sentry** | Crash reporting con contexto |
| Alerting | **Alertmanager** + **PagerDuty/Slack** | — |

Alternativas managed: Datadog / New Relic / Honeycomb (más caros, menos fricción).

## Preguntas previas

1. **Stack del servicio**: Go / TS Fastify / React+Vite / React Native
2. **¿Ya hay OTel collector deployed?** (si no → ver sección K8s)
3. **¿Sentry project creado?** DSN disponible
4. **SLOs definidos?** (si no, proponer en paralelo)
5. **Alerting destino**: Slack / PagerDuty / email

---

## 1. Go backend — OpenTelemetry

### Deps
```bash
go get go.opentelemetry.io/otel \
  go.opentelemetry.io/otel/sdk \
  go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc \
  go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc \
  go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin \
  github.com/getsentry/sentry-go
```

### Init — `internal/observability/observability.go`

```go
package observability

import (
	"context"
	"os"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

func Init(ctx context.Context, service, version string) (func(context.Context) error, error) {
	exp, err := otlptracegrpc.New(ctx)
	if err != nil { return nil, err }

	res, _ := resource.Merge(resource.Default(), resource.NewWithAttributes(
		semconv.SchemaURL,
		semconv.ServiceName(service),
		semconv.ServiceVersion(version),
		semconv.DeploymentEnvironment(os.Getenv("ENV")),
	))

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exp),
		sdktrace.WithResource(res),
		sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(0.1))),
	)
	otel.SetTracerProvider(tp)
	return tp.Shutdown, nil
}
```

### Structured logging — `slog` (Go 1.21+)

```go
import "log/slog"

logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
	Level: slog.LevelInfo,
	AddSource: true,
}))
slog.SetDefault(logger)

// en handler:
slog.InfoContext(ctx, "order created",
	slog.String("order_id", id),
	slog.Int("amount", amt),
)
```

Agregar trace_id al log:
```go
span := trace.SpanFromContext(ctx)
slog.InfoContext(ctx, "...",
	slog.String("trace_id", span.SpanContext().TraceID().String()),
)
```

### Gin middleware
```go
r.Use(otelgin.Middleware("alizia-backend"))
```

### Sentry
```go
sentry.Init(sentry.ClientOptions{
	Dsn: os.Getenv("SENTRY_DSN"),
	TracesSampleRate: 0.1,
	Environment: os.Getenv("ENV"),
})
defer sentry.Flush(2 * time.Second)

r.Use(sentrygin.New(sentrygin.Options{Repanic: true}))
```

---

## 2. TS Fastify backend

### Deps
```bash
npm i @opentelemetry/api @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-grpc \
  @sentry/node @sentry/profiling-node \
  pino pino-pretty
```

### Init — `src/observability.ts`

```ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

export function initObservability(service: string, version: string) {
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: service,
      [ATTR_SERVICE_VERSION]: version,
    }),
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [getNodeAutoInstrumentations()],
  });
  sdk.start();
  process.on("SIGTERM", () => sdk.shutdown());
}
```

Importante: **importar antes que fastify**. En `src/server.ts`:
```ts
import { initObservability } from "./observability.js";
initObservability("alizia-api", process.env.VERSION ?? "dev");

import Fastify from "fastify";
// ...
```

### Logger — pino con trace_id

```ts
import pino from "pino";
import { trace } from "@opentelemetry/api";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  formatters: {
    level: (label) => ({ level: label }),
    log: (obj) => {
      const span = trace.getActiveSpan();
      if (span) {
        const ctx = span.spanContext();
        return { ...obj, trace_id: ctx.traceId, span_id: ctx.spanId };
      }
      return obj;
    },
  },
});
```

Fastify ya usa pino internamente: `Fastify({ logger })`.

### Sentry
```ts
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});

app.setErrorHandler((err, req, reply) => {
  Sentry.captureException(err);
  req.log.error(err);
  reply.status(500).send({ error: "internal" });
});
```

---

## 3. React + Vite frontend

### Deps
```bash
npm i @sentry/react @opentelemetry/api @opentelemetry/sdk-trace-web \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/instrumentation-fetch \
  @opentelemetry/context-zone
```

### Init — `src/observability.ts`

```ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: true }),
  ],
});
```

### Web Vitals → analytics
```ts
import { onCLS, onINP, onLCP } from "web-vitals";

onCLS(console.log);
onINP(console.log);
onLCP(console.log);
// o enviar a backend / Sentry performance
```

---

## 4. React Native (Expo)

### Deps
```bash
npx expo install @sentry/react-native
```

### Init en `app/_layout.tsx`
```ts
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enableAutoSessionTracking: true,
  enableNativeCrashHandling: true,
});

export default Sentry.wrap(RootLayout);
```

---

## 5. OTel Collector (K8s)

### `otel-collector.yaml` (Deployment config via Helm)

Usar chart oficial: `open-telemetry/opentelemetry-collector`.

```yaml
mode: deployment
config:
  receivers:
    otlp:
      protocols:
        grpc: { endpoint: 0.0.0.0:4317 }
        http: { endpoint: 0.0.0.0:4318 }
  processors:
    batch: {}
    memory_limiter:
      check_interval: 1s
      limit_percentage: 80
  exporters:
    otlphttp/tempo:
      endpoint: http://tempo:4318
    prometheusremotewrite:
      endpoint: http://prometheus:9090/api/v1/write
    loki:
      endpoint: http://loki:3100/loki/api/v1/push
  service:
    pipelines:
      traces:  { receivers: [otlp], processors: [memory_limiter, batch], exporters: [otlphttp/tempo] }
      metrics: { receivers: [otlp], processors: [memory_limiter, batch], exporters: [prometheusremotewrite] }
      logs:    { receivers: [otlp], processors: [memory_limiter, batch], exporters: [loki] }
```

Apps envían a `http://otel-collector:4317` (gRPC) o `:4318` (HTTP).

---

## 6. Grafana — dashboards y datasources

### Datasources (provision)
- Prometheus → métricas
- Loki → logs (vincular con trace_id para jump to trace)
- Tempo → traces (jump from span to logs)
- Sentry → (opcional, datasource community)

### Dashboard mínimo por servicio — RED metrics

```
Row 1: Request Rate (RPS)
  sum(rate(http_requests_total{service="$svc"}[5m]))

Row 2: Error Rate (%)
  sum(rate(http_requests_total{service="$svc",status=~"5.."}[5m])) /
  sum(rate(http_requests_total{service="$svc"}[5m]))

Row 3: Latency p50/p95/p99
  histogram_quantile(0.95, sum by(le) (rate(http_request_duration_seconds_bucket{service="$svc"}[5m])))

Row 4: Saturation — CPU + memory por pod
  container_cpu_usage_seconds_total / container_spec_cpu_quota
  container_memory_working_set_bytes / container_spec_memory_limit_bytes
```

### Alertas base (PrometheusRule)

```yaml
- alert: HighErrorRate
  expr: |
    sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
    / sum(rate(http_requests_total[5m])) by (service) > 0.05
  for: 10m
  labels: { severity: critical }

- alert: HighLatencyP95
  expr: histogram_quantile(0.95, sum by (le, service) (rate(http_request_duration_seconds_bucket[5m]))) > 1
  for: 10m
  labels: { severity: warning }

- alert: PodCrashLooping
  expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
  for: 15m
  labels: { severity: critical }

- alert: PodMemoryNearLimit
  expr: container_memory_working_set_bytes / container_spec_memory_limit_bytes > 0.9
  for: 10m
  labels: { severity: warning }
```

---

## 7. SLOs — ejemplo

```yaml
# slo.yaml (Sloth / OpenSLO)
service: alizia-backend
slos:
  - name: availability
    objective: 99.9
    sli:
      events:
        error_query:   sum(rate(http_requests_total{status=~"5.."}[{{.window}}]))
        total_query:   sum(rate(http_requests_total[{{.window}}]))
  - name: latency
    objective: 95
    sli:
      events:
        error_query:   sum(rate(http_request_duration_seconds_bucket{le="0.5"}[{{.window}}]))
        total_query:   sum(rate(http_request_duration_seconds_count[{{.window}}]))
```

Alertar por **burn rate**, no por SLI crudo.

---

## 8. Convenciones

### Logs
- **Siempre JSON** en prod (human-readable solo en dev)
- **Niveles**: trace/debug/info/warn/error/fatal — usar consistentemente
- **No logear secrets** (tokens, passwords, PII sin hashing)
- **Un campo `event`** estandarizado: `user.login`, `order.created`
- **Correlation ID** (`trace_id`) en todo log

### Metrics
- **Nombres snake_case con unidad**: `http_request_duration_seconds`
- **Labels con cardinality baja** — nunca `user_id` como label
- **Counter monótono, gauge para estado, histogram para duraciones**

### Traces
- **Sampling 10% default**, 100% para errores
- **Span names como `HTTP GET /users/:id`** (template, no URL concreta)
- **Atributos estándar** OpenTelemetry semconv — no custom si existe el estándar

---

## 9. Checklist pre-prod

- [ ] Logs en JSON con trace_id
- [ ] Métricas RED exportadas en `/metrics`
- [ ] Tracing con sampling configurable
- [ ] Sentry DSN por env (dev/staging/prod)
- [ ] Health endpoints `/health` + `/ready`
- [ ] ServiceMonitor (Prometheus Operator)
- [ ] Dashboard Grafana del servicio creado
- [ ] Alertas base (error rate, latency, crashes) definidas
- [ ] SLOs documentados + burn-rate alerts
- [ ] Runbook linkeado desde cada alerta

---

## 10. Anti-patterns

- ❌ `console.log` suelto — no estructurado, no indexable
- ❌ Loguear passwords / tokens / PII
- ❌ Labels de Prometheus con cardinality alta (`user_id`, `request_id`)
- ❌ Sampling 100% de traces en prod (costo)
- ❌ Alertas sin severity ni runbook
- ❌ Dashboard por equipo sin estándar → cada uno es distinto
- ❌ Sentry sin `environment` → prod + dev mezclados
- ❌ SLO sin burn-rate → pages por spikes transitorios

---

## Output final

```
✅ Observabilidad instrumentada
   - OTel SDK init (traces + metrics)
   - Structured logger con trace_id
   - Sentry error tracking
   - ServiceMonitor + PrometheusRule
   - Dashboard Grafana generado
   - SLOs definidos

Próximos pasos:
  1. Deploy del OTel collector si no existe
  2. Crear project Sentry + setear DSN secret
  3. Importar dashboard en Grafana
  4. Configurar Alertmanager → Slack/PagerDuty
  5. Documentar runbooks por alerta
```

## Delegación

**Coordinar con:** `sre-lead`, `platform-lead`, `observability-lead`
**Reporta a:** `sre-lead`

**Skills relacionadas:**
- `/k8s-deploy` — ServiceMonitor + PrometheusRule viven acá
- `/incident` — post-mortem usa traces/logs de este setup
- `/ci-cd-setup` — release tracking a Sentry desde CI
