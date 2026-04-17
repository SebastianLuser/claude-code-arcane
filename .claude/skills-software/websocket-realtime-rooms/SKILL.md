---
name: websocket-realtime-rooms
description: "Realtime multi-tenant via WebSocket/Centrifugo/Socket.IO para apps Educabot (Go/TS + React/RN): rooms, presence, broadcast/unicast, auth en handshake, sticky sessions + Redis/Pub-Sub backplane, heartbeat, reconexión exponencial, rate limit, backpressure, idempotencia con client_msg_id, observabilidad. Usar para: websocket, ws, realtime, chat, presence, rooms, sockets, live, centrifugo, socket.io, gorilla/websocket, nhooyr, broadcast."
argument-hint: "[stack: go|ts] [provider: centrifugo|socketio|raw]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# websocket-realtime-rooms — Realtime Rooms

Guía para meter realtime en apps Educabot (aula virtual, chat docente-alumno, live quiz, colaboración en pizarra). Objetivo: **salas multi-tenant que escalen horizontalmente, auth sólida, reconexión transparente**.

## Cuándo usar

- Chat en tiempo real (aula, tutor-alumno, staff)
- Presence (quién está online en la sala/clase)
- Live quiz / encuestas / pizarra colaborativa
- Notificaciones push in-app (no email)
- Updates de dashboard en vivo (métricas, progreso)

## Cuándo NO usar

- Polling cada >10s alcanza → usar HTTP + SWR/React Query
- Broadcast 1-way a miles sin interacción → SSE (más simple)
- Streaming binario pesado (video/audio) → WebRTC, no WS
- Notificaciones mobile con app cerrada → FCM/APNs, no WS

---

## 1. Stack — decisión

| Opción | Lenguaje | Pros | Cons | Cuándo |
|--------|----------|------|------|--------|
| **Centrifugo** | standalone (Go) | Rooms/presence/history nativos, JWT, scale out of box, client SDKs JS/RN/Flutter | Servidor aparte, menos control | **Default Educabot multi-tenant** |
| **Socket.IO** | Node | DX alto, fallback polling, Redis adapter | Protocolo propio (no WS estándar), Node only | Stack Node puro, rooms simples |
| **gorilla/websocket** | Go | Maduro, lean, control total | Sin rooms/presence, hacerlo a mano | Backend Go custom, pocas salas |
| **nhooyr.io/websocket** | Go | API moderna, context-aware, ping/pong automáticos | Menos adoption | Go moderno, lo mismo que gorilla |
| **ws (bare WebSocket)** | nativo browser | Standard, liviano | No rooms, no reconnect | Cliente custom sin magic |

**Default Educabot:**
- Aula + chat + presence + cross-service → **Centrifugo** + backend Go/TS publicando eventos
- Backend Node monolito → **Socket.IO** + Redis adapter
- Backend Go custom liviano → **nhooyr.io/websocket** + Redis Pub/Sub

---

## 2. Arquitectura salas

```
Cliente (React/RN) ──WS/WSS──► LB sticky ──► WS node(s)
                                               │
                                               ├─► Redis Pub/Sub (backplane)
                                               ├─► Redis (presence TTL)
                                               └─► Auth service (JWT verify)

Room = canal lógico:  class:{classId}   chat:{roomId}   user:{userId}
Publish API (HTTP) ──► Centrifugo/Backend ──► broadcast a suscriptores
```

**Principios:**
- Room = string namespaced (`tenant:{id}:class:{classId}`)
- Join requiere auth + authorization (¿este user puede estar en esta sala?)
- Broadcast **siempre** limitado a room — nunca "a todos"
- Presence con TTL en Redis, no en memoria del nodo
- Backplane (Redis Pub/Sub o Centrifugo engine) = única forma de escalar horizontal

---

## 3. Centrifugo — default recomendado

### Config (`config.json`)
```json
{
  "token_hmac_secret_key": "${CENTRIFUGO_JWT_SECRET}",
  "api_key": "${CENTRIFUGO_API_KEY}",
  "allowed_origins": ["https://app.educabot.com"],
  "namespaces": [
    {
      "name": "class",
      "presence": true,
      "history_size": 50,
      "history_ttl": "10m",
      "join_leave": true,
      "allow_publish_for_subscriber": false,
      "allow_subscribe_for_client": false
    },
    {
      "name": "user",
      "presence": false,
      "allow_subscribe_for_client": false
    }
  ]
}
```

