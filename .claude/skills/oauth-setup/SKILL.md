---
name: oauth-setup
description: "Configurar autenticación OAuth 2.0 + OIDC en proyectos Educabot (Go, Node/TS, React+Vite, React Native). Authorization Code + PKCE como flow default, validación de id_token, manejo de sesión propia, multi-provider (Google, Microsoft, Apple, Facebook, GitHub). Usar cuando se mencione: OAuth, OIDC, login social, Google login, Microsoft login, Apple Sign-In, SSO, autenticación federada, PKCE, id_token, authorization code."
argument-hint: "[provider: google|github|generic] [stack]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# OAuth Setup — Educabot

Guía para implementar autenticación OAuth 2.0 + OpenID Connect (OIDC) en productos Educabot (LatAm EdTech: padres, docentes, estudiantes, escuelas).

## Cuándo usar

- Agregar login social (Google, Microsoft, Apple) a un producto nuevo o existente
- Integrar con Google Workspace escolar (Classroom, hosted domain)
- Implementar SSO corporativo/escolar
- Revisar/auditar una implementación OAuth existente

## NO usar

- Si solo necesitás auth local con email/password → no es OAuth, usá tu auth interna
- Si el proveedor expone **solo** API keys (no OAuth) → no aplica
- Para autorización fina entre microservicios internos → considerá mTLS o JWT firmado internamente (client_credentials sí aplica si hay un IdP común)

---

## 1. Conceptos base

**OAuth 2.0** = framework de autorización (access_token para llamar APIs).
**OIDC (OpenID Connect)** = capa de identidad sobre OAuth 2.0 (id_token JWT con claims del usuario).

Para login usamos **OIDC** siempre. OAuth 2.0 puro (sin OIDC) solo si necesitás acceso a API del provider sin identidad (raro).

### Flows

| Flow | Uso | Estado |
|------|-----|--------|
| Authorization Code + PKCE | SPA, mobile, web server | ✅ Default |
| Authorization Code (con client_secret) | Backend web server confidencial | ✅ OK |
| Client Credentials | Server-to-server (M2M) | ✅ OK |
| Implicit | — | ❌ Deprecado (RFC 9700) |
| Password Grant (ROPC) | — | ❌ Deprecado |
| Device Code | TVs, CLI sin browser | ✅ Nicho |

**Regla Educabot: siempre Authorization Code + PKCE.** Incluso en backends con client_secret, agregá PKCE (defense in depth).

---

## 2. Providers soportados en Educabot

| Provider | Uso | Scopes mínimos | Notas |
|----------|-----|----------------|-------|
| **Google** | Default — padres/docentes con Gmail o Workspace escolar | `openid email profile` | Agregar `classroom.rosters.readonly` si se integra Classroom. Validar `hd` claim para restringir por dominio escolar |
| **Microsoft** | Escuelas con O365/Entra ID | `openid email profile User.Read` | Tenant-specific o `common` según multi-tenant |
| **Apple** | Requerido en iOS si hay otros social logins (App Store guideline 4.8) | `name email` | id_token firmado con ES256, email puede ser privado relay |
| **Facebook** | Opcional, padres | `email public_profile` | No es OIDC estricto, usar /me endpoint |
| **GitHub** | Solo staff interno (herramientas devs) | `read:user user:email` | No OIDC — parsear /user endpoint |

---

## 3. Librerías recomendadas

### Go
```go
// go.mod
require (
    golang.org/x/oauth2 v0.x.x
    github.com/coreos/go-oidc/v3 v3.x.x // verificación id_token con JWKS
)
```

### Node / TypeScript
```json
{
  "dependencies": {
    "openid-client": "^5.x"  // certificado OIDC, mantiene JWKS cache
  }
}
```
Evitar `passport-google-oauth20` y cía (abandonados, no hacen PKCE bien).

### React + Vite + TS
- `@react-oauth/google` si solo usás Google (Google Identity Services button)
- Flow manual con PKCE si es multi-provider (ver sección 7)

