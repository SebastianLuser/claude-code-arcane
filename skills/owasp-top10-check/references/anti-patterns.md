# Common Anti-patterns — OWASP Top 10

| # | Do not | Do instead | OWASP |
|---|----------|-----------------|-------|
| 1 | Auth only in the frontend | The backend always validates | A01 |
| 2 | CORS `*` with credentials | Explicit origin whitelist | A01 |
| 3 | Plain MD5/SHA1/SHA256 for passwords | Argon2id or bcrypt cost>=10 | A02 |
| 4 | JWT HS256 shared between services | RS256 / EdDSA with JWKS | A02 |
| 5 | `fmt.Sprintf` / concatenation for SQL queries | Prepared statements always | A03 |
| 6 | `dangerouslySetInnerHTML` without sanitizing | DOMPurify or do not render external HTML | A03 |
| 7 | No rate limit on login/register/reset | 5 attempts/min per IP + lockout | A04, A07 |
| 8 | `NODE_ENV` / `GIN_MODE` not set in prod | Explicit prod mode; debug endpoints disabled | A05 |
| 9 | Unaudited dependencies | `govulncheck` + `pnpm audit` in CI, Renovate enabled | A06 |
| 10 | Multi-use reset tokens or with a long TTL | One-time, TTL <=30min, invalidate on use | A07 |
| 11 | `npm install` in CI | `npm ci` — lockfile enforcement | A08 |
| 12 | Logging passwords, tokens or PII | Structured logs with trace_id, no sensitive data | A09 |
| 13 | User URL without a domain whitelist | Explicit whitelist + block private IPs | A10 |

OWASP Top 10 is a floor, not a ceiling. Critical services: complement it with ASVS Level 2+, threat modeling, an annual external pentest.
