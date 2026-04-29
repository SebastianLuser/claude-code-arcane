# Anti-patterns & Checklist — CSP & Security Headers

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
