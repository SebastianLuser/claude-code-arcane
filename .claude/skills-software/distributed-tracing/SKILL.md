---
name: distributed-tracing
description: Instrumentación de tracing distribuido end-to-end con OpenTelemetry (OTel) y OTLP, propagación W3C Trace Context, exportación a Google Cloud Trace (default Educabot), Grafana Tempo, Datadog o Honeycomb. Cubre setup Go (otelgin/otelhttp), Node/TS (sdk-node auto-instrumentation), React web y React Native, spans custom, sampling head/tail-based, correlación con logs estructurados, tracing de DB/Redis/PubSub, manejo de errores y anti-patterns. Usar cuando se mencione tracing, OpenTelemetry, OTel, trace, span, Cloud Trace, Tempo, Jaeger, Datadog APM, Honeycomb, latencia, bottleneck, observabilidad end-to-end, traceparent, o cuando hay problemas de performance cross-service que requieren ver el flujo completo de un request.
---

# Distributed Tracing — OpenTelemetry + Cloud Trace

## Cuándo usar

- Debuggear latencia cross-service (frontend -> BFF -> microservicio -> DB)
- Detectar bottlenecks en requests lentos
- Entender flujo completo de un request que atraviesa N servicios
- Correlacionar errores con el contexto del request (trace_id en logs)
- Medir performance real de endpoints críticos en producción

## NO usar

- Para profiling intra-proceso fino (usar pprof Go / Chrome DevTools)
- Como reemplazo de métricas agregadas (usar Prometheus/Cloud Monitoring)
- Como reemplazo de logs (tracing y logging son complementarios)
- En funciones hot-path triviales (overhead > valor)

---

## 1. Conceptos

- **Trace**: request end-to-end, identificado por `trace_id` (16 bytes)
- **Span**: operación dentro del trace (HTTP call, DB query, función). Tiene `span_id`, `parent_span_id`, attributes, events, status
- **Baggage**: key-value propagado con el trace (ej: `tenant.id`, `user.role`)
- **Sampling**: decidir qué traces guardar. Head-based (al inicio) o tail-based (luego de completarse)
- **Propagation**: pasar contexto entre servicios. Estándar: **W3C Trace Context** via header `traceparent: 00-{trace-id}-{span-id}-01`
- **Exporter**: envía spans al backend (OTLP/gRPC o OTLP/HTTP)

**Standard Educabot**: OpenTelemetry SDK + OTLP exporter -> **Google Cloud Trace** (prod), Jaeger local (dev).

---

## 2. Backends soportados

| Backend | Cuándo | Notas |
|---|---|---|
| **Google Cloud Trace** | Default Educabot (Cloud Run/GKE) | Auto-integrado, factura por span |
| Grafana Tempo | Self-host, budget-conscious | Parea con Loki + Grafana |
| Datadog APM | Org con Datadog enterprise | Caro pero UX potente |
| Honeycomb | Debug complejo, high-cardinality | BubbleUp para root cause |
| Jaeger OSS | Dev local / fallback | `docker run jaegertracing/all-in-one` |

Siempre exportar via **OTLP** para poder switchear backend sin tocar código (solo endpoint/creds).

---

## 3. Setup Go (Gin + otelgin)

```go
// internal/observability/tracing.go
package observability

import (
	"context"
	"os"

	texporter "github.com/GoogleCloudPlatform/opentelemetry-operations-go/exporter/trace"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	"go.opentelemetry.io/otel/sdk/resource"
)

func InitTracing(ctx context.Context, serviceName string) (func(context.Context) error, error) {
	exporter, err := texporter.New(texporter.WithProjectID(os.Getenv("GCP_PROJECT_ID")))
	if err != nil {
		return nil, err
	}

	res, _ := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(serviceName),
			semconv.DeploymentEnvironment(os.Getenv("ENV")),
		),
	)

	sampler := sdktrace.TraceIDRatioBased(0.1) // 10% prod
	if os.Getenv("ENV") != "production" {
		sampler = sdktrace.AlwaysSample()
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
		sdktrace.WithSampler(sdktrace.ParentBased(sampler)),
	)
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{}, propagation.Baggage{},
	))
	return tp.Shutdown, nil
}
```

