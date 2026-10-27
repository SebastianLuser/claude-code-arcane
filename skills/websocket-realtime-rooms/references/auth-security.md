# Auth & Security — WebSocket Realtime

- JWT in the handshake (query `?token=` or header), short `exp` (1h) + refresh
- Separate subscribe token with per-channel ACL (server-side validation)
- Strict `CheckOrigin`, WSS mandatory in prod (TLS 1.2+)
- Pre-auth rate limit per IP + post-auth per user
- `ReadLimit` 4-16KB, server-side max payload size
- Sanitize messages before broadcasting (XSS)
- Forced disconnect on logout/password rotation