### Backend emite token + publica
```go
// Go — emitir connection token
import "github.com/golang-jwt/jwt/v5"

func CentrifugoToken(userID, tenantID string) (string, error) {
  claims := jwt.MapClaims{
    "sub":  userID,
    "exp":  time.Now().Add(1 * time.Hour).Unix(),
    "info": map[string]string{"tenantId": tenantID},
  }
  tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
  return tok.SignedString([]byte(os.Getenv("CENTRIFUGO_JWT_SECRET")))
}

// Publish server → room
func PublishToClass(ctx context.Context, classID string, payload any) error {
  body, _ := json.Marshal(map[string]any{
    "channel": "class:" + classID,
    "data":    payload,
  })
  req, _ := http.NewRequestWithContext(ctx, "POST",
    os.Getenv("CENTRIFUGO_URL")+"/api/publish", bytes.NewReader(body))
  req.Header.Set("X-API-Key", os.Getenv("CENTRIFUGO_API_KEY"))
  req.Header.Set("Content-Type", "application/json")
  resp, err := http.DefaultClient.Do(req)
  if err != nil { return err }
  defer resp.Body.Close()
  if resp.StatusCode >= 300 { return fmt.Errorf("centrifugo publish %d", resp.StatusCode) }
  return nil
}
```

### Subscribe token (authorization por sala)
```ts
// Node — firmar subscription token validando ACL server-side
import jwt from 'jsonwebtoken';

export async function subscribeToken(userId: string, channel: string) {
  // authorization ANTES de firmar
  const [kind, id] = channel.split(':');
  if (kind === 'class') {
    const ok = await db.enrollment.exists({ userId, classId: id });
    if (!ok) throw new Error('forbidden');
  }
  return jwt.sign(
    { sub: userId, channel, exp: Math.floor(Date.now() / 1000) + 3600 },
    process.env.CENTRIFUGO_JWT_SECRET!,
    { algorithm: 'HS256' },
  );
}
```

---

## 4. Socket.IO — Node + Redis adapter

```ts
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';

const io = new Server(httpServer, {
  cors: { origin: process.env.APP_URL },
  pingInterval: 25_000,
  pingTimeout: 20_000,
  maxHttpBufferSize: 1e6, // 1MB
});

// Redis adapter → scale horizontal
const pub = createClient({ url: process.env.REDIS_URL });
const sub = pub.duplicate();
await Promise.all([pub.connect(), sub.connect()]);
io.adapter(createAdapter(pub, sub));

// Auth en handshake (antes del upgrade efectivo)
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('unauthorized'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    socket.data.userId = payload.sub;
    socket.data.tenantId = payload.tenantId;
    next();
  } catch { next(new Error('unauthorized')); }
});

// Rate limit por conexión (token bucket simple)
const buckets = new WeakMap<any, { tokens: number; ts: number }>();
const LIMIT = 10, WINDOW_MS = 1000;
function allow(socket: any) {
  const b = buckets.get(socket) ?? { tokens: LIMIT, ts: Date.now() };
  const elapsed = Date.now() - b.ts;
  b.tokens = Math.min(LIMIT, b.tokens + (elapsed * LIMIT) / WINDOW_MS);
  b.ts = Date.now();
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  buckets.set(socket, b);
  return true;
}

io.on('connection', (socket) => {
  socket.on('room:join', async ({ roomId }, ack) => {
    const channel = `tenant:${socket.data.tenantId}:class:${roomId}`;
    const ok = await canJoin(socket.data.userId, roomId);
    if (!ok) return ack?.({ error: 'forbidden' });
    socket.join(channel);
    io.to(channel).emit('presence:join', { userId: socket.data.userId });
    ack?.({ ok: true });
  });

  socket.on('msg:send', async (msg, ack) => {
    if (!allow(socket)) return ack?.({ error: 'rate_limited' });
    // idempotencia: client_msg_id
    if (await seen(msg.client_msg_id)) return ack?.({ ok: true, dedup: true });
    await markSeen(msg.client_msg_id, 60);
    const saved = await db.messages.create({ ...msg, userId: socket.data.userId });
    io.to(msg.channel).emit('msg:new', saved);
    ack?.({ ok: true, id: saved.id });
  });

  socket.on('disconnect', () => {
    for (const channel of socket.rooms) {
      io.to(channel).emit('presence:leave', { userId: socket.data.userId });
    }
  });
});
```

