# Heartbeat, Reconexion, Backpressure

## Heartbeat
- Server ping cada 25-30s, timeout 60s

## Reconexion
- Exponential backoff 500ms->20s + jitter +/-30%
- Centrifugo/Socket.IO built-in

## Backpressure
- Buffer >=32 msgs
- Drop oldest (presence/cursors) o disconnect (chat sin perdida)

## Rate Limiting
- Mensajes: 10/seg sostenido, burst 20 (token bucket)
- Joins: 5/seg. Payload max 8KB
- Handshakes por IP: max N/min con Redis counter+TTL
