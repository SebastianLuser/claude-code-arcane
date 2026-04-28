---
name: auth-strategy
description: "Auth decision guide: OAuth2/OIDC+PKCE, JWT rotation, RBAC/ABAC/ReBAC, token storage, revocation, MFA, sessions. Trigger: oauth, jwt, token, refresh, rbac, abac, permissions, roles, auth, multi-tenant, RLS, access control, login, session."
argument-hint: "[oauth|jwt|rbac|abac|session|mfa]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# auth-strategy — Authentication + Authorization Decision Guide

Pipeline: **Authentication** (who) -> **Token** (proof) -> **Authorization** (what they can do).

## 1. OAuth 2.0 / OIDC

| Flow | Use |
|------|-----|
| Auth Code + PKCE (S256) | Default for ALL clients (SPA, mobile, server) |
| Client Credentials | Server-to-server / M2M only |
| Implicit / Password Grant | NEVER — deprecated |

Always use PKCE even with client_secret. Validate `state` (CSRF), `nonce` (in id_token), `code_challenge` S256 (never plain), `redirect_uri` exact HTTPS (no wildcards). Verify id_token signature via JWKS + `iss` + `aud` + `exp` + `nonce`. Post-login: id_token is NOT a session token — create your own session.

## 2. JWT Strategy

| Algorithm | When | Avoid |
|-----------|------|-------|
| RS256 | Default, broad interop | — |
| EdDSA | Performance, smaller tokens | If consumers lack Ed25519 |
| HS256 | Single service only | Multi-service (shared secret) |
| `alg: none` | NEVER | — |

**Lifetimes:** Access 5-15 min. Refresh 7-30 days, rotated every use.

**Refresh rotation:** Track by `family_id`. On use: mark rotated, issue new with same family. Reuse of rotated token -> revoke entire family (theft detected).

**Revocation:** `user_version` claim (scales better — password/role change increments version) or blacklist `jti` with TTL (+1 cache hit/request).

**JWKS:** Expose `/.well-known/jwks.json`, rotate every 90 days with two active `kid`.

**Storage:**

| Platform | Access | Refresh |
|----------|--------|---------|
| Web SPA | In-memory (JS var) | HttpOnly+Secure+SameSite=Lax cookie |
| Mobile | SecureStore (Keychain/Keystore) | SecureStore |
| NEVER | localStorage, sessionStorage, AsyncStorage | — |

**Claims:** Only `sub` (UUID) + authorization claims. Never PII — especially with minors.

## 3. Authorization Model

| Model | When | Complexity |
|-------|------|------------|
| RBAC + tenant scope | Default (~80% of apps) | Low |
| ABAC (Casbin) | Dynamic context rules (time, state, resource props) | Medium |
| ReBAC (OpenFGA/SpiceDB) | Granular sharing (Google Docs-style) | High |

Start RBAC. Migrate to ABAC only when static roles can't express rules. Permission naming: `resource:action` (e.g., `post:write`). Never roles as permissions. Middleware order: auth -> tenant scope -> permission -> ownership (service layer). Ownership checks live in service layer (need business context). RLS is defense-in-depth (complements middleware, never replaces). Frontend auth is UX-only — backend ALWAYS validates. Cache permissions per user+tenant, TTL ~5 min, invalidate on role change.

## 4. MFA + Session Management

| MFA trigger | Method |
|-------------|--------|
| Admin/privileged roles | TOTP (broad support) |
| Phishing resistance needed | WebAuthn/passkeys |
| Sensitive actions (delete, export, payment) | Step-up re-prompt |

**Sessions:** Concurrent limits per user/tenant. Absolute expiry (24h) + idle timeout (30 min). Invalidate on password/role change. Server-side storage, client holds opaque ID only.

## 5. Anti-patterns

**OAuth:** Implicit/Password grant; no PKCE; unvalidated state/nonce/id_token; client_secret in frontend; wildcard redirect_uri; id_token as session.

**JWT:** HS256 multi-service; `alg: none`; access >1h; no refresh rotation; localStorage tokens; no revocation plan; no JWKS rotation; PII in claims.

**Authorization:** Frontend-only checks; missing tenant scoping; roles as permissions; ownership in middleware not service; cache without invalidation; super admin without audit log.

## 6. Checklist

- [ ] Auth Code + PKCE (S256), state + nonce validated
- [ ] id_token verified (JWKS + iss + aud + exp + nonce)
- [ ] redirect_uri exact HTTPS, client_secret backend-only
- [ ] Own session post-OAuth (not reusing id_token)
- [ ] RS256/EdDSA, access <=15min, refresh rotated with family tracking
- [ ] JWKS endpoint with 90-day rotation
- [ ] Revocation via blacklist jti or user_version
- [ ] Storage: HttpOnly cookie / in-memory / SecureStore per platform
- [ ] Permissions as resource:action, middleware: auth->scope->permission
- [ ] Ownership in service layer, RLS as defense-in-depth
- [ ] Permission cache with invalidation on role change
