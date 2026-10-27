# Heartbeat, Reconnection, Backpressure

## Heartbeat
- Server ping every 25-30s, timeout 60s

## Reconnection
- Exponential backoff 500ms->20s + jitter +/-30%
- Centrifugo/Socket.IO built-in

## Backpressure
- Buffer >=32 msgs
- Drop oldest (presence/cursors) or disconnect (chat with no loss)

## Rate Limiting
- Messages: 10/sec sustained, burst 20 (token bucket)
- Joins: 5/sec. Payload max 8KB
- Handshakes per IP: max N/min with a Redis counter+TTL
