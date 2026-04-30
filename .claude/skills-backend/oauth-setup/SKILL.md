---
name: oauth-setup
description: "OAuth 2.0 + OIDC para Educabot (Go/TS/React/RN). Authorization Code + PKCE, id_token validation, multi-provider (Google, Microsoft, Apple, GitHub)."
category: "security"
argument-hint: "[provider: google|github|generic] [stack]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# oauth-setup — OAuth 2.0 + OIDC

## Flows

| Flow | Uso | Estado |
|------|-----|--------|
| Authorization Code + PKCE | SPA, mobile, web server | **Default** |
| Authorization Code (client_secret) | Backend confidencial | OK |
| Client Credentials | Server-to-server M2M | OK |
| Implicit / Password Grant | — | Deprecado |

**Regla: siempre Authorization Code + PKCE**, incluso con client_secret (defense in depth).

## Providers

| Provider | Scopes mínimos | Notas |
|----------|---------------|-------|
| **Google** (default) | `openid email profile` | `hd` claim para dominio escolar. +`classroom.rosters.readonly` si Classroom |
| **Microsoft** | `openid email profile User.Read` | Tenant-specific o `common` |
| **Apple** | `name email` | Requerido en iOS si hay otros social logins. ES256, email puede ser relay |
| **GitHub** | `read:user user:email` | No OIDC — parsear /user. Solo staff interno |

## Librerías

- **Go**: `golang.org/x/oauth2` + `github.com/coreos/go-oidc/v3`
- **Node/TS**: `openid-client` (evitar passport-*)
- **React+Vite**: `@react-oauth/google` (solo Google) o flow PKCE manual (multi-provider)
- **Expo**: `expo-auth-session`. **Bare RN**: `react-native-app-auth`

## PKCE

`code_verifier` = random 43-128 chars → `code_challenge` = base64url(sha256(verifier)). Cliente genera verifier, envía challenge en /authorize, envía verifier en /token.

## Seguridad Obligatoria

| Parámetro | Propósito | Validación |
|-----------|----------|------------|
| `state` | CSRF | Random opaco, guardar server-side, comparar en callback |
| `nonce` | Replay protection | Incluir en request, verificar en id_token |
| `code_challenge` S256 | PKCE | Ver arriba |
| `redirect_uri` | Whitelist exacto | HTTPS siempre (excepto localhost dev) |

### Validación id_token
Verificar: signature (JWKS), `iss` exacto, `aud` = client_id, `exp` no vencido, `nonce` match, `hd` si Workspace.

## Sesión Post-OAuth

id_token NO es session token. Crear sesión propia:
- **Web**: Cookie httpOnly+Secure+SameSite=Lax, sid → Redis/DB lookup
- **Mobile/SPA**: JWT 15min (en memoria) + refresh token httpOnly/secure storage

Nunca localStorage/sessionStorage para tokens.

## Account Linking

Verificar `email_verified=true` → buscar por email → pedir confirmación al usuario → guardar en `user_identities(user_id, provider, provider_sub)`. No auto-linkear sin confirmación.

## Multi-tenant (Workspace escolar)

Validar claim `hd` en id_token server-side. Mapear via `schools(domain, tenant_id)`.

## Menores (COPPA/LGPD)

No registro individual de menores. Usar Google Classroom rostering (cuenta Workspace gestionada por escuela). No pedir datos extra sin consentimiento parental.

## Anti-patterns
- Implicit/password grant, SPA sin PKCE, sin `state`, id_token como session
- localStorage para tokens, redirect_uri con wildcard, client_secret en frontend
- Aceptar id_token sin verificar, confiar email sin email_verified, HTTP en redirect_uri prod

## Checklist
- [ ] Authorization Code + PKCE (S256)
- [ ] `state` + `nonce` generados y validados
- [ ] id_token verificado: signature, iss, aud, exp, nonce
- [ ] `email_verified=true` antes de trust
- [ ] redirect_uri exacto, HTTPS en prod
- [ ] client_secret solo en backend
- [ ] Sesión propia post-login (httpOnly cookie o JWT+refresh seguro)
- [ ] Tokens NO en localStorage
- [ ] Logout invalida server-side
- [ ] Account linking con confirmación
- [ ] `hd` validado si Workspace escolar
- [ ] Menores via rostering, no registro individual
- [ ] Logs NO imprimen tokens
