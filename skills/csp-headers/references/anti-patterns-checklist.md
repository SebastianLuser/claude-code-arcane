# Anti-patterns & Checklist — CSP & Security Headers

## Anti-patterns

- `unsafe-inline`/`unsafe-eval` in script-src, `*` in directives
- CSP only in `<meta>` (bypassable), HSTS without includeSubDomains
- Headers only on some routes (must be global middleware)
- Not monitoring reports, enforcing without a report-only phase
- `X-XSS-Protection: 1; mode=block` (deprecated)
- Domain whitelist instead of strict-dynamic, nonces with Math.random
- Same nonce across requests, report-uri without a real endpoint

## Checklist

- [ ] CSP report-only for 2-4 weeks before enforce
- [ ] /csp-report endpoint exists with a dashboard/alerts
- [ ] CSPRNG nonces, no unsafe-inline/unsafe-eval
- [ ] strict-dynamic instead of a domain whitelist
- [ ] HSTS includeSubDomains + preload (if applicable)
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy, Permissions-Policy, frame-ancestors
- [ ] Headers as global middleware
- [ ] A+ score on securityheaders.com
- [ ] X-XSS-Protection removed
- [ ] Cloudflare does not duplicate/overwrite origin headers
- [ ] Dev/staging have the same headers as prod (only report-only changes)
