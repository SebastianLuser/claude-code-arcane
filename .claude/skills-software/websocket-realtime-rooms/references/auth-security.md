# Auth & Security — WebSocket Realtime

- JWT en handshake (query `?token=` o header), `exp` corto (1h) + refresh
- Subscribe token separado con ACL por canal (server-side validation)
- `CheckOrigin` estricto, WSS obligatorio en prod (TLS 1.2+)
- Rate limit pre-auth por IP + post-auth por user
- `ReadLimit` 4-16KB, payload size max server-side
- Sanitizar mensajes antes de broadcast (XSS)
- Disconnect forzado en logout/password rotation
