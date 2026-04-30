# Auth Anti-patterns

| # | Don't | Do instead |
|---|-------|------------|
| 1 | Implicit grant o Password grant | Auth Code + PKCE (S256) siempre |
| 2 | PKCE omitido "porque hay client_secret" | PKCE + client_secret son independientes — usar ambos |
| 3 | No validar `state`, `nonce` o `id_token` signature | Validar todo: state (CSRF), nonce, JWKS signature, iss, aud, exp |
| 4 | `client_secret` en frontend | Solo en backend; frontend nunca tiene secrets |
| 5 | `redirect_uri` con wildcard | HTTPS exacto, sin wildcards, sin trailing slash |
| 6 | Usar `id_token` como session token | Post-login: crear sesión propia; id_token es identidad, no sesión |
| 7 | HS256 en multi-service | RS256 / EdDSA con JWKS — cada servicio verifica con public key |
| 8 | `alg: none` | Librería debe rechazarlo; whitelist explícita de algoritmos |
| 9 | Access token con exp >1h | Access ≤15 min; refresh 7-30 días rotado en cada uso |
| 10 | Tokens en localStorage / AsyncStorage | In-memory (SPA) / HttpOnly cookie / SecureStore (mobile) |
| 11 | Sin plan de revocación | Blacklist jti (Redis) o user_version en claims |
| 12 | PII en JWT claims | Solo `sub` (UUID) + `tenant_id` + roles; nunca email/nombre de menores |
| 13 | Auth solo en frontend | Backend valida siempre — frontend es UX solamente |
| 14 | Roles como permisos | Naming `resource:action`; roles agrupan permisos |
| 15 | Ownership check en middleware | En capa de servicio donde hay contexto de negocio |
| 16 | Cache de permisos sin invalidación | Invalidar en cambio de rol o password |
| 17 | Super admin sin audit log | Logging intenso + alerta en cada acción privilegiada |
