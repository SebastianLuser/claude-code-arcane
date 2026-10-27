# Client Implementation — WebSocket Realtime

## React — `useRoom` hook

Centrifuge SDK: `getToken` for the connection + `getToken` per subscription. Publish via HTTP to the backend (channels are read-only for clients). Exponential reconnect built in.

## React Native

Same hook + an `AppState` listener (reconnect on foreground) + `NetInfo` (do not reconnect without a network). WS dies in iOS background — accept it and reconnect.

## Observability

Prometheus metrics: `ws_connections_active`, `ws_messages_sent_total`, `ws_publish_latency_seconds`, `ws_disconnects_total{reason}`, `ws_rate_limited_total`, `ws_backpressure_kicks_total`.

Alerts: connections drop >30% in 5min, timeout disconnects > baseline, publish p95 > 500ms.
