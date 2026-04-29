---
name: web-security
description: "OWASP Top 10 audit, security headers y CSP para web apps (React+Vite, Go/TS backends)."
category: "security"
argument-hint: "[audit|csp|headers|owasp|full]"
user-invocable: true
allowed-tools: ["Read", "Grep", "Glob", "Bash"]
metadata:
  category: security
  sources:
    - OWASP Top 10 2021 (owasp.org/Top10)
    - OWASP Web Security Testing Guide v4.2
    - Mozilla Security Guidelines (infosec.mozilla.org/guidelines)
    - Content Security Policy Level 3 (W3C)
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

## Security Headers

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

## CSP Policy, Frontend Risks & Anti-patterns
→ Read `references/csp-and-frontend.md` for: CSP baseline policy, Vite+React SPA specifics, frontend XSS vectors, and the full 12-item anti-pattern checklist.

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

## Checklist

- [ ] All required security headers present and returning correct values (target A+ on securityheaders.com)
- [ ] CSP policy reviewed and validated with csp-evaluator.withgoogle.com (no unsafe-inline without nonce)
- [ ] Per-stack mitigations applied (semgrep/gosec/eslint-security scans clean, trivy image clean)
- [ ] No sensitive data leaked in error responses (stack traces, DB errors, internal paths hidden in prod)
- [ ] CORS configured with strict origin whitelist (no wildcard `*` with credentials)
- [ ] HSTS deployed with appropriate max-age and included in preload list if public-facing
