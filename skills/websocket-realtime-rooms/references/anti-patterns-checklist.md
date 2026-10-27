# Anti-patterns & Checklist — WebSocket Realtime

## Anti-patterns

- WS without auth in the handshake, global broadcast (`io.emit`), no automatic reconnection
- No ack/idempotency, presence in the node's memory, no backplane
- No sticky sessions with Socket.IO, trusting the client for userId
- `CheckOrigin: return true`, unbounded buffer, publishing directly from the client
- No event schema versioning, Close without a frame, ping inside the JSON payload

## Checklist
- [ ] Provider chosen with a rationale
- [ ] JWT in the pre-upgrade handshake + per-channel subscribe token
- [ ] Rooms namespaced with tenantId
- [ ] Sticky sessions on the LB (if applicable)
- [ ] Redis adapter/Pub-Sub backplane
- [ ] Presence with TTL in Redis
- [ ] Heartbeat + exponential reconnection
- [ ] client_msg_id + unique constraint (idempotency)
- [ ] Per-connection rate limit + payload size limit
- [ ] Backpressure policy defined
- [ ] Server-side-only publish
- [ ] Versioned event schema
- [ ] WSS + strict CheckOrigin
- [ ] Metrics + alerts
- [ ] E2E test: connect -> join -> msg -> reconnect -> dedup
- [ ] Mobile: AppState + NetInfo
