---
name: auth-strategy
description: "Auth decision guide: OAuth2/OIDC+PKCE, JWT rotation, RBAC/ABAC/ReBAC, token storage, revocation, MFA, sessions."
category: "security"
argument-hint: "[oauth|jwt|rbac|abac|session|mfa]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
metadata:
  category: security
  sources:
    - OAuth 2.0 RFC 6749
    - PKCE RFC 7636
    - OpenID Connect Core 1.0
    - JWT Best Practices RFC 8725
    - NIST SP 800-63B (Digital Identity Guidelines)
---
# auth-strategy — Authentication + Authorization Decision Guide

## MANDATORY WORKFLOW

**Antes de recomendar o implementar cualquier estrategia de auth, completar estos pasos en orden.**

### Step 0: Gather Requirements

Clarificar (o inferir del contexto si ya fue especificado):

1. **Stack:** Go + TS / pure TS / otro
2. **¿Auth nueva o migración de existente?** (si es migración, revisar implementación actual)
3. **¿Multi-tenant?** → define si necesita tenant scope en tokens y middleware
4. **¿OAuth provider externo** (Google, GitHub, etc.) **o auth propio?**
5. **¿MFA requerido?** ¿Para todos o solo roles admin/privilegiados?

Si el usuario ya especificó estos valores, saltar directamente al Step 1.

### Step 1: Recomendar estrategia

Usar las tablas de OAuth / JWT / Authorization más abajo.
Elegir el modelo correcto para el contexto. Explicar en 1-2 oraciones por qué.

### Step 2: Implementar + Verificar

Implementar. Al terminar, validar contra el Checklist al final de este documento.

---

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

## Anti-patterns
→ Read `references/anti-patterns.md` for the full 17-item checklist.

## Checklist

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
