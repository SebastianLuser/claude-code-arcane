---
name: csp-headers
description: "Configure security headers (CSP, HSTS, Permissions-Policy, COOP/COEP) for Go/TS backends and Cloudflare. Prevents XSS and clickjacking."
category: "security"
argument-hint: "[stack: go|ts|cloudflare]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# CSP & Security Headers

Default deny, nonces in CSP, report-only before enforce. Stack: Go + TS backends, React+Vite frontends, Cloudflare CDN.

## Critical Headers

| Header | Goal | Criticality |
|---|---|---|
| `Content-Security-Policy` | Prevent XSS, data exfiltration | HIGH |
| `Strict-Transport-Security` | Force HTTPS | HIGH |
| `X-Content-Type-Options: nosniff` | Avoid MIME sniffing | MEDIUM |
| `Referrer-Policy: strict-origin-when-cross-origin` | Do not leak URLs | MEDIUM |
| `Permissions-Policy` | Disable unused APIs (cam/mic/geo) | MEDIUM |
| `Cross-Origin-Opener-Policy: same-origin` | Isolate the browsing context | MEDIUM |
| `X-Frame-Options: DENY` | Clickjacking (legacy; CSP frame-ancestors supersedes it) | MEDIUM |

`X-XSS-Protection` is **deprecated** — CSP only.

## CSP Default Educabot

`default-src 'self'` + `script-src 'self' 'nonce-{RANDOM}' 'strict-dynamic'` + `style-src 'self' 'nonce-{RANDOM}'` + img/font/connect whitelists + `frame-ancestors 'none'` + `base-uri 'self'` + `form-action 'self'` + `upgrade-insecure-requests` + `report-uri`.

**Nonces:** 128-bit crypto-random per request. Inject into `<script nonce>` and `<style nonce>` server-side. NEVER `unsafe-inline` together with a nonce.

**strict-dynamic:** scripts with a nonce load others dynamically. Replaces the domain whitelist (weak against JSONP bypass).

**Vite SPA (no SSR):** `vite-plugin-csp-guard` (SHA256 hashes at build time), or a proxy that injects the nonce, or SSR with a per-request nonce.

## Report-Only → Enforce

1. **Report-only for 2-4 weeks:** `Content-Security-Policy-Report-Only` + endpoint `/csp-report`
2. **Analyze:** group by blocked-uri/violated-directive → whitelist/remove/move
3. **Enforce:** `Content-Security-Policy`

## HSTS

`max-age=63072000; includeSubDomains; preload`. Start with a short max-age (300s), then scale up. Preload: hard to get out of (months). Submit at hstspreload.org.

## Permissions-Policy

Default: `camera=(), microphone=(), geolocation=(), interest-cohort=()`. Educational apps with a webcam: `camera=(self), microphone=(self)`.

> → Read references/implementation.md for Go, TS, Cloudflare implementation details, iframe/embedding config, testing tools

> → Read references/anti-patterns-checklist.md for anti-patterns and pre-deployment checklist