En Gin:

```go
import "go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"

r := gin.New()
r.Use(otelgin.Middleware("alizia-be"))
```

HTTP client out-going:

```go
import "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"

client := http.Client{Transport: otelhttp.NewTransport(http.DefaultTransport)}
```

Span custom:

```go
tracer := otel.Tracer("alizia-be/user-service")
ctx, span := tracer.Start(ctx, "UserService.UpdateProfile")
defer span.End()

span.SetAttributes(
	attribute.String("user.id", userID),
	attribute.String("tenant.id", tenantID),
)

if err := svc.Update(ctx, u); err != nil {
	span.RecordError(err)
	span.SetStatus(codes.Error, err.Error())
	return err
}
```

DB tracing (`otelsql`):

```go
db, _ := otelsql.Open("postgres", dsn, otelsql.WithAttributes(semconv.DBSystemPostgreSQL))
```

---

## 4. Setup Node/TS (auto-instrumentation)

```ts
// src/tracing.ts — DEBE importarse ANTES que cualquier otro require
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { TraceIdRatioBasedSampler, ParentBasedSampler } from '@opentelemetry/sdk-trace-base';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const isProd = process.env.NODE_ENV === 'production';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'tich-api',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.ENV ?? 'dev',
  }),
  traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT }),
  sampler: new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(isProd ? 0.1 : 1.0),
  }),
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': { enabled: false }, // ruidoso
  })],
});

sdk.start();
process.on('SIGTERM', () => sdk.shutdown());
```

Arranque: `node --require ./dist/tracing.js dist/main.js`.

Span custom:

```ts
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('tich-api');

await tracer.startActiveSpan('processPayment', async (span) => {
  span.setAttribute('user.id', userId);
  try {
    return await doPayment();
  } catch (err) {
    span.recordException(err as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw err;
  } finally {
    span.end();
  }
});
```

---

## 5. Propagación de contexto

**HTTP**: automático con `otelhttp` (Go) o auto-instrumentation (Node). Inyecta header `traceparent: 00-{trace-id}-{span-id}-01`.

**PubSub / Kafka**: inyectar manualmente en message attributes:

```go
carrier := propagation.MapCarrier{}
otel.GetTextMapPropagator().Inject(ctx, carrier)
msg.Attributes = carrier // publish

// consumer:
ctx = otel.GetTextMapPropagator().Extract(ctx, propagation.MapCarrier(msg.Attributes))
```

---

## 6. Sampling

| Entorno | Rate | Sampler |
|---|---|---|
| Dev / staging | 100% | `AlwaysSample` |
| Prod | 10% | `TraceIDRatioBased(0.1)` + `ParentBased` |
| Errores / latencia alta | 100% | Tail-based (Collector) |

Tail-based requiere **OpenTelemetry Collector** entre app y backend:

```yaml
# otel-collector.yaml
processors:
  tail_sampling:
    policies:
      - name: errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: slow
        type: latency
        latency: { threshold_ms: 1000 }
      - name: random
        type: probabilistic
        probabilistic: { sampling_percentage: 10 }
```

---

## 7. Correlación con logs estructurados

Incluir `trace_id` y `span_id` en cada log line. Ver `/logging-setup`.

Go (slog + otelslog):

```go
sc := trace.SpanContextFromContext(ctx)
if sc.IsValid() {
	logger = logger.With("trace_id", sc.TraceID().String(), "span_id", sc.SpanID().String())
}
```

En Cloud Logging, con `logging.googleapis.com/trace: "projects/{project}/traces/{trace_id}"` el log aparece linkeado en Cloud Trace UI.

---

## 8. Frontend React (web)

```ts
// tracing.ts
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

const provider = new WebTracerProvider({
  sampler: new TraceIdRatioBasedSampler(0.02), // 2% web: caro
});
provider.addSpanProcessor(new BatchSpanProcessor(new OTLPTraceExporter({
  url: '/v1/traces', // proxy al collector
})));
provider.register();

registerInstrumentations({
  instrumentations: [new FetchInstrumentation({
    propagateTraceHeaderCorsUrls: [/api\.educabot\.com/],
  })],
});
```

