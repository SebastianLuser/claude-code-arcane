---
name: csp-headers
description: Configurar security headers (CSP, HSTS, Permissions-Policy, COOP/COEP) en backends Go/TS y Cloudflare. Prevenir XSS, clickjacking, MIME sniffing. Usar cuando se mencione CSP, Content-Security-Policy, security headers, HSTS, XSS, headers de seguridad, securityheaders.com.
argument-hint: "[stack: go|ts|cloudflare]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# CSP & Security Headers

Default deny, nonces en CSP, report-only antes de enforce. Stack: Go + TS backends, React+Vite frontends, Cloudflare CDN.

## Headers Críticos

| Header | Objetivo | Criticidad |
|---|---|---|
| `Content-Security-Policy` | Prevenir XSS, data exfiltration | ALTA |
| `Strict-Transport-Security` | Forzar HTTPS | ALTA |
| `X-Content-Type-Options: nosniff` | Evitar MIME sniffing | MEDIA |
| `Referrer-Policy: strict-origin-when-cross-origin` | No leak URLs | MEDIA |
| `Permissions-Policy` | Deshabilitar APIs no usadas (cam/mic/geo) | MEDIA |
| `Cross-Origin-Opener-Policy: same-origin` | Aislar browsing context | MEDIA |
| `X-Frame-Options: DENY` | Clickjacking (legacy; CSP frame-ancestors lo supera) | MEDIA |

`X-XSS-Protection` está **deprecado** — solo CSP.

## CSP Default Educabot

`default-src 'self'` + `script-src 'self' 'nonce-{RANDOM}' 'strict-dynamic'` + `style-src 'self' 'nonce-{RANDOM}'` + img/font/connect whitelists + `frame-ancestors 'none'` + `base-uri 'self'` + `form-action 'self'` + `upgrade-insecure-requests` + `report-uri`.

**Nonces:** 128-bit crypto-random por request. Inyectar en `<script nonce>` y `<style nonce>` server-side. NUNCA `unsafe-inline` junto con nonce.

**strict-dynamic:** scripts con nonce cargan otros dinámicamente. Reemplaza whitelist de dominios (débil contra JSONP bypass).

**Vite SPA (sin SSR):** `vite-plugin-csp-guard` (hashes SHA256 en build time), o proxy que inyecta nonce, o SSR con nonce por request.

## Report-Only → Enforce

1. **Report-only 2-4 semanas:** `Content-Security-Policy-Report-Only` + endpoint `/csp-report`
2. **Analizar:** agrupar por blocked-uri/violated-directive → whitelist/remover/mover
3. **Enforce:** `Content-Security-Policy`

## HSTS

`max-age=63072000; includeSubDomains; preload`. Empezar con max-age corto (300s), escalar. Preload: difícil salir (meses). Submit en hstspreload.org.

## Permissions-Policy

Default: `camera=(), microphone=(), geolocation=(), interest-cohort=()`. Apps educativas con webcam: `camera=(self), microphone=(self)`.

## Implementación

**Go:** middleware genera nonce (`crypto/rand`), inyecta en context + CSP header (nonce interpolado), setea todos los headers. Template accede nonce via context.

**TS (Express):** `helmet` con CSP override (useDefaults: false), nonce via `res.locals.cspNonce` (`crypto.randomBytes`), Permissions-Policy manual. `reportOnly` configurable via env.

**Cloudflare:** preferir headers desde origin (más testeable). Si necesario: Transform Rules (estáticos, no nonces) o Workers (nonces per-request + HTMLRewriter para inyectar).

## Iframes / Embedding

Educabot embebe contenido educativo: `frame-src 'self' youtube-nocookie.com view.genially.com classroom.google.com`. `frame-ancestors 'none'` salvo LMS externo (whitelist explícito).

## Testing

securityheaders.com (A+), csp-evaluator.withgoogle.com, hstspreload.org, `curl -I | grep`, DevTools Network headers, Console violations en report-only.

## Anti-patterns

- `unsafe-inline`/`unsafe-eval` en script-src, `*` en directivas
- CSP solo en `<meta>` (bypasseable), HSTS sin includeSubDomains
- Headers solo en algunas rutas (debe ser middleware global)
- No monitorear reports, enforce sin report-only phase
- `X-XSS-Protection: 1; mode=block` (deprecado)
- Whitelist dominios en vez de strict-dynamic, nonces con Math.random
- Mismo nonce entre requests, report-uri sin endpoint real

## Checklist

- [ ] CSP report-only 2-4 semanas antes de enforce
- [ ] Endpoint /csp-report existe con dashboard/alertas
- [ ] Nonces CSPRNG, sin unsafe-inline/unsafe-eval
- [ ] strict-dynamic en vez de whitelist dominios
- [ ] HSTS includeSubDomains + preload (si aplica)
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy, Permissions-Policy, frame-ancestors
- [ ] Headers como middleware global
- [ ] Score A+ en securityheaders.com
- [ ] X-XSS-Protection removido
- [ ] Cloudflare no duplica/pisa headers origin
- [ ] Dev/staging mismos headers que prod (solo report-only cambia)
