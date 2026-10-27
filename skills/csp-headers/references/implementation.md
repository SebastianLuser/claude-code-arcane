# Implementation Details — CSP & Security Headers

## Go
Middleware generates the nonce (`crypto/rand`), injects it into the context + CSP header (nonce interpolated), sets every header. The template reads the nonce via the context.

## TS (Express)
`helmet` with a CSP override (useDefaults: false), nonce via `res.locals.cspNonce` (`crypto.randomBytes`), manual Permissions-Policy. `reportOnly` configurable via env.

## Cloudflare
Prefer headers from the origin (more testable). If needed: Transform Rules (static, no nonces) or Workers (per-request nonces + HTMLRewriter to inject them).

## Iframes / Embedding

Educabot embeds educational content: `frame-src 'self' youtube-nocookie.com view.genially.com classroom.google.com`. `frame-ancestors 'none'` unless there is an external LMS (explicit whitelist).

## Testing

securityheaders.com (A+), csp-evaluator.withgoogle.com, hstspreload.org, `curl -I | grep`, DevTools Network headers, Console violations in report-only.
