---
name: oauth-setup
description: "OAuth 2.0 + OIDC for Educabot (Go/TS/React/RN). Authorization Code + PKCE, id_token validation, multi-provider (Google, Microsoft, Apple, GitHub)."
category: "security"
argument-hint: "[provider: google|github|generic] [stack]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# oauth-setup — OAuth 2.0 + OIDC

## Flows

| Flow | Use | Status |
|------|-----|--------|
| Authorization Code + PKCE | SPA, mobile, web server | **Default** |
| Authorization Code (client_secret) | Confidential backend | OK |
| Client Credentials | Server-to-server M2M | OK |
| Implicit / Password Grant | — | Deprecated |

**Rule: always Authorization Code + PKCE**, even with a client_secret (defense in depth).

## Providers

| Provider | Minimum scopes | Notes |
|----------|---------------|-------|
| **Google** (default) | `openid email profile` | `hd` claim for the school domain. +`classroom.rosters.readonly` if Classroom |
| **Microsoft** | `openid email profile User.Read` | Tenant-specific or `common` |
| **Apple** | `name email` | Required on iOS if there are other social logins. ES256, the email can be a relay |
| **GitHub** | `read:user user:email` | Not OIDC — parse /user. Internal staff only |

## Libraries

- **Go**: `golang.org/x/oauth2` + `github.com/coreos/go-oidc/v3`
- **Node/TS**: `openid-client` (avoid passport-*)
- **React+Vite**: `@react-oauth/google` (Google only) or a manual PKCE flow (multi-provider)
- **Expo**: `expo-auth-session`. **Bare RN**: `react-native-app-auth`

## PKCE

`code_verifier` = random 43-128 chars → `code_challenge` = base64url(sha256(verifier)). The client generates the verifier, sends the challenge in /authorize, sends the verifier in /token.

## Mandatory Security

| Parameter | Purpose | Validation |
|-----------|----------|------------|
| `state` | CSRF | Opaque random, store server-side, compare in the callback |
| `nonce` | Replay protection | Include in the request, verify in the id_token |
| `code_challenge` S256 | PKCE | See above |
| `redirect_uri` | Exact whitelist | Always HTTPS (except localhost dev) |

### id_token validation
Verify: signature (JWKS), exact `iss`, `aud` = client_id, `exp` not expired, `nonce` match, `hd` if Workspace.

## Post-OAuth Session

The id_token is NOT a session token. Create your own session:
- **Web**: httpOnly+Secure+SameSite=Lax cookie, sid → Redis/DB lookup
- **Mobile/SPA**: 15min JWT (in memory) + refresh token in httpOnly/secure storage

Never localStorage/sessionStorage for tokens.

## Account Linking

Verify `email_verified=true` → look up by email → ask the user for confirmation → store in `user_identities(user_id, provider, provider_sub)`. Do not auto-link without confirmation.

## Multi-tenant (school Workspace)

Validate the `hd` claim in the id_token server-side. Map via `schools(domain, tenant_id)`.

## Minors (COPPA/LGPD)

No individual registration of minors. Use Google Classroom rostering (a Workspace account managed by the school). Do not ask for extra data without parental consent.

## Anti-patterns
- Implicit/password grant, SPA without PKCE, no `state`, id_token as the session
- localStorage for tokens, wildcard redirect_uri, client_secret in the frontend
- Accepting an id_token without verifying it, trusting an email without email_verified, HTTP in a prod redirect_uri

## Checklist
- [ ] Authorization Code + PKCE (S256)
- [ ] `state` + `nonce` generated and validated
- [ ] id_token verified: signature, iss, aud, exp, nonce
- [ ] `email_verified=true` before trusting it
- [ ] Exact redirect_uri, HTTPS in prod
- [ ] client_secret only in the backend
- [ ] Own session after login (httpOnly cookie or secure JWT+refresh)
- [ ] Tokens NOT in localStorage
- [ ] Logout invalidates server-side
- [ ] Account linking with confirmation
- [ ] `hd` validated if school Workspace
- [ ] Minors via rostering, not individual registration
- [ ] Logs do NOT print tokens
