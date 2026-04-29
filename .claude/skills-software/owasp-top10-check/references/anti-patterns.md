# Anti-patterns Frecuentes — OWASP Top 10

| # | No hacer | Hacer en cambio | OWASP |
|---|----------|-----------------|-------|
| 1 | Auth solo en frontend | Backend valida siempre | A01 |
| 2 | CORS `*` con credentials | Whitelist explicita de origenes | A01 |
| 3 | MD5/SHA1/SHA256 plano para passwords | Argon2id o bcrypt cost>=10 | A02 |
| 4 | JWT HS256 compartido entre servicios | RS256 / EdDSA con JWKS | A02 |
| 5 | `fmt.Sprintf` / concatenacion para queries SQL | Prepared statements siempre | A03 |
| 6 | `dangerouslySetInnerHTML` sin sanitizar | DOMPurify o no renderizar HTML externo | A03 |
| 7 | Sin rate limit en login/register/reset | 5 intentos/min por IP + lockout | A04, A07 |
| 8 | `NODE_ENV` / `GIN_MODE` no configurados en prod | prod mode explicito; debug endpoints deshabilitados | A05 |
| 9 | Dependencias sin auditar | `govulncheck` + `pnpm audit` en CI, Renovate habilitado | A06 |
| 10 | Tokens de reset multi-uso o con TTL largo | One-time, TTL <=30min, invalidar en uso | A07 |
| 11 | `npm install` en CI | `npm ci` — lockfile enforcement | A08 |
| 12 | Loggear passwords, tokens o PII | Structured logs con trace_id, sin datos sensibles | A09 |
| 13 | URL de usuario sin whitelist de dominio | Whitelist explicita + bloquear IPs privadas | A10 |

OWASP Top 10 es piso, no techo. Servicios criticos: complementar con ASVS Level 2+, threat modeling, pentest externo anual.
