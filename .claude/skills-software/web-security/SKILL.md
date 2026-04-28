---
name: web-security
description: "OWASP Top 10 audit and security headers for web applications"
argument-hint: "[audit|csp|headers|owasp|full]"
user-invocable: true
allowed-tools: ["Read", "Grep", "Glob", "Bash"]
---
# Web Security -- OWASP Top 10 & Security Headers

Decision guide and audit checklist. Stack: React + Vite + TS frontend, Go/TS backends, PostgreSQL, GCP/AWS.

Use for: pre-deploy security review, quarterly audits, pentest prep, CSP migration, incident follow-up.

---

## OWASP Top 10 Quick-Check (2021)

| # | Category | Verify |
|---|----------|--------|
| A01 | Broken Access Control | Every endpoint has explicit auth middleware; ownership checked server-side; RLS on PII tables; CORS strict whitelist |
| A02 | Cryptographic Failures | TLS 1.2+; passwords Argon2id/bcrypt(cost>=10); JWT RS256/EdDSA; secrets in Secret Manager; PII encrypted at rest; cookies Secure+HttpOnly+SameSite |
| A03 | Injection | Parameterized queries only; ORM raw queries audited; no `dangerouslySetInnerHTML` without sanitization; zod/validator on input boundary |
| A04 | Insecure Design | Threat model for sensitive features; rate limit on unauth endpoints; generic auth errors (no user enumeration); kill switches |
| A05 | Security Misconfiguration | Prod mode on; CORS whitelist (never `*` with credentials); security headers present; debug endpoints gated; Docker non-root+distroless |
| A06 | Vulnerable Components | `npm audit`/`govulncheck` clean; Dependabot/Renovate on; lockfiles committed; Docker images pinned by digest |
| A07 | Auth Failures | Rate limit login/register/reset; MFA for admin; session regenerated post-login; reset tokens single-use <=30min |
| A08 | Integrity Failures | `npm ci` in CI; no `eval`/`Function()` on external input; webhooks HMAC-verified; build artifacts signed |
| A09 | Logging & Monitoring | Auth events logged; structured JSON with trace ID; never log tokens/passwords/PII; alerts on 5xx spikes |
| A10 | SSRF | User-supplied URLs validated against domain whitelist; private IPs blocked; DNS resolved once then IP checked |

---

## Security Headers Checklist

| Header | Value | Priority |
|--------|-------|----------|
| `Content-Security-Policy` | See CSP section | HIGH |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HIGH |
| `X-Content-Type-Options` | `nosniff` | MEDIUM |
| `X-Frame-Options` | `DENY` (legacy; CSP `frame-ancestors` supersedes) | MEDIUM |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | MEDIUM |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | MEDIUM |
| `Cross-Origin-Opener-Policy` | `same-origin` | MEDIUM |

Remove `X-XSS-Protection` (deprecated). Apply all headers as **global middleware**, never per-route.

HSTS rollout: start with short `max-age` (300s), escalate to 2 years, then submit to hstspreload.org. Removal from preload list takes months.

---

## CSP Policy Decisions

Strict baseline: `default-src 'self'; script-src 'self' 'nonce-{N}' 'strict-dynamic'; style-src 'self' 'nonce-{N}'; img-src 'self' data: <CDN>; connect-src 'self' <API>; font-src 'self' data:; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; report-uri <endpoint>`

`strict-dynamic` replaces domain whitelists (vulnerable to JSONP bypass). Nonces: 128-bit CSPRNG per request, never `Math.random`. Never combine `unsafe-inline` with nonces (browser ignores nonce).

**Vite+React SPA** (no SSR, static HTML): use `vite-plugin-csp-guard` for build-time SHA256 hashes, or reverse proxy nonce injection, or rely on `script-src 'self'` for Vite-hashed assets.

**Rollout**: report-only 2-4 weeks, analyze violations, then enforce. Never enforce new CSP directly in production.

---

## Frontend-Specific Risks (React + Vite + TS)

- **XSS vectors**: `dangerouslySetInnerHTML`, `href="javascript:..."`, ref-based DOM manipulation, unescaped SSR templates
- **Token storage**: HttpOnly cookies preferred; localStorage readable by any XSS
- **CSRF**: SameSite cookies + anti-CSRF token; verify Origin/Referer server-side
- **Bundle secrets**: never embed keys in client bundle (only `VITE_`-prefixed vars are bundled); use backend proxy
- **Dependency risk**: `npm audit` in CI; pin exact versions; review transitive deps

---

## Anti-Patterns

- `unsafe-inline`/`unsafe-eval` in `script-src`; `*` in any CSP directive; CSP only in `<meta>` tag
- CORS `*` with credentials; JWT in `localStorage` without XSS mitigation
- Nonces reused across requests or from weak PRNG; `report-uri` with no persisting endpoint
- Secrets client-side (localStorage, bundle, non-HttpOnly cookies); `eval()`/`Function()` on user input
- Headers on some routes only; frontend role checks as sole authorization; logging tokens/passwords/PII

---

## Tooling

| Purpose | Tools |
|---------|-------|
| SAST | semgrep (owasp-top-ten, security-audit), gosec, eslint-plugin-security |
| Deps | npm audit, govulncheck, trivy fs, snyk, grype |
| Containers | trivy image, docker scout |
| Secrets | gitleaks, trufflehog |
| Headers | securityheaders.com (target A+), csp-evaluator.withgoogle.com |
| DAST | OWASP ZAP, Burp Suite |

---

## When to Escalate

- **Pentest**: auth/payment flows, PII of minors (COPPA/LGPD), public-facing launch
- **Compliance**: SOC2/LGPD/COPPA demand documented controls beyond this checklist
- **Incident**: active breach -- follow incident process, not this audit
- **Threat modeling**: complex trust boundaries need STRIDE before implementation
- **CSP breaks prod**: revert to report-only immediately; analyze before re-enforcing