### React Native / Expo
- **Expo**: `expo-auth-session` (PKCE automático, universal links)
- **Bare RN**: `react-native-app-auth` (AppAuth wrapper nativo)

---

## 4. PKCE (Proof Key for Code Exchange)

Obligatorio en SPA y mobile. Recomendado en backend también.

```
code_verifier   = random 43-128 chars [A-Z a-z 0-9 - . _ ~]
code_challenge  = base64url(sha256(code_verifier))
```

Flujo:
1. Cliente genera `code_verifier` → guarda temporalmente (sessionStorage/memoria/secure storage)
2. En `/authorize`: envía `code_challenge` + `code_challenge_method=S256`
3. En `/token`: envía `code_verifier` → provider valida hash

### Go
```go
import (
    "crypto/rand"
    "crypto/sha256"
    "encoding/base64"
)

func generatePKCE() (verifier, challenge string) {
    b := make([]byte, 32)
    rand.Read(b)
    verifier = base64.RawURLEncoding.EncodeToString(b)
    h := sha256.Sum256([]byte(verifier))
    challenge = base64.RawURLEncoding.EncodeToString(h[:])
    return
}
```

### TS
```ts
async function generatePKCE() {
  const arr = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64url(arr);
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64url(new Uint8Array(hash));
  return { verifier, challenge };
}
function base64url(buf: Uint8Array) {
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
```

---

## 5. Parámetros de seguridad obligatorios

| Parámetro | Para qué | Validación |
|-----------|----------|------------|
| `state` | CSRF protection | Opaco random, guardar server/session, comparar en callback |
| `nonce` | id_token replay protection | Incluir en request; debe volver en id_token claim `nonce` |
| `code_challenge` + `_method=S256` | PKCE | Ver sección 4 |
| `redirect_uri` | Whitelist exacto | HTTPS siempre (excepto localhost dev). Sin wildcards |

### Validación de id_token (OIDC)

Al recibir id_token en `/token` response, verificar:

1. **Signature**: contra JWKS del issuer (`https://accounts.google.com/.well-known/openid-configuration` → `jwks_uri`)
2. **`iss`**: exacto (p.ej. `https://accounts.google.com`)
3. **`aud`**: coincide con tu `client_id`
4. **`exp`**: no vencido
5. **`nonce`**: coincide con el que enviaste
6. **`hd`** (opcional, Google Workspace): coincide con dominio escolar permitido

---

## 6. Ejemplo Go + Gin (Google)

