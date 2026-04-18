---
name: jwt-strategy
description: Estrategia de autenticación con JWT y refresh tokens para stack Educabot (Go + TS + React/Vite + React Native). Cubre elección JWT vs session cookie, algoritmos (RS256/EdDSA), JWKS, rotation, storage seguro, revocación y multi-tenant. Usar cuando se mencione JWT, token, auth, refresh token, JWKS, login, sesión, autenticación stateless.
argument-hint: "[setup|rotate|audit]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# JWT Strategy — Educabot

Guía canónica para diseñar autenticación basada en tokens en proyectos Educabot. Aplica a backends Go/TS y frontends React+Vite / React Native.

## Cuándo usar

- Arquitectura multi-service donde varios backends validan el mismo token.
- APIs públicas consumidas por mobile/SPA.
- Federación con IdP externo (Auth0, Cognito, Keycloak).
- Necesitás claims firmados transportables entre servicios.

## NO usar

- App monolítica web con un solo backend → **session cookie opaca + Redis** es más simple, más chico y revocable al instante.
- Cuando no podés rotar claves ni publicar JWKS.
- Cuando el equipo no tiene plan de revocación.
- "Porque es moderno" — no es razón técnica.

**Default Educabot:**
- Web SPA (React+Vite): session cookie httpOnly opaca + refresh rotation.
- Mobile (RN) / APIs externas: JWT corto (RS256) + refresh token rotado.

---

## 1. Algoritmos

Usar **RS256** o **EdDSA (Ed25519)**. Asimétricos: el backend emisor firma con private key, cualquier consumidor verifica con public key publicada en JWKS.

- ❌ `HS256` en arquitectura multi-service: requiere shared secret, cualquier servicio comprometido puede emitir tokens.
- ❌ `alg: none`: prohibido. La librería debe rechazarlo explícitamente.
- ✅ `RS256` si necesitás interop amplia.
- ✅ `EdDSA` si el stack lo soporta (más chico, más rápido).

## 2. Claims

Estándar (RFC 7519) obligatorios:

| Claim | Significado |
|-------|-------------|
| `iss` | Emisor (ej: `https://auth.educabot.com`) |
| `sub` | User ID |
| `aud` | Audiencia (ej: `alizia-api`) |
| `exp` | Expiración (Unix ts) |
| `iat` | Issued at |
| `nbf` | Not before |
| `jti` | Token ID único (para revocación) |

Custom Educabot:

```json
{
  "tenant_id": "org_123",
  "roles": ["teacher", "admin"],
  "scope": "read:students write:grades",
  "user_version": 3
}
```

**Menores de edad: NUNCA email, nombre completo ni PII en el JWT.** Solo `sub` (UUID opaco) y `tenant_id`.

## 3. Lifetimes

- **Access token:** 5–15 min. Corto para minimizar ventana si se filtra.
- **Refresh token:** 7–30 días. Rotado en cada uso. Almacenado en cookie httpOnly + DB (revocable).

## 4. Refresh token rotation

Cada vez que el cliente hace `POST /auth/refresh`:

1. Backend valida refresh actual.
2. Marca el refresh usado como `rotated_at = now()`.
3. Emite nuevo refresh con la misma `family_id` y `parent_jti`.
4. Si alguna vez llega un refresh ya rotado → **reuse detectado** → compromiso → revocar toda la family del usuario.

## 5. JWKS

Exponer `/.well-known/jwks.json` con claves públicas activas.

```json
{
  "keys": [
    { "kid": "2026-01", "kty": "RSA", "alg": "RS256", "use": "sig", "n": "...", "e": "AQAB" },
    { "kid": "2026-04", "kty": "RSA", "alg": "RS256", "use": "sig", "n": "...", "e": "AQAB" }
  ]
}
```

- Cliente cachea respetando `Cache-Control` (TTL ~ 10 min).
- Rotar claves cada **90 días**: dos kids activos durante ventana de overlap (emitir con la nueva, validar con ambas).
- `kid` en header del JWT para selección.

## 6. Validación server-side

Toda request protegida debe validar:

1. Signature contra JWKS (kid correcto).
2. `exp` no vencido.
3. `nbf` ya pasado.
4. `iss` matchea emisor esperado.
5. `aud` incluye el servicio actual.
6. `jti` no está en blacklist (Redis).
7. `user_version` matchea la versión actual del usuario en DB (si usás ese mecanismo).

No confiar SOLO en `exp`: mantener mecanismo de revocación.

---

## 7. Ejemplo backend Go

`github.com/golang-jwt/jwt/v5` + `github.com/MicahParks/keyfunc/v3`.

