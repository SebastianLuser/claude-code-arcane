---
name: websocket-realtime-rooms
description: "Multi-tenant realtime via WebSocket/Centrifugo/Socket.IO for Educabot apps (Go/TS + React/RN): rooms, presence, broadcast, auth, reconnect, rate limit, idempotency, observability."
category: "backend"
argument-hint: "[stack: go|ts] [provider: centrifugo|socketio|raw]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# websocket-realtime-rooms — Realtime Rooms

## When to use / not use

| Use | Do not use |
|------|---------|
| Realtime chat, presence, live quiz, collaborative whiteboard, in-app notifications, live dashboard | Polling >10s → HTTP+SWR. 1-way broadcast → SSE. Video/audio → WebRTC. Closed mobile app → FCM/APNs |

## Stack Decision

| Option | Pros | Cons | When |
|--------|------|------|--------|
| **Centrifugo** | Native rooms/presence/history, JWT, scale out of the box | Separate server | **Educabot multi-tenant default** |
| **Socket.IO** | Great DX, polling fallback, Redis adapter | Own protocol, Node only | Pure Node stack, simple rooms |
| **gorilla/websocket** | Mature, lean, full control | No rooms/presence | Custom Go backend, few rooms |
| **nhooyr.io/websocket** | Modern API, context-aware | Less adoption | Modern Go |

## Architecture

```
Client (React/RN) ──WSS──► sticky LB ──► WS node(s) ──► Redis Pub/Sub (backplane)
Room = tenant:{id}:class:{classId}
Publish: HTTP → Backend (validates ACL + saves to DB) → Centrifugo/broadcast
```

**Principles:** Room namespaced with the tenant. Join requires auth+authorization. Broadcast only to the room. Presence with TTL in Redis. Backplane mandatory for horizontal scaling.

> → Read references/auth-security.md for JWT auth, ACL, TLS, rate limit, sanitization details

## Idempotency

The client generates a UUID v4 per message (`client_msg_id`). The backend uses it as the dedup key with `UNIQUE (room_id, client_msg_id)` in the DB. On a P2002 conflict → return the existing one.

> → Read references/heartbeat-reconnect-backpressure.md for heartbeat, reconnect backoff, backpressure, rate limiting details

> → Read references/client-implementation.md for React useRoom hook, React Native specifics, observability metrics

> → Read references/anti-patterns-checklist.md for anti-patterns list and pre-deployment checklist
