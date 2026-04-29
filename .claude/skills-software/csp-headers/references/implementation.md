# Implementation Details — CSP & Security Headers

## Go
Middleware genera nonce (`crypto/rand`), inyecta en context + CSP header (nonce interpolado), setea todos los headers. Template accede nonce via context.

## TS (Express)
`helmet` con CSP override (useDefaults: false), nonce via `res.locals.cspNonce` (`crypto.randomBytes`), Permissions-Policy manual. `reportOnly` configurable via env.

## Cloudflare
Preferir headers desde origin (mas testeable). Si necesario: Transform Rules (estaticos, no nonces) o Workers (nonces per-request + HTMLRewriter para inyectar).

## Iframes / Embedding

Educabot embebe contenido educativo: `frame-src 'self' youtube-nocookie.com view.genially.com classroom.google.com`. `frame-ancestors 'none'` salvo LMS externo (whitelist explicito).

## Testing

securityheaders.com (A+), csp-evaluator.withgoogle.com, hstspreload.org, `curl -I | grep`, DevTools Network headers, Console violations en report-only.
