# Anti-patterns — JWT Strategy

| # | Don't | Do instead |
|---|----------|-----------------|
| 1 | `alg: none` or HS256 across multiple services | RS256 / EdDSA with a public JWKS |
| 2 | Access token with exp >1h | Access <=15 min, refresh 7-30 days rotated |
| 3 | Refresh without rotation or reuse detection | Rotate on every use + revoke the family if reuse is detected |
| 4 | Hardcoded public key | JWKS endpoint `/.well-known/jwks.json` with 2 active kids |
| 5 | Not validating `aud` / `iss` | Always validate — prevents accepting another service's tokens |
| 6 | PII (email, name, DNI) in claims | Only `sub` (UUID) + `tenant_id` + roles; never minors' PII |
| 7 | `jwt-decode` on the client for logic | Only for UI (display); validation is always server-side |
| 8 | No revocation plan | jti blacklist in Redis or user_version in the claims |
| 9 | `jsonwebtoken` in TS | Use `jose` (JWKS support, async, modern) |
| 10 | Tokens in localStorage / AsyncStorage | In-memory (SPA) / HttpOnly cookie / SecureStore (RN) |
| 11 | `tenant_id` as a query param or in the body | Always in the JWT claims; the backend validates |
| 12 | Rotating JWKS without overlap | Keep 2 active kids for 90 days; issue with the new one, validate with both |