Propaga `traceparent` al backend automáticamente. Samplear agresivo (1-5%): el tráfico browser es enorme.

**React Native**: mismo approach con `@opentelemetry/sdk-trace-web`, cuidado con bundle size y battery.

---

## 9. Errores y attributes útiles

```go
span.SetAttributes(
	attribute.String("user.id", userID),      // OK: ID interno
	attribute.String("tenant.id", tenantID),  // OK
	attribute.Int("result.count", n),         // OK
	attribute.String("http.route", "/api/users/:id"), // OK
)
span.RecordError(err)
span.SetStatus(codes.Error, "failed to fetch user")
```

**NO**: email, password, tokens, contenido libre del usuario, respuestas completas de DB.

---

## 10. Link con Bugsnag / error tracking

Incluir `trace_id` en el contexto del error para saltar desde Bugsnag a Cloud Trace:

```go
bugsnag.Notify(err, bugsnag.MetaData{
	"trace": {"trace_id": span.SpanContext().TraceID().String()},
})
```

---

## Anti-patterns

- ❌ Sampling 100% en prod -> factura explosiva en Cloud Trace / Datadog
- ❌ Sin propagation -> spans huérfanos, no se ve el trace completo
- ❌ PII en attributes (email, password, DNI, contenido de mensajes)
- ❌ Spans demasiado finos (instrumentar cada función helper) -> overhead + ruido
- ❌ Sin correlación con logs -> no podés saltar de log a trace
- ❌ Olvidar `span.End()` / `defer span.End()` -> memory leak, spans nunca enviados
- ❌ Usar `log.Printf("took %dms", elapsed)` en vez de spans para medir latencia
- ❌ Instrumentar manualmente lo que auto-instrumentation ya cubre (duplica spans)
- ❌ Exportar directo al backend sin Collector -> no podés hacer tail sampling ni filtrar PII
- ❌ `traceparent` no propagado en PubSub/Kafka -> trace se corta en boundary async
- ❌ `AlwaysSample` en React web prod -> miles de spans por usuario, caro e inútil

---

## Checklist review

- [ ] SDK OTel inicializado **antes** de cualquier otra dependencia (Node: `--require`)
- [ ] `service.name` y `deployment.environment` como resource attributes
- [ ] Propagator configurado: `TraceContext + Baggage`
- [ ] Sampler: `ParentBased(TraceIDRatioBased)`, 10% prod, 100% dev
- [ ] HTTP server middleware (otelgin / auto-instr)
- [ ] HTTP client wrapped (otelhttp / auto-instr)
- [ ] DB driver wrapped (otelsql / Prisma instr)
- [ ] PubSub/Kafka: inject/extract manual de traceparent
- [ ] Logs estructurados incluyen `trace_id` + `span_id`
- [ ] `span.RecordError` + `SetStatus(Error)` en paths de error
- [ ] Shutdown limpio (`tp.Shutdown` / `sdk.shutdown`) en SIGTERM
- [ ] Sin PII en attributes (code review con grep `email|password|token`)
- [ ] Frontend samplea <=5%
- [ ] Collector intermedio para tail-sampling si prod alto volumen

---

## Output final ✅

- Trace end-to-end visible en Cloud Trace desde frontend hasta DB
- Request lento -> span más largo o gap entre spans identifica bottleneck en segundos
- Error en prod -> desde Bugsnag/log saltás al trace_id y ves el flujo completo
- Costo de tracing <2% del billing total (sampling correcto)
- Zero PII en spans (auditado)

---

## Delegación

- Setup de logs estructurados con trace_id -> `/logging-setup`
- Error tracking (Bugsnag) linkeado al trace -> `/error-tracking`
- Métricas agregadas (RED, USE) -> `/metrics-monitoring`
- Performance budget / profiling intra-proceso -> `/optimize`
- Deploy del Collector en GKE/Cloud Run -> `/deploy-check`
- Auditoría de observabilidad completa -> `/audit-dev`