**Sticky sessions:** en LB (nginx `ip_hash`, ALB `stickiness`, GKE BackendConfig `affinity: CLIENT_IP`). Socket.IO con polling fallback **las necesita sí o sí**.

---

## 5. gorilla/websocket (Go) + Redis Pub/Sub

```go
package ws

import (
  "context"
  "encoding/json"
  "net/http"
  "sync"
  "time"

  "github.com/gorilla/websocket"
  "github.com/redis/go-redis/v9"
)

var upgrader = websocket.Upgrader{
  ReadBufferSize:  1024,
  WriteBufferSize: 1024,
  CheckOrigin: func(r *http.Request) bool {
    return r.Header.Get("Origin") == "https://app.educabot.com"
  },
}

type Client struct {
  conn    *websocket.Conn
  userID  string
  send    chan []byte // buffered
  rooms   map[string]bool
}

type Hub struct {
  rooms   map[string]map[*Client]bool
  mu      sync.RWMutex
  rdb     *redis.Client
}

const (
  writeWait  = 10 * time.Second
  pongWait   = 60 * time.Second
  pingPeriod = 54 * time.Second
  sendBuf    = 64 // backpressure: si se llena → kick
)

func (h *Hub) Handle(w http.ResponseWriter, r *http.Request) {
  // auth en handshake — validar JWT del query/header ANTES del upgrade
  userID, err := validateJWT(r.URL.Query().Get("token"))
  if err != nil { http.Error(w, "unauthorized", 401); return }

  conn, err := upgrader.Upgrade(w, r, nil)
  if err != nil { return }
  c := &Client{conn: conn, userID: userID, send: make(chan []byte, sendBuf), rooms: map[string]bool{}}

  conn.SetReadLimit(4096)
  conn.SetReadDeadline(time.Now().Add(pongWait))
  conn.SetPongHandler(func(string) error {
    conn.SetReadDeadline(time.Now().Add(pongWait))
    return nil
  })

  go c.writePump()
  go c.readPump(h)
}

func (c *Client) writePump() {
  ticker := time.NewTicker(pingPeriod)
  defer func() { ticker.Stop(); c.conn.Close() }()
  for {
    select {
    case msg, ok := <-c.send:
      c.conn.SetWriteDeadline(time.Now().Add(writeWait))
      if !ok { c.conn.WriteMessage(websocket.CloseMessage, nil); return }
      if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil { return }
    case <-ticker.C:
      c.conn.SetWriteDeadline(time.Now().Add(writeWait))
      if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil { return }
    }
  }
}

// broadcast: local + Redis Pub/Sub (otros nodos)
func (h *Hub) Publish(ctx context.Context, room string, payload []byte) error {
  h.local(room, payload)
  return h.rdb.Publish(ctx, "ws:"+room, payload).Err()
}

func (h *Hub) local(room string, payload []byte) {
  h.mu.RLock(); defer h.mu.RUnlock()
  for c := range h.rooms[room] {
    select {
    case c.send <- payload:
    default:
      // buffer lleno → drop connection (vs drop oldest)
      close(c.send)
      delete(h.rooms[room], c)
    }
  }
}
```

**Backplane:** un goroutine por nodo suscrito a `ws:*` en Redis → replay a `h.local(room, payload)`.

---

## 6. Cliente React — hook `useRoom`