```go
package auth

import (
	"context"
	"errors"
	"time"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	TenantID    string   `json:"tenant_id"`
	Roles       []string `json:"roles"`
	UserVersion int      `json:"user_version"`
	jwt.RegisteredClaims
}

type Verifier struct {
	jwks     keyfunc.Keyfunc
	issuer   string
	audience string
}

func NewVerifier(ctx context.Context, jwksURL, iss, aud string) (*Verifier, error) {
	k, err := keyfunc.NewDefaultCtx(ctx, []string{jwksURL})
	if err != nil {
		return nil, err
	}
	return &Verifier{jwks: k, issuer: iss, audience: aud}, nil
}

func (v *Verifier) Parse(tokenStr string) (*Claims, error) {
	claims := &Claims{}
	tok, err := jwt.ParseWithClaims(tokenStr, claims, v.jwks.Keyfunc,
		jwt.WithIssuer(v.issuer),
		jwt.WithAudience(v.audience),
		jwt.WithValidMethods([]string{"RS256", "EdDSA"}),
		jwt.WithLeeway(30*time.Second),
	)
	if err != nil || !tok.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
```

Middleware Gin:

```go
func AuthMiddleware(v *Verifier, blacklist RevocationStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.GetHeader("Authorization")
		if !strings.HasPrefix(h, "Bearer ") {
			c.AbortWithStatus(401); return
		}
		claims, err := v.Parse(strings.TrimPrefix(h, "Bearer "))
		if err != nil { c.AbortWithStatus(401); return }
		if blacklist.IsRevoked(c, claims.ID) {
			c.AbortWithStatus(401); return
		}
		c.Set("user_id", claims.Subject)
		c.Set("tenant_id", claims.TenantID)
		c.Next()
	}
}
```

## 8. Ejemplo backend TS

Usar **`jose`** (W3C WebCrypto, moderno). NO usar `jsonwebtoken` (legacy, sin JWKS rotation fluido).

```ts
import { jwtVerify, createRemoteJWKSet } from 'jose'

const JWKS = createRemoteJWKSet(new URL(process.env.JWKS_URL!), {
  cacheMaxAge: 10 * 60 * 1000,
  cooldownDuration: 30 * 1000,
})

export interface EducabotClaims {
  sub: string
  tenant_id: string
  roles: string[]
  user_version: number
}

export async function verifyToken(token: string): Promise<EducabotClaims> {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
    algorithms: ['RS256', 'EdDSA'],
    clockTolerance: 30,
  })
  return payload as unknown as EducabotClaims
}
```

Emisión con key rotation:

```ts
import { SignJWT, importPKCS8 } from 'jose'

const privateKey = await importPKCS8(process.env.JWT_PRIVATE_KEY!, 'RS256')

export async function issueAccessToken(userId: string, tenantId: string, roles: string[]) {
  return await new SignJWT({ tenant_id: tenantId, roles, user_version: 1 })
    .setProtectedHeader({ alg: 'RS256', kid: process.env.JWT_KID! })
    .setIssuer(process.env.JWT_ISSUER!)
    .setAudience(process.env.JWT_AUDIENCE!)
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('10m')
    .setJti(crypto.randomUUID())
    .sign(privateKey)
}
```

## 9. Frontend React (Vite + TS)

**Storage:**
- Access token: in-memory (variable en módulo auth).
- Refresh token: **cookie httpOnly + SameSite=Lax + Secure** seteada por el backend en `/auth/login` y `/auth/refresh`.
- ❌ `localStorage` / `sessionStorage`: XSS = cuenta comprometida.

Interceptor axios con refresh on 401 + retry una vez:

```ts
import axios from 'axios'

let accessToken: string | null = null
let refreshing: Promise<string> | null = null

export const api = axios.create({ baseURL: '/api', withCredentials: true })

api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry) throw error
    original._retry = true
    try {
      refreshing ??= refreshAccessToken()
      accessToken = await refreshing
      original.headers.Authorization = `Bearer ${accessToken}`
      return api(original)
    } finally {
      refreshing = null
    }
  },
)

async function refreshAccessToken(): Promise<string> {
  const { data } = await axios.post('/api/auth/refresh', null, { withCredentials: true })
  return data.access_token
}
```

## 10. React Native (Expo)

- Usar `expo-secure-store` → Keychain (iOS) / Keystore (Android).
- ❌ `AsyncStorage` para tokens: plano, accesible con root/jailbreak.

```ts
import * as SecureStore from 'expo-secure-store'

const ACCESS = 'edu.access'
const REFRESH = 'edu.refresh'

export const tokenStore = {
  async set(access: string, refresh: string) {
    await SecureStore.setItemAsync(ACCESS, access, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY })
    await SecureStore.setItemAsync(REFRESH, refresh, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY })
  },
  getAccess: () => SecureStore.getItemAsync(ACCESS),
  getRefresh: () => SecureStore.getItemAsync(REFRESH),
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS)
    await SecureStore.deleteItemAsync(REFRESH)
  },
}
```

Mismo patrón de interceptor + refresh que web, pero refresh va en body (no cookie).

## 11. CSRF

- Si usás **cookie** para transportar auth → necesitás CSRF token en requests mutables (POST/PUT/PATCH/DELETE). Double-submit cookie o header `X-CSRF-Token`.
- Si usás **`Authorization: Bearer`** → no hay CSRF (cookies no se envían automáticamente con el token), pero XSS te expone el token in-memory igual.

## 12. Logout

