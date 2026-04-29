---
name: csp-headers
description: "Configure security headers (CSP, HSTS, Permissions-Policy, COOP/COEP) for Go/TS backends and Cloudflare. Prevents XSS and clickjacking."
category: "security"
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

> → Read references/implementation.md for Go, TS, Cloudflare implementation details, iframe/embedding config, testing tools

> → Read references/anti-patterns-checklist.md for anti-patterns and pre-deployment checklist