```tsx
// src/realtime/useRoom.ts
import { useEffect, useRef, useState } from 'react';
import { Centrifuge, Subscription } from 'centrifuge';

type State = 'connecting' | 'connected' | 'disconnected';

export function useRoom<T = unknown>(roomId: string | null) {
  const [messages, setMessages] = useState<T[]>([]);
  const [presence, setPresence] = useState<string[]>([]);
  const [state, setState] = useState<State>('disconnected');
  const subRef = useRef<Subscription | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const centrifuge = new Centrifuge(import.meta.env.VITE_WS_URL, {
      getToken: async () => {
        const r = await fetch('/api/realtime/token', { credentials: 'include' });
        if (!r.ok) throw new Error('token');
        return (await r.json()).token;
      },
      minReconnectDelay: 500,
      maxReconnectDelay: 20_000, // exponential backoff
    });

    centrifuge.on('connecting', () => setState('connecting'));
    centrifuge.on('connected', () => setState('connected'));
    centrifuge.on('disconnected', () => setState('disconnected'));

    const channel = `class:${roomId}`;
    const sub = centrifuge.newSubscription(channel, {
      getToken: async ({ channel }) => {
        const r = await fetch(`/api/realtime/subscribe?channel=${encodeURIComponent(channel)}`, {
          credentials: 'include',
        });
        if (!r.ok) throw new Error('sub');
        return (await r.json()).token;
      },
    });

    sub.on('publication', (ctx) => setMessages((m) => [...m, ctx.data as T]));
    sub.on('join', (ctx) => setPresence((p) => [...new Set([...p, ctx.info.user])]));
    sub.on('leave', (ctx) => setPresence((p) => p.filter((u) => u !== ctx.info.user)));

    sub.subscribe();
    centrifuge.connect();
    subRef.current = sub;

    return () => { sub.unsubscribe(); centrifuge.disconnect(); };
  }, [roomId]);

  const send = async (data: unknown) => {
    const msg = { client_msg_id: crypto.randomUUID(), data, ts: Date.now() };
    await fetch('/api/realtime/publish', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ channel: `class:${roomId}`, msg }),
    });
  };

  return { messages, presence, state, send };
}
```

**Nota:** publish va por HTTP al backend (no desde el cliente directo). Backend valida ACL + guarda en DB + publica a Centrifugo. Así el canal queda read-only para clientes.

---

## 7. Cliente React Native — igual hook

```tsx
// idéntico pero con fetch + el SDK centrifuge soporta RN
import { Centrifuge } from 'centrifuge';
// En RN instalar: expo install centrifuge react-native-url-polyfill
import 'react-native-url-polyfill/auto';
```

Diferencias RN:
- `AppState` listener → al volver a foreground forzar reconnect si estado = disconnected
- Usar `NetInfo` para no intentar reconectar sin red (ahorra batería)
- WS backgrounded muere en iOS — aceptar disconnect y reconectar al foreground

```tsx
import { AppState } from 'react-native';
useEffect(() => {
  const sub = AppState.addEventListener('change', (s) => {
    if (s === 'active' && state === 'disconnected') centrifuge.connect();
  });
  return () => sub.remove();
}, [state]);
```

---

## 8. Idempotencia con `client_msg_id`

Problema: cliente manda msg → red se corta antes del ack → cliente reintenta → doble mensaje.

Solución: el cliente genera UUID v4 por mensaje; backend lo usa como PK de dedup.

```sql
-- PostgreSQL
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  client_msg_id UUID NOT NULL,
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  body JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (room_id, client_msg_id)
);
```

```ts
try {
  const saved = await db.messages.create({ data: msg });
  await publish(channel, saved);
} catch (e: any) {
  if (e.code === 'P2002') {
    const existing = await db.messages.findFirst({ where: { room_id, client_msg_id } });
    return existing; // dedup OK, responder como si hubiera sido el primero
  }
  throw e;
}
```

---

## 9. Heartbeat, reconexión, backpressure

### Heartbeat
- Server → ping cada 25-30s, timeout 60s
- Centrifugo/Socket.IO manejan solo; en gorilla hay que hacerlo (ver §5)

### Reconexión client-side
- Exponential backoff: 500ms → 1s → 2s → 4s → 8s → 16s → max 20-30s
- Jitter aleatorio ±30% para evitar thundering herd
- Centrifugo SDK lo hace built-in; Socket.IO también; nativo WS hay que implementar