```go
// internal/auth/google.go
package auth

import (
    "context"
    "crypto/rand"
    "encoding/base64"
    "net/http"

    "github.com/coreos/go-oidc/v3/oidc"
    "github.com/gin-gonic/gin"
    "golang.org/x/oauth2"
)

type GoogleAuth struct {
    oauth2Cfg *oauth2.Config
    verifier  *oidc.IDTokenVerifier
    sessions  SessionStore // tu store (Redis/DB)
}

func NewGoogleAuth(ctx context.Context, clientID, clientSecret, redirectURL string) (*GoogleAuth, error) {
    provider, err := oidc.NewProvider(ctx, "https://accounts.google.com")
    if err != nil {
        return nil, err
    }
    return &GoogleAuth{
        oauth2Cfg: &oauth2.Config{
            ClientID:     clientID,
            ClientSecret: clientSecret,
            RedirectURL:  redirectURL,
            Endpoint:     provider.Endpoint(),
            Scopes:       []string{oidc.ScopeOpenID, "email", "profile"},
        },
        verifier: provider.Verifier(&oidc.Config{ClientID: clientID}),
    }, nil
}

func randToken() string {
    b := make([]byte, 32)
    rand.Read(b)
    return base64.RawURLEncoding.EncodeToString(b)
}

// GET /auth/google/start
func (g *GoogleAuth) Start(c *gin.Context) {
    state := randToken()
    nonce := randToken()
    verifier, challenge := generatePKCE()

    // guardar en session/cookie httpOnly temporal
    g.sessions.PutPending(c, PendingAuth{State: state, Nonce: nonce, Verifier: verifier})

    url := g.oauth2Cfg.AuthCodeURL(state,
        oidc.Nonce(nonce),
        oauth2.SetAuthURLParam("code_challenge", challenge),
        oauth2.SetAuthURLParam("code_challenge_method", "S256"),
        // oauth2.SetAuthURLParam("hd", "miescuela.edu.ar"), // opcional
    )
    c.Redirect(http.StatusFound, url)
}

// GET /auth/google/callback?code=...&state=...
func (g *GoogleAuth) Callback(c *gin.Context) {
    pending, ok := g.sessions.PopPending(c)
    if !ok || c.Query("state") != pending.State {
        c.AbortWithStatus(http.StatusBadRequest)
        return
    }

    token, err := g.oauth2Cfg.Exchange(c, c.Query("code"),
        oauth2.SetAuthURLParam("code_verifier", pending.Verifier),
    )
    if err != nil {
        c.AbortWithStatus(http.StatusUnauthorized)
        return
    }

    rawIDToken, ok := token.Extra("id_token").(string)
    if !ok {
        c.AbortWithStatus(http.StatusUnauthorized)
        return
    }

    idToken, err := g.verifier.Verify(c, rawIDToken)
    if err != nil || idToken.Nonce != pending.Nonce {
        c.AbortWithStatus(http.StatusUnauthorized)
        return
    }

    var claims struct {
        Email    string `json:"email"`
        Verified bool   `json:"email_verified"`
        Name     string `json:"name"`
        Picture  string `json:"picture"`
        HD       string `json:"hd"` // hosted domain (Workspace)
    }
    if err := idToken.Claims(&claims); err != nil {
        c.AbortWithStatus(http.StatusUnauthorized)
        return
    }

    // upsert usuario + crear sesión PROPIA (no usar id_token como session)
    user := g.upsertUser(claims)
    g.sessions.Create(c, user.ID) // setea cookie httpOnly+secure+sameSite=lax

    c.Redirect(http.StatusFound, "/dashboard")
}
```

---

## 7. Ejemplo Node + TS (openid-client)

```ts
// src/auth/google.ts
import { Issuer, generators } from "openid-client";
import type { Request, Response } from "express";

const issuer = await Issuer.discover("https://accounts.google.com");
const client = new issuer.Client({
  client_id: process.env.GOOGLE_CLIENT_ID!,
  client_secret: process.env.GOOGLE_CLIENT_SECRET!,
  redirect_uris: [process.env.GOOGLE_REDIRECT_URI!],
  response_types: ["code"],
});

export function start(req: Request, res: Response) {
  const state = generators.state();
  const nonce = generators.nonce();
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);

  req.session.pending = { state, nonce, code_verifier };

  const url = client.authorizationUrl({
    scope: "openid email profile",
    state,
    nonce,
    code_challenge,
    code_challenge_method: "S256",
  });
  res.redirect(url);
}

export async function callback(req: Request, res: Response) {
  const { state, nonce, code_verifier } = req.session.pending ?? {};
  if (!state) return res.status(400).end();

  const params = client.callbackParams(req);
  const tokenSet = await client.callback(
    process.env.GOOGLE_REDIRECT_URI!,
    params,
    { state, nonce, code_verifier },
  );

  const claims = tokenSet.claims(); // ya validado signature + iss + aud + exp + nonce
  const user = await upsertUser(claims);

  req.session.userId = user.id; // sesión propia
  res.redirect("/dashboard");
}
```

---

## 8. Ejemplo React + Vite + TS (PKCE manual, multi-provider)

```tsx
// src/auth/oauthClient.ts
const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";

export async function loginWithGoogle() {
  const { verifier, challenge } = await generatePKCE();
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  sessionStorage.setItem("pkce_verifier", verifier);
  sessionStorage.setItem("oauth_state", state);
  sessionStorage.setItem("oauth_nonce", nonce);

  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirect_uri: `${window.location.origin}/auth/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  window.location.href = `${GOOGLE_AUTH}?${params}`;
}
```

```tsx
// src/auth/Callback.tsx
import { useEffect } from "react";

