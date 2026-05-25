# Client Implementation — WebSocket Realtime

## React — `useRoom` hook

Centrifuge SDK: `getToken` para connection + `getToken` por subscription. Publish via HTTP al backend (canales read-only para clientes). Exponential reconnect built-in.

## React Native

Mismo hook + `AppState` listener (reconnect al foreground) + `NetInfo` (no reconectar sin red). WS muere en iOS background — aceptar y reconectar.

## Observabilidad

Metricas Prometheus: `ws_connections_active`, `ws_messages_sent_total`, `ws_publish_latency_seconds`, `ws_disconnects_total{reason}`, `ws_rate_limited_total`, `ws_backpressure_kicks_total`.

Alertas: connections cae >30% en 5min, timeout disconnects > baseline, publish p95 > 500ms.