```
POST /auth/logout
→ backend: DELETE refresh_tokens WHERE jti = ? AND family_id = ?
→ backend: SET httpOnly cookie con Max-Age=0
→ frontend: borrar access token in-memory + redirect a /login
```

El access token sigue válido hasta su `exp`. Si necesitás kill switch inmediato, agregar `jti` a blacklist Redis con TTL = `exp - now`.

## 13. Revocación

Dos estrategias (elegí una, documentala):

**A) Blacklist por `jti`:**
- Redis `SET revoked:<jti> 1 EX <ttl>`.
- Middleware consulta en cada request protegida.
- Costo: +1 Redis hit por request.

**B) `user_version` claim:**
- Cada user tiene `version` en DB (incrementa en logout-all, password change, role change).
- JWT incluye `user_version` al emitirse.
- Middleware compara con DB (cacheable). Si no matchea → 401.
- Costo: cache hit por user (TTL corto).

**Default Educabot: B** (más barato a escala, invalida todo de un usuario con un `UPDATE`).

## 14. Multi-tenant

- `tenant_id` en claims es **obligatorio**.
- Backend valida que recursos accedidos pertenezcan a `tenant_id` del JWT.
- Prohibido pasar `tenant_id` por query/body y confiar en él.

```go
func (h *StudentHandler) Get(c *gin.Context) {
	studentID := c.Param("id")
	tenantID := c.GetString("tenant_id")
	s, err := h.svc.Get(c, studentID, tenantID)
	if errors.Is(err, repo.ErrNotFound) { c.AbortWithStatus(404); return }
	c.JSON(200, s)
}
```

---

## Anti-patterns

- ❌ `HS256` en arquitectura multi-service (shared secret filtrable).
- ❌ `alg: none` habilitado en la librería.
- ❌ `localStorage` / `sessionStorage` para access o refresh tokens.
- ❌ Access tokens con `exp > 1h`.
- ❌ Refresh tokens sin rotation.
- ❌ Public key hardcodeada en lugar de JWKS.
- ❌ No validar `aud` ni `iss`.
- ❌ Meter PII (email, nombre, DNI) en el JWT, especialmente de menores.
- ❌ Decodificar el JWT en el cliente (`jwt-decode`) y usar claims para lógica de negocio sin validación server-side.
- ❌ Sistema en producción sin plan de revocación documentado.
- ❌ Usar `jsonwebtoken` (legacy) en TS cuando existe `jose`.
- ❌ `AsyncStorage` en React Native para tokens.
- ❌ Passar `tenant_id` por query y no por claim.
- ❌ Rotar claves sin ventana de overlap (rompe clientes con JWKS cacheado).

## Checklist de review

- [ ] Algoritmo es `RS256` o `EdDSA`, nunca `HS256` ni `none`.
- [ ] Librería rechaza explícitamente `alg: none` y mismatch de algoritmo.
- [ ] Claims `iss`, `sub`, `aud`, `exp`, `iat`, `jti` presentes y validados.
- [ ] Access token `exp ≤ 15 min`.
- [ ] Refresh token rotado en cada uso + detección de reuse.
- [ ] JWKS endpoint público con `Cache-Control` y `kid` en headers.
- [ ] Plan de rotation documentado (cada 90 días, overlap).
- [ ] Mecanismo de revocación implementado (blacklist `jti` o `user_version`).
- [ ] Storage frontend: httpOnly cookie / in-memory / SecureStore. Nunca localStorage.
- [ ] CSRF cubierto si se usan cookies.
- [ ] `tenant_id` en claims y validado en cada query multi-tenant.
- [ ] Sin PII de menores en los claims.
- [ ] Logout invalida refresh en DB.
- [ ] Tests de: token expirado, firma inválida, `aud` incorrecto, `iss` incorrecto, refresh reuse, token revocado.

## Output final

Al terminar la implementación entregá:

- ✅ Diagrama de flujo login / refresh / logout.
- ✅ Endpoint `/.well-known/jwks.json` funcional.
- ✅ Runbook de key rotation (comandos + ventana de overlap).
- ✅ Documento de revocación (qué estrategia, TTL, cómo se dispara).
- ✅ Variables de entorno en `.env.example`: `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_PRIVATE_KEY`, `JWT_KID`, `JWKS_URL`, `REFRESH_TTL`, `ACCESS_TTL`.
- ✅ Tests de integración cubriendo validaciones críticas.
- ✅ README auth con ejemplos curl de login/refresh/logout.

## Delegación

- **Implementación UI de login/logout:** delegar a `ui-ux-pro-max`.
- **Scaffolding del módulo auth Go:** delegar a `scaffold-go`.
- **Documentar endpoints de auth:** delegar a `api-docs`.
- **Crear épica/HUs de auth:** delegar a `doc-rfc`.
- **Tickets Jira de implementación:** delegar a `jira-tickets`.
- **Auditoría de seguridad post-implementación:** delegar a `audit-dev`.
- **Pre-deploy de auth service:** delegar a `deploy-check`.
- **Post-mortem si hay incidente de auth:** delegar a `incident`.
