# CSP Policy & Frontend Security

## CSP Baseline

Strict baseline: `default-src 'self'; script-src 'self' 'nonce-{N}' 'strict-dynamic'; style-src 'self' 'nonce-{N}'; img-src 'self' data: <CDN>; connect-src 'self' <API>; font-src 'self' data:; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; report-uri <endpoint>`

`strict-dynamic` replaces domain whitelists (vulnerable to JSONP bypass). Nonces: 128-bit CSPRNG per request, never `Math.random`. Never combine `unsafe-inline` with nonces (browser ignores nonce).

**Vite+React SPA** (no SSR, static HTML): use `vite-plugin-csp-guard` for build-time SHA256 hashes, or reverse proxy nonce injection, or rely on `script-src 'self'` for Vite-hashed assets.

**Rollout**: report-only 2-4 weeks, analyze violations, then enforce. Never enforce new CSP directly in production.

## Frontend-Specific Risks (React + Vite + TS)

- **XSS vectors**: `dangerouslySetInnerHTML`, `href="javascript:..."`, ref-based DOM manipulation, unescaped SSR templates
- **Token storage**: HttpOnly cookies preferred; localStorage readable by any XSS
- **CSRF**: SameSite cookies + anti-CSRF token; verify Origin/Referer server-side
- **Bundle secrets**: never embed keys in client bundle (only `VITE_`-prefixed vars are bundled); use backend proxy
- **Dependency risk**: `npm audit` in CI; pin exact versions; review transitive deps

## Anti-Patterns

| # | Don't | Do instead |
|---|-------|------------|
| 1 | `unsafe-inline` or `unsafe-eval` in `script-src` | Per-request CSPRNG nonces or build-time SHA256 hashes |
| 2 | `*` in any CSP directive | Explicit origins + `strict-dynamic` |
| 3 | CSP only in a `<meta>` tag | HTTP header so it applies to every resource |
| 4 | CORS `*` with credentials | Explicit origin whitelist; never `*` with credentials |
| 5 | JWT in `localStorage` | In-memory (SPA) or HttpOnly cookie with SameSite=Lax |
| 6 | Nonces reused across requests | A new CSPRNG nonce (128-bit) for every request |
| 7 | Security headers only on some routes | Global middleware — never per-route |
| 8 | Secrets in the client bundle | `VITE_` prefix only for non-sensitive vars; secrets in the backend |
| 9 | `eval()` / `Function()` on external input | Remove it by design; if unavoidable, a strict sandbox |
| 10 | Auth only in the frontend | The backend always validates; the frontend is UX only |
| 11 | Logging tokens, passwords or PII | Structured logging without sensitive data; use trace_id |
| 12 | Enforced CSP straight to production without testing | report-only for 2-4 weeks → analyze → enforced |