export function Callback() {
  useEffect(() => {
    (async () => {
      const p = new URLSearchParams(window.location.search);
      const code = p.get("code");
      const state = p.get("state");
      if (state !== sessionStorage.getItem("oauth_state")) {
        throw new Error("state mismatch");
      }
      // NO intercambiar token en el frontend: mandar code al backend
      const res = await fetch("/api/auth/google/exchange", {
        method: "POST",
        credentials: "include", // recibe cookie httpOnly
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          code_verifier: sessionStorage.getItem("pkce_verifier"),
        }),
      });
      if (!res.ok) throw new Error("auth failed");
      sessionStorage.clear();
      window.location.href = "/dashboard";
    })();
  }, []);
  return <p>Autenticando...</p>;
}
```

> El backend hace el `/token` exchange (puede tener client_secret seguro) y setea la cookie de sesión httpOnly. El frontend nunca ve tokens.

---

## 9. Ejemplo React Native (Expo)

```tsx
// src/auth/google.ts
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const discovery = AuthSession.useAutoDiscovery("https://accounts.google.com");

export function useGoogleLogin() {
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
      scopes: ["openid", "email", "profile"],
      redirectUri: AuthSession.makeRedirectUri({ scheme: "educabot" }),
      usePKCE: true, // expo maneja verifier + challenge
      responseType: AuthSession.ResponseType.Code,
    },
    discovery,
  );

  async function handleSignIn() {
    const result = await promptAsync();
    if (result.type !== "success") return;
    // mandar code + code_verifier al backend
    await fetch(`${API}/auth/google/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: result.params.code,
        code_verifier: request?.codeVerifier,
      }),
    });
  }

  return { handleSignIn, ready: !!request };
}
```

Custom scheme `educabot://auth` registrado en `app.json`:
```json
{ "expo": { "scheme": "educabot" } }
```

---

## 10. Sesión post-OAuth

**Regla**: el id_token NO es tu session token. Es prueba única de autenticación.

Crear **sesión propia**:

**Opción A — Cookie de sesión server-side (preferido para web)**
```
Set-Cookie: sid=<opaque>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400
```
- `sid` → lookup en Redis/DB
- Rotar en login, invalidar en logout

**Opción B — JWT corto + refresh token (para mobile/SPA sin backend propio)**
- access_token JWT 15 min (en memoria, nunca localStorage)
- refresh_token httpOnly cookie o secure storage nativo (Keychain/Keystore)

**Nunca**:
- localStorage/sessionStorage para tokens (XSS los expone)
- id_token como session token (no está diseñado para eso, expira rápido, no revocable)

---

## 11. Account linking

Escenario: usuario se registró con email/password, ahora intenta login con Google del mismo email.

Estrategia:
1. Verificar `email_verified=true` del id_token
2. Buscar user por email
3. Si existe → pedir confirmación (prompt "¿vincular cuenta Google a tu cuenta existente?") + password o link por email
4. Guardar provider en tabla `user_identities (user_id, provider, provider_sub)`
5. Futuro: cualquier provider del mismo user → misma cuenta

No auto-linkear sin confirmación (puede ser hijacking si el IdP no verifica bien el email).

---

## 12. Logout

**Local**: borrar cookie de sesión + invalidar en store.

**RP-initiated logout (opcional)**: cerrar sesión también en el provider.
```
GET https://accounts.google.com/Logout (no estándar Google)
POST https://login.microsoftonline.com/common/oauth2/v2.0/logout (OIDC RP-initiated)
```
Para escuelas con device compartido, considerá hacerlo.

---

## 13. Multi-tenant Educabot (Google Workspace escolar)

Para restringir login a una escuela específica:

**Opción A — `hd` param en /authorize**: hint al usuario, no enforcement
```
&hd=miescuela.edu.ar
```

**Opción B — validar claim `hd` en id_token** (ENFORCEMENT real):
```go
if claims.HD != "miescuela.edu.ar" {
    return errors.New("dominio no autorizado")
}
```

Guardar en DB la tabla `schools(domain, tenant_id)` y mapear usuario → escuela por `hd`.

---

## 14. Menores de edad (COPPA / LGPD Brasil / Argentina Ley 26.061)

- **Google Sign-In directo**: OK para >13 años (COPPA) / >12 (LGPD) según país. Verificar edad.
- **Menores**: NO registro individual. Usar **Google Classroom rostering**: el docente crea la clase, los alumnos ingresan con cuenta Workspace escolar gestionada por el admin del colegio (el colegio tiene consentimiento parental firmado).
- **Apple Sign-In**: "Ask to Buy" / Family Sharing maneja menores.
- Nunca pedir datos personales extra al menor (nombre completo, dirección, teléfono) sin consentimiento parental explícito.

---

## 15. Anti-patterns

- ❌ **Implicit flow** (`response_type=token`) → deprecado, tokens en URL fragment
- ❌ **Password grant** (ROPC) → deprecado, expone credenciales del IdP
- ❌ **SPA/mobile sin PKCE** → authorization code interceptable
- ❌ **Sin `state`** → vulnerable a CSRF en callback
- ❌ **id_token como session token** → no es su propósito, no revocable
- ❌ **localStorage para access_token/refresh_token** → XSS roba todo
- ❌ **`redirect_uri` con wildcard** (`*.example.com`) → redirección maliciosa
- ❌ **Aceptar id_token sin verificar** signature + `iss` + `aud` + `exp` + `nonce`
- ❌ **`client_secret` en frontend** (SPA/mobile) → expuesto en bundle
- ❌ **Confiar en `email` sin `email_verified=true`** → linking hijack
- ❌ **No rotar `state`/`nonce`** entre requests
- ❌ **HTTP (no HTTPS)** en redirect_uri de producción

---

## 16. Checklist review

- [ ] Flow usado es Authorization Code + PKCE (no implicit, no password grant)
- [ ] `state` generado random, guardado server-side, validado en callback
- [ ] `nonce` enviado y validado en id_token
- [ ] PKCE `S256` (no `plain`)
- [ ] id_token validado: signature (JWKS), `iss`, `aud`, `exp`, `nonce`
- [ ] `email_verified=true` antes de trust
- [ ] `redirect_uri` exacto en whitelist del provider, HTTPS en prod
- [ ] `client_secret` solo en backend (nunca en bundle frontend/mobile)
- [ ] Sesión propia creada post-login (cookie httpOnly+Secure+SameSite o JWT+refresh seguro)
- [ ] Tokens NO en localStorage/sessionStorage
- [ ] Logout invalida sesión server-side
- [ ] Account linking requiere confirmación (no auto)
- [ ] `hd` claim validado si es Workspace escolar
- [ ] Menores: no registro individual, vía rostering/managed accounts
- [ ] Apple Sign-In implementado si hay otros social logins en iOS
- [ ] Logs NO imprimen tokens (verifier, code, id_token, access_token)

---

## Output final

✅ Implementación OAuth 2.0 + OIDC con:
- Authorization Code + PKCE en todos los flows
- Providers configurados (Google default + los necesarios)
- Validación completa de id_token
- Sesión propia httpOnly, tokens fuera del alcance de XSS
- Checklist de seguridad pasado
- Documentado en el README del proyecto con URLs de callback y scopes

---

## Delegación

- **UI del login button/screen** → delegar a `ui-ux-pro-max`
- **Documentación RFC de la feature** → delegar a `doc-rfc`
- **Auditoría de implementación existente** → delegar a `audit-dev` (sección seguridad)
- **Variables de entorno (`GOOGLE_CLIENT_ID`, etc.)** → verificar con `env-sync`
- **Pre-deploy** → `deploy-check` valida secrets y redirect URIs
- **Tickets de implementación** → `jira-tickets` (épica + HUs)
