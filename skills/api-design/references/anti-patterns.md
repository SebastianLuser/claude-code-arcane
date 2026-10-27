# Anti-patterns - API Design

| # | Don't | Do instead |
|---|----------|-----------------|
| 1 | Verbs in URLs (`/getUser`, `/createOrder`) | Plural nouns: `GET /users`, `POST /orders` |
| 2 | Status 200 with an error body | Correct HTTP code (400/401/404/500) + RFC 9457 body |
| 3 | Invented custom error format | RFC 9457 Problem Details with `type`, `title`, `status`, `traceId` |
| 4 | OFFSET pagination on large tables | Cursor keyset with `{ data, pagination: { cursor, hasMore } }` |
| 5 | Breaking change without a version bump | Bump to `/v2/`; keep `/v1/` with Deprecation + Sunset headers |
| 6 | 3+ live versions in parallel | Max 2 versions; active sunset on the oldest |
| 7 | Stack traces in production responses | Internal log with traceId; the response only includes `traceId` |
| 8 | GraphQL without depth/complexity limits | Mandatory depth limit + query complexity scoring |
| 9 | Webhooks without an HMAC signature | `X-Signature: sha256=<hmac>` + reject if the timestamp delta is >5min |
| 10 | Hand-maintained OpenAPI (drifts from the code) | Code-first (Zod+swagger) or spec-first with Spectral lint in CI |