### Backpressure (buffer lleno en server)
Dos políticas:
- **Drop oldest** → chat donde importa el último mensaje (presence, cursor moves)
- **Disconnect** → chat donde **no se puede perder nada** (es lo que hicimos en §5)

Regla: buffer >=32 mensajes. Si se llena = cliente lento o atacante → kick.

---

## 10. Rate limiting

Por conexión:
- Mensajes: 10/seg sostenido, burst 20 (token bucket)
- Joins: 5/seg
- Publishes: validar tamaño (max 8KB payload)

Por IP en el upgrade (pre-auth):
- Max N handshakes/min desde misma IP → redis counter con TTL
- Evita ataque de abrir 10k conexiones

---

## 11. Ejemplo completo: chat de aula Educabot

**Contexto:** 30 alumnos + 1 docente en sala `class:{classId}`, duración 45min.

### Canales
- `class:{classId}` → mensajes del chat, visible a todos
- `class:{classId}:presence` → quién está conectado
- `user:{userId}` → privado (DM del docente, notificaciones)

### Flow
```
1. Alumno abre aula → GET /api/realtime/token (backend valida sesión, firma JWT)
2. Cliente conecta a Centrifugo con token
3. Cliente pide subscribe token para class:XYZ → backend verifica enrollment
4. Cliente se suscribe → ve history_size=50 últimos mensajes (Centrifugo history)
5. Alumno envía mensaje → POST /api/realtime/publish → backend:
   a) valida sesión + rate limit
   b) guarda en DB con client_msg_id (dedup)
   c) publica a class:XYZ vía Centrifugo API
6. Todos en la sala reciben publication con el mensaje
7. Docente cierra sala → POST /api/classes/XYZ/close → backend publica {type:'closed'}
8. Clientes reciben + cierran UI
```

### Tabla moderación
- Mute: backend setea flag → rechaza publishes de ese user hasta expiry
- Kick: backend llama `disconnect` API de Centrifugo (`/api/disconnect` con user filter)
- Ban: ACL server-side → subscribe token falla

---

## 12. Observabilidad

Métricas (Prometheus):
```
ws_connections_active{tenant, room_kind}   gauge
ws_messages_sent_total{room_kind, type}    counter
ws_publish_latency_seconds                 histogram
ws_disconnects_total{reason}               counter  # normal|timeout|kicked|error
ws_rate_limited_total{tenant}              counter
ws_backpressure_kicks_total                counter
```

Logs estructurados: `conn_id`, `user_id`, `tenant_id`, `room`, `event`, `duration_ms`. Nunca loguear el payload completo (PII).

Alertas:
- `ws_connections_active` cae >30% en 5min → posible outage
- `ws_disconnects_total{reason="timeout"}` > baseline → problema de red
- Latencia publish p95 > 500ms → backplane saturado

---

## 13. Seguridad

- [ ] Auth JWT en handshake (query `?token=` o header `Sec-WebSocket-Protocol`)
- [ ] Token con `exp` corto (1h) + refresh
- [ ] Subscribe token separado con ACL por canal
- [ ] `CheckOrigin` estricto (no `true` wildcard)
- [ ] WSS obligatorio en prod (TLS 1.2+)
- [ ] Rate limit pre-auth por IP + post-auth por user
- [ ] Validar `ReadLimit` (4-16KB) para evitar DoS
- [ ] Payload size max server-side
- [ ] Sanitizar mensajes antes de broadcast (XSS si el front renderiza HTML)
- [ ] No broadcast de datos sensibles sin re-validar ACL
- [ ] Logs scrubbean tokens y PII
- [ ] Disconnect forzado al rotar password / logout

---

## 14. Anti-patterns

