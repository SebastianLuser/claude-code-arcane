# observability-setup — Stack Setup Details

## Go Backend
- OTel SDK: `go.opentelemetry.io/otel` + exporters OTLP gRPC + `otelgin` middleware
- Logger: `slog` JSON with `trace_id` from the span context
- Sentry: `sentry-go` + `sentrygin` middleware, `TracesSampleRate: 0.1`

## TS Fastify Backend
- OTel: `@opentelemetry/sdk-node` + auto-instrumentations + OTLP exporter. **Import before Fastify**
- Logger: pino with trace_id/span_id injected via OTel `getActiveSpan()`
- Sentry: `@sentry/node` + profiling, error handler in Fastify

## React + Vite
- Sentry: `@sentry/react` with browserTracing + replay integration
- Web Vitals: `web-vitals` (CLS, INP, LCP)

## React Native (Expo)
- `@sentry/react-native` with `enableNativeCrashHandling: true`
- `Sentry.wrap(RootLayout)` in `app/_layout.tsx`

## OTel Collector (K8s)

Helm chart `open-telemetry/opentelemetry-collector`. Receivers OTLP (gRPC :4317, HTTP :4318) -> processors (batch, memory_limiter) -> exporters (Tempo, Prometheus remote write, Loki).
