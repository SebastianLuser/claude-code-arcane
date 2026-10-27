# Auth Anti-patterns

| # | Don't | Do instead |
|---|-------|------------|
| 1 | Implicit grant or Password grant | Auth Code + PKCE (S256) always |
| 2 | PKCE skipped "because there is a client_secret" | PKCE + client_secret are independent — use both |
| 3 | Not validating `state`, `nonce` or the `id_token` signature | Validate everything: state (CSRF), nonce, JWKS signature, iss, aud, exp |
| 4 | `client_secret` in the frontend | Backend only; the frontend never holds secrets |
| 5 | `redirect_uri` with a wildcard | Exact HTTPS, no wildcards, no trailing slash |
| 6 | Using `id_token` as a session token | Post-login: create your own session; id_token is identity, not a session |
| 7 | HS256 in multi-service | RS256 / EdDSA with JWKS — each service verifies with the public key |
| 8 | `alg: none` | The library must reject it; explicit algorithm whitelist |
| 9 | Access token with exp >1h | Access ≤15 min; refresh 7-30 days, rotated on every use |
| 10 | Tokens in localStorage / AsyncStorage | In-memory (SPA) / HttpOnly cookie / SecureStore (mobile) |
| 11 | No revocation plan | Blacklist jti (Redis) or user_version in claims |
| 12 | PII in JWT claims | Only `sub` (UUID) + `tenant_id` + roles; never email/name of minors |
| 13 | Auth in the frontend only | The backend always validates — the frontend is UX only |
| 14 | Roles as permissions | Naming `resource:action`; roles group permissions |
| 15 | Ownership check in middleware | In the service layer, where the business context is |
| 16 | Permission cache without invalidation | Invalidate on role or password change |
| 17 | Super admin without an audit log | Heavy logging + an alert on every privileged action |
