# Anti-patterns & Checklist — WebSocket Realtime

## Anti-patterns

- WS sin auth en handshake, broadcast global (`io.emit`), sin reconexion automatica
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
- [ ] Heartbeat + reconexion exponencial
- [ ] client_msg_id + unique constraint (idempotencia)
- [ ] Rate limit por conexion + payload size limit
- [ ] Backpressure policy definida
- [ ] Publish server-side only
- [ ] Schema de eventos versionado
- [ ] WSS + CheckOrigin estricto
- [ ] Metricas + alertas
- [ ] E2E test: connect -> join -> msg -> reconnect -> dedup
- [ ] Mobile: AppState + NetInfo
