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
| 1 | `unsafe-inline` o `unsafe-eval` en `script-src` | Nonces CSPRNG por request o hashes SHA256 en build-time |
| 2 | `*` en cualquier directiva de CSP | Orígenes explícitos + `strict-dynamic` |
| 3 | CSP solo en `<meta>` tag | Header HTTP para que aplique a todos los recursos |
| 4 | CORS `*` con credentials | Whitelist explícita de orígenes; nunca `*` con credenciales |
| 5 | JWT en `localStorage` | In-memory (SPA) o HttpOnly cookie con SameSite=Lax |
| 6 | Nonces reutilizados entre requests | Nuevo nonce CSPRNG (128-bit) por cada request |
| 7 | Headers de seguridad solo en algunas rutas | Middleware global — nunca per-route |
| 8 | Secrets en el bundle del cliente | Solo `VITE_`-prefix para vars no sensibles; secrets en backend |
| 9 | `eval()` / `Function()` sobre input externo | Eliminar por diseño; si inevitable, sandbox estricto |
| 10 | Auth solo en frontend | Backend valida siempre; frontend es UX solamente |
| 11 | Loggear tokens, passwords o PII | Structured logging sin datos sensibles; usar trace_id |
| 12 | Enforced CSP directo en producción sin prueba | report-only 2-4 semanas → analizar → enforced |
