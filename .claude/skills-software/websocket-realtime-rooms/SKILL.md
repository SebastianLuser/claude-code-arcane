---
name: websocket-realtime-rooms
description: "Realtime multi-tenant via WebSocket/Centrifugo/Socket.IO para apps Educabot (Go/TS + React/RN): rooms, presence, broadcast, auth, reconnect, rate limit, idempotencia, observabilidad."
category: "backend"
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

> → Read references/auth-security.md for auth JWT, ACL, TLS, rate limit, sanitization details

## Idempotencia

Cliente genera UUID v4 por mensaje (`client_msg_id`). Backend usa como dedup key con `UNIQUE (room_id, client_msg_id)` en DB. En conflicto P2002 → retornar existente.

> → Read references/heartbeat-reconnect-backpressure.md for heartbeat, reconnect backoff, backpressure, rate limiting details

> → Read references/client-implementation.md for React useRoom hook, React Native specifics, observability metrics

> → Read references/anti-patterns-checklist.md for anti-patterns list and pre-deployment checklist
