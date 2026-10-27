---
name: owasp-top10-check
description: "OWASP Top 10 (2021) audit for the Educabot stack (Go + TS, React + Vite, PostgreSQL). Minors' data → LGPD/COPPA mandatory."
category: "security"
argument-hint: "[category 1-10 | all]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Task
metadata:
  category: security
  sources:
    - OWASP Top 10 2021 (owasp.org/Top10)
    - OWASP Web Security Testing Guide v4.2
    - LGPD Lei 13.709/2018 (Brazil)
    - COPPA (FTC, USA)
---
# OWASP Top 10 Check — Educabot

Audit against the OWASP Top 10 2021. Go backend + TS/React frontend. Minors' data → LGPD/COPPA compliance is mandatory.

## Categories

### A01: Broken Access Control
- Explicit auth middleware on every endpoint
- Ownership check (`resource.user_id == session.user_id`) or RBAC/ABAC
- RLS on tables with student PII. The frontend is never the authority
- Delegate permission design to `/rbac-abac`

### A02: Cryptographic Failures
- TLS 1.2+ mandatory (1.3 preferred). HSTS enabled
- Passwords: Argon2id or bcrypt cost≥10. Never plain MD5/SHA1/SHA256
- JWT: RS256/EdDSA, not a shared HS256. Secrets in a Secret Manager
- Minors' PII encrypted at rest. Cookies: Secure+HttpOnly+SameSite
- Delegate to `/secret-management`, `/jwt-strategy`

### A03: Injection
- Always prepared statements/parameterization. Never `fmt.Sprintf` for queries
- Correct ORM use — careful with `db.Raw()`, `$queryRawUnsafe`
- Input validation at the boundary with typed structs + validators (zod, go-playground/validator)
- OS commands with a separate argv. No `dangerouslySetInnerHTML` without sanitizing

### A04: Insecure Design
- Threat model before implementing sensitive features
- Rate limit on unauthenticated endpoints. Generic responses in auth (no enumeration)
- Kill switches / feature flags. Different data per environment
- Delegate to `/rate-limiting`

### A05: Security Misconfiguration
- `NODE_ENV=production`, `GIN_MODE=release`. Strict CORS whitelist
- Security headers: CSP, X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy
- Private buckets, short-lived signed URLs. Debug endpoints disabled in prod
- Docker: non-root, distroless/alpine, no secrets in layers
- Delegate to `/csp-headers`

### A06: Vulnerable Components
- `govulncheck ./...` + `pnpm audit --audit-level=high` clean
- Dependabot/Renovate enabled. Lockfiles committed
- `trivy image` without CRITICAL. Images pinned by digest
- Delegate to `/deps-audit`

### A07: Auth Failures
- Aggressive rate limit on login/register/reset (5/min per IP, 10/hour per user)
- MFA for admin/teacher (TOTP at minimum). Password ≥12 chars + leaked check
- CSPRNG session IDs, regenerated after login. One-time reset tokens ≤30min
- Minors: no social login without parental consent
- Delegate to `/mfa-setup`, `/oauth-setup`, `/jwt-strategy`

### A08: Integrity Failures
- Signed artifacts (cosign). `npm ci` in CI (not `npm install`)
- No eval/Function() over external input. HMAC-signed webhooks
- Docker pinned by digest. Branch protection + required reviewers

### A09: Logging & Monitoring
- Auth events logged. Immutable audit log for sensitive actions
- Structured JSON logs with trace_id. Never log passwords/tokens/PII
- Alerts: 5xx spikes, mass failed logins, unusual geos
- Delegate to `/logging-setup`, `/audit-log`, `/error-tracking`

### A10: SSRF
- Domain whitelist for outbound calls with user input
- Block private IPs (10/172.16/192.168/127/169.254). Validate the resolved IP, not the hostname
- Disable dangerous schemes (file://, gopher://). Limit redirects

## Tools

> → Read references/tools.md for the full table of SAST/Deps/Container/DAST/Secrets tools per stack

## Report Output

Format: Executive summary (findings by severity and verdict: **FAIL** if there is any Critical or High finding, **CONCERNS** if only Medium or Low remain, **PASS** if there is nothing actionable) → Findings per category (file:line, description, PoC, remediation, Jira ticket) → Prioritized plan → Tools executed.

## Educabot Specifics

Minors' data: A01+A02 are critical. LGPD/COPPA compliance is mandatory.

> → Read references/educabot-specifics.md for the rules on minors' PII, LGPD, COPPA, AI

## Anti-patterns

> → Read references/anti-patterns.md for the full table (13 items) with remediation per OWASP category

OWASP Top 10 is a floor, not a ceiling. Critical services: complement it with ASVS Level 2+, threat modeling, an annual external pentest.

## Checklist

- [ ] All A01-A10 categories checked against the codebase with findings documented
- [ ] Findings classified by severity (Critical, High, Medium, Low, Info)
- [ ] Stack-specific mitigations verified (Go: gosec clean, TS: eslint-security clean, Docker: trivy clean)
- [ ] Remediation tickets created in Jira/ClickUp for High+ findings with clear repro steps
- [ ] Accepted risks documented with justification, owner, and review date
- [ ] PII/minor-data controls verified for LGPD/COPPA compliance (A01+A02 critical path)
