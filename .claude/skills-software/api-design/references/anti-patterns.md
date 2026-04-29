# Anti-patterns - API Design

| # | No hacer | Hacer en cambio |
|---|----------|-----------------|
| 1 | Verbos en URLs (`/getUser`, `/createOrder`) | Sustantivos plurales: `GET /users`, `POST /orders` |
| 2 | Status 200 con cuerpo de error | Codigo HTTP correcto (400/401/404/500) + RFC 9457 body |
| 3 | Formato de error custom inventado | RFC 9457 Problem Details con `type`, `title`, `status`, `traceId` |
| 4 | OFFSET pagination en tablas grandes | Cursor keyset con `{ data, pagination: { cursor, hasMore } }` |
| 5 | Breaking change sin version bump | Bump a `/v2/`; mantener `/v1/` con Deprecation + Sunset headers |
| 6 | 3+ versiones vivas en paralelo | Max 2 versiones; sunset activo sobre la mas vieja |
| 7 | Stack traces en responses de produccion | Log interno con traceId; response solo incluye `traceId` |
| 8 | GraphQL sin limites de profundidad/complejidad | depth limit + query complexity scoring obligatorio |
| 9 | Webhooks sin firma HMAC | `X-Signature: sha256=<hmac>` + reject si delta timestamp >5min |
| 10 | OpenAPI mantenido a mano (drift con codigo) | Code-first (Zod+swagger) o spec-first con Spectral lint en CI |
