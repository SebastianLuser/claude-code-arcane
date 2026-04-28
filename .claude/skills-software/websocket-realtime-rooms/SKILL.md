---
name: websocket-realtime-rooms
description: "Realtime multi-tenant via WebSocket/Centrifugo/Socket.IO para apps Educabot (Go/TS + React/RN): rooms, presence, broadcast, auth, reconnect, rate limit, idempotencia, observabilidad."
argument-hint: "[stack: go|ts] [provider: centrifugo|socketio|raw]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# websocket-realtime-rooms — Realtime Rooms

## Cuándo usar / no usar

| Usar | No usar |
|------|---------|
| Chat tiempo real, presence, live quiz, pizarra colaborativa, notificaciones in-app, dashboard live | Polling >10s → HTTP+SWR. Broadcast 1-way → SSE. Video/audio → WebRTC. Mobile cerrada → FCM/APNs |

## Stack Decision

| Opción | Pros | Cons | Cuándo |
|--------|------|------|--------|
| **Centrifugo** | Rooms/presence/history nativos, JWT, scale out of box | Servidor aparte | **Default Educabot multi-tenant** |
| **Socket.IO** | DX alto, fallback polling, Redis adapter | Protocolo propio, Node only | Stack Node puro, rooms simples |
| **gorilla/websocket** | Maduro, lean, control total | Sin rooms/presence | Backend Go custom, pocas salas |
| **nhooyr.io/websocket** | API moderna, context-aware | Menos adoption | Go moderno |

## Arquitectura

```
Cliente (React/RN) ──WSS──► LB sticky ──► WS node(s) ──► Redis Pub/Sub (backplane)
Room = tenant:{id}:class:{classId}
Publish: HTTP → Backend (valida ACL + guarda DB) → Centrifugo/broadcast
```

**Principios:** Room namespaced con tenant. Join requiere auth+authorization. Broadcast solo a room. Presence con TTL en Redis. Backplane obligatorio para scale horizontal.

## Auth & Security

- JWT en handshake (query `?token=` o header), `exp` corto (1h) + refresh
- Subscribe token separado con ACL por canal (server-side validation)
- `CheckOrigin` estricto, WSS obligatorio en prod (TLS 1.2+)
- Rate limit pre-auth por IP + post-auth por user
- `ReadLimit` 4-16KB, payload size max server-side
- Sanitizar mensajes antes de broadcast (XSS)
- Disconnect forzado en logout/password rotation

## Idempotencia

Cliente genera UUID v4 por mensaje (`client_msg_id`). Backend usa como dedup key con `UNIQUE (room_id, client_msg_id)` en DB. En conflicto P2002 → retornar existente.

## Heartbeat, Reconexión, Backpressure

- **Heartbeat**: Server ping cada 25-30s, timeout 60s
- **Reconexión**: Exponential backoff 500ms→20s + jitter ±30%. Centrifugo/Socket.IO built-in
- **Backpressure**: Buffer ≥32 msgs. Drop oldest (presence/cursors) o disconnect (chat sin pérdida)

## Rate Limiting

- Mensajes: 10/seg sostenido, burst 20 (token bucket)
- Joins: 5/seg. Payload max 8KB
- Handshakes por IP: max N/min con Redis counter+TTL

## Cliente React — `useRoom` hook

Centrifuge SDK: `getToken` para connection + `getToken` por subscription. Publish via HTTP al backend (canales read-only para clientes). Exponential reconnect built-in.

## React Native

Mismo hook + `AppState` listener (reconnect al foreground) + `NetInfo` (no reconectar sin red). WS muere en iOS background — aceptar y reconectar.

## Observabilidad

Métricas Prometheus: `ws_connections_active`, `ws_messages_sent_total`, `ws_publish_latency_seconds`, `ws_disconnects_total{reason}`, `ws_rate_limited_total`, `ws_backpressure_kicks_total`.

Alertas: connections cae >30% en 5min, timeout disconnects > baseline, publish p95 > 500ms.

## Anti-patterns

- WS sin auth en handshake, broadcast global (`io.emit`), sin reconexión automática
- Sin ack/idempotencia, presence en memoria del nodo, sin backplane
- Sin sticky sessions con Socket.IO, trust del cliente para userId
- `CheckOrigin: return true`, buffer ilimitado, publish desde cliente directo
- Sin versionado de schema de eventos, Close sin frame, ping en payload JSON

## Checklist
- [ ] Provider elegido con rationale
- [ ] JWT en handshake pre-upgrade + subscribe token por canal
- [ ] Rooms namespaced con tenantId
- [ ] Sticky sessions en LB (si aplica)
- [ ] Redis adapter/Pub-Sub backplane
- [ ] Presence con TTL en Redis
- [ ] Heartbeat + reconexión exponencial
- [ ] client_msg_id + unique constraint (idempotencia)
- [ ] Rate limit por conexión + payload size limit
- [ ] Backpressure policy definida
- [ ] Publish server-side only
- [ ] Schema de eventos versionado
- [ ] WSS + CheckOrigin estricto
- [ ] Métricas + alertas
- [ ] E2E test: connect → join → msg → reconnect → dedup
- [ ] Mobile: AppState + NetInfo