- ❌ WS sin auth en handshake — upgrade se hace, después rechazás → ya perdiste recursos
- ❌ Broadcast a todos los clientes (`io.emit`) en vez de a room — leak cross-tenant
- ❌ Cliente sin reconexión automática → UX rota con cualquier hiccup de red
- ❌ Mensajes críticos sin ack ni idempotencia → pérdidas o duplicados silenciosos
- ❌ Presence en memoria del nodo → al escalar horizontal, cada nodo ve distinto
- ❌ Sin Redis adapter / backplane → mensaje publicado en nodo A no llega al suscriptor en nodo B
- ❌ Sin sticky sessions con Socket.IO polling → handshake roto
- ❌ Trust del cliente para `userId` (`socket.emit('join', {userId: 42})`) — siempre del JWT
- ❌ `CheckOrigin: return true` en gorilla → CSRF-WS
- ❌ Buffer ilimitado en `send chan` → OOM con cliente lento
- ❌ Publish desde el cliente directo al canal → el backend deja de ser fuente de verdad
- ❌ No versionar el schema de eventos (`type: 'msg'`) — un día cambiás shape y rompés clientes viejos
- ❌ Cerrar conexión con `conn.Close()` sin enviar Close frame → cliente no sabe el motivo
- ❌ Ping/pong inventados en payload JSON en vez de usar el frame WS → más bytes, peor
- ❌ Reconectar sin backoff → thundering herd al caer el server

---

## 15. Checklist review

```markdown
- [ ] Provider elegido (Centrifugo / Socket.IO / gorilla) con rationale
- [ ] Auth JWT validada en handshake, antes del upgrade
- [ ] Subscribe token por canal con ACL server-side
- [ ] Rooms namespaced con tenantId (no leak cross-tenant)
- [ ] Sticky sessions en LB (si aplica)
- [ ] Redis adapter / Pub-Sub backplane configurado
- [ ] Presence con TTL en Redis (no memoria)
- [ ] Heartbeat ping/pong + reconexión exponencial client
- [ ] client_msg_id UUID + unique constraint en DB (idempotencia)
- [ ] Rate limit por conexión (msgs/seg + joins/seg)
- [ ] Payload size limit + ReadLimit server
- [ ] Backpressure policy definida (drop vs disconnect)
- [ ] Publish sólo server-side (clientes read-only en canales)
- [ ] Schema de eventos versionado (`{v: 1, type, data}`)
- [ ] WSS + CheckOrigin estricto
- [ ] Métricas conexiones/mensajes/latencia + alertas
- [ ] Logs sin PII, con conn_id trazable
- [ ] E2E test: conectar + join + msg + reconnect + dedup
- [ ] Disconnect forzado en logout / password rotation
- [ ] Mobile: AppState + NetInfo integrados (RN)
```

---

## 16. Output final

```
✅ Realtime Rooms — Educabot
   🔌 Centrifugo + Redis engine (scale horizontal) + Go/TS publishers
   🔐 JWT en handshake + subscribe tokens con ACL por canal
   🏠 Rooms: tenant:{id}:class:{classId} — presence con TTL, history 50 msgs
   💓 Heartbeat 25s / pong 60s / reconnect exponencial 0.5s→20s + jitter
   📨 Idempotencia: client_msg_id UUID + UNIQUE (room_id, client_msg_id)
   🚦 Rate limit 10 msg/s por conn + ReadLimit 4KB + backpressure=disconnect
   📡 Hook useRoom(roomId) en React + RN (AppState/NetInfo aware)
   📊 Métricas Prometheus: active/msgs/latency/disconnects + alertas

Próximos pasos:
  1. Load test con k6-ws (1k clients / 30 rooms)
  2. Chaos: matar 1 nodo WS → verificar failover vía backplane
  3. Evaluar history persistence en DB para auditoría pedagógica
```

## Delegación

**Coordinar con:** `websocket-specialist`, `backend-architect`, `react-engineer`, `react-native-engineer`, `go-engineer`, `node-engineer`, `sre-lead`, `security-architect`

**Reporta a:** `chief-technology-officer` + `vp-engineering`

**Skills relacionadas:**
- `/auth-setup` — JWT issuance y refresh usados en handshake
- `/observability-setup` — métricas Prometheus + Grafana dashboards
- `/secret-management` — JWT secret + Centrifugo API key en vault
- `/security-hardening` — CheckOrigin, TLS, rate limiting, scrubbing
- `/error-tracking` — Sentry con conn_id como tag
- `/deploy-check` — sticky sessions configuradas en LB pre-deploy
- `/incident` — runbook para caídas de WS / backplane
