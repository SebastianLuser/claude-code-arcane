---
name: owasp-top10-check
description: "Auditoría OWASP Top 10 (2021) para stack Educabot (Go + TS, React + Vite, PostgreSQL). Datos de menores → LGPD/COPPA obligatorio."
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

Auditoría contra OWASP Top 10 2021. Go backend + TS/React frontend. Datos de menores → compliance LGPD/COPPA obligatorio.

## Categorías

### A01: Broken Access Control
- Middleware auth explícito en todos los endpoints
- Ownership check (`resource.user_id == session.user_id`) o RBAC/ABAC
- RLS en tablas con PII de alumnos. Frontend nunca es autoridad
- Delegar diseño permisos a `/rbac-abac`

### A02: Cryptographic Failures
- TLS 1.2+ obligatorio (1.3 preferido). HSTS habilitado
- Passwords: Argon2id o bcrypt cost≥10. Nunca MD5/SHA1/SHA256 plano
- JWT: RS256/EdDSA, no HS256 compartido. Secretos en Secret Manager
- PII de menores cifrada en reposo. Cookies: Secure+HttpOnly+SameSite
- Delegar a `/secret-management`, `/jwt-strategy`

### A03: Injection
- Siempre prepared statements/parametrización. Nunca `fmt.Sprintf` para queries
- ORM correcto — cuidado con `db.Raw()`, `$queryRawUnsafe`
- Input validation en boundary con structs tipados + validators (zod, go-playground/validator)
- OS commands con argv separado. No `dangerouslySetInnerHTML` sin sanitize

### A04: Insecure Design
- Threat model antes de implementar features sensibles
- Rate limit en endpoints unauth. Respuestas genéricas en auth (sin enumeración)
- Kill switches / feature flags. Datos distintos entre ambientes
- Delegar a `/rate-limiting`

### A05: Security Misconfiguration
- `NODE_ENV=production`, `GIN_MODE=release`. CORS whitelist estricta
- Security headers: CSP, X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy
- Buckets privados, URLs firmadas cortas. Debug endpoints deshabilitados en prod
- Docker: non-root, distroless/alpine, sin secrets en layers
- Delegar a `/csp-headers`

### A06: Vulnerable Components
- `govulncheck ./...` + `pnpm audit --audit-level=high` limpios
- Dependabot/Renovate habilitado. Lockfiles commiteados
- `trivy image` sin CRITICAL. Imágenes pinneadas por digest
- Delegar a `/deps-audit`

### A07: Auth Failures
- Rate limit agresivo en login/register/reset (5/min IP, 10/hora usuario)
- MFA para admin/docente (TOTP mínimo). Password ≥12 chars + leaked check
- Session IDs CSPRNG, regenerar post-login. Reset tokens one-time ≤30min
- Menores: sin social login sin consentimiento parental
- Delegar a `/mfa-setup`, `/oauth-setup`, `/jwt-strategy`

### A08: Integrity Failures
- Artefactos firmados (cosign). `npm ci` en CI (no `npm install`)
- No eval/Function() sobre input externo. Webhooks firmados HMAC
- Docker pinneado por digest. Branch protection + required reviewers

### A09: Logging & Monitoring
- Auth events loggeados. Audit log inmutable para acciones sensibles
- Structured JSON logs con trace_id. Nunca loggear passwords/tokens/PII
- Alertas: spikes 5xx, login fallidos masivos, geo inusuales
- Delegar a `/logging-setup`, `/audit-log`, `/error-tracking`

### A10: SSRF
- Whitelist dominios para outbound con user input
- Bloquear IPs privadas (10/172.16/192.168/127/169.254). Validar IP resuelta, no hostname
- Deshabilitar schemes peligrosos (file://, gopher://). Limitar redirects

## Herramientas

> → Read references/tools.md for tabla completa de herramientas SAST/Deps/Container/DAST/Secrets por stack

## Reporte Output

Formato: Resumen ejecutivo (hallazgos por severidad) → Hallazgos por categoría (archivo:línea, descripción, PoC, remediación, ticket Jira) → Plan priorizado → Herramientas ejecutadas.

## Educabot Specifics

Datos de menores: A01+A02 son críticos. LGPD/COPPA compliance obligatorio.

> → Read references/educabot-specifics.md for reglas PII menores, LGPD, COPPA, IA

## Anti-patterns

> → Read references/anti-patterns.md for tabla completa (13 items) con remediación por categoría OWASP

OWASP Top 10 es piso, no techo. Servicios críticos: complementar con ASVS Level 2+, threat modeling, pentest externo anual.

## Checklist

- [ ] All A01-A10 categories checked against the codebase with findings documented
- [ ] Findings classified by severity (Critical, High, Medium, Low, Info)
- [ ] Stack-specific mitigations verified (Go: gosec clean, TS: eslint-security clean, Docker: trivy clean)
- [ ] Remediation tickets created in Jira/ClickUp for High+ findings with clear repro steps
- [ ] Accepted risks documented with justification, owner, and review date
- [ ] PII/minor-data controls verified for LGPD/COPPA compliance (A01+A02 critical path)
