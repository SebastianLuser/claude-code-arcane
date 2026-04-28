---
name: jwt-strategy
description: Estrategia de autenticación con JWT y refresh tokens para stack Educabot (Go + TS + React/Vite + React Native). Cubre elección JWT vs session cookie, algoritmos (RS256/EdDSA), JWKS, rotation, storage seguro, revocación y multi-tenant. Usar cuando se mencione JWT, token, auth, refresh token, JWKS, login, sesión, autenticación stateless.
argument-hint: "[setup|rotate|audit]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# JWT Strategy — Educabot

**Default:** Web SPA → session cookie httpOnly opaca + refresh rotation. Mobile/APIs externas → JWT corto (RS256) + refresh rotado.

## Algoritmos

**RS256** o **EdDSA (Ed25519)** — asimétricos. Private key firma, public key verifica via JWKS. Prohibido: `HS256` en multi-service (shared secret), `alg: none`.

## Claims

Estándar obligatorios: `iss`, `sub` (user ID), `aud`, `exp`, `iat`, `nbf`, `jti` (para revocación). Custom Educabot: `tenant_id`, `roles`, `scope`, `user_version`. **Menores: NUNCA email/nombre/PII — solo sub (UUID) + tenant_id.**

## Lifetimes

Access: 5-15 min. Refresh: 7-30 días, rotado en cada uso, en cookie httpOnly + DB.

## Refresh Token Rotation

Cada `POST /auth/refresh`: validar → marcar como `rotated_at` → emitir nuevo con misma `family_id` + `parent_jti`. Refresh ya rotado llega → reuse detectado → revocar toda la family.

## JWKS

`/.well-known/jwks.json` con claves públicas activas. Cache respetando `Cache-Control` (~10 min). Rotar cada **90 días**: 2 kids activos durante overlap (emitir con nueva, validar con ambas). `kid` en JWT header.

## Validación Server-side

1. Signature contra JWKS (kid correcto)
2. `exp` no vencido, `nbf` ya pasado
3. `iss` matchea, `aud` incluye servicio actual
4. `jti` no en blacklist (Redis)
5. `user_version` matchea DB (si se usa)

## Implementación

**Go:** `golang-jwt/jwt/v5` + `keyfunc/v3` para JWKS. Verifier con issuer/audience validation + `WithValidMethods(["RS256", "EdDSA"])`. Middleware Gin: extract Bearer → parse → check blacklist → set user_id/tenant_id en context.

**TS:** `jose` (NO `jsonwebtoken` legacy). `createRemoteJWKSet` con cache. `jwtVerify` con issuer/audience/algorithms. Emisión: `new SignJWT({claims}).setProtectedHeader({alg, kid})`.

**React (Vite):** Access token in-memory (variable). Refresh en cookie httpOnly+SameSite=Lax+Secure (seteada por backend). **Nunca localStorage/sessionStorage** (XSS = cuenta comprometida). Interceptor axios: 401 → refresh → retry once.

**React Native (Expo):** `expo-secure-store` → Keychain (iOS) / Keystore (Android). **Nunca AsyncStorage** (plano, accesible con root). Mismo interceptor + refresh, pero refresh va en body (no cookie).

## CSRF

Cookie auth → necesitás CSRF token (double-submit cookie o X-CSRF-Token header). Bearer header → no hay CSRF (pero XSS expone token in-memory).

## Logout

`POST /auth/logout` → delete refresh en DB → clear cookie (Max-Age=0) → frontend borra access in-memory. Access sigue válido hasta `exp`. Kill switch inmediato: `jti` a blacklist Redis con TTL = exp - now.

## Revocación

**A) Blacklist jti:** Redis `SET revoked:<jti> 1 EX <ttl>`. +1 Redis hit/request.

**B) user_version (Default Educabot):** user tiene `version` en DB (incrementa en logout-all/password change/role change). JWT incluye `user_version`. Middleware compara (cacheable). Más barato a escala.

## Multi-tenant

`tenant_id` en claims **obligatorio**. Backend valida que recursos pertenezcan a `tenant_id` del JWT. Prohibido pasar tenant_id por query/body.

## Anti-patterns

- HS256 multi-service, `alg: none`, localStorage para tokens
- Access exp >1h, refresh sin rotation
- Public key hardcodeada (usar JWKS), no validar aud/iss
- PII (email/nombre/DNI) en JWT, especialmente menores
- jwt-decode en cliente para lógica de negocio sin validación server
- Sin plan de revocación, `jsonwebtoken` legacy en TS
- AsyncStorage en RN, tenant_id por query, rotar keys sin overlap

## Checklist

- [ ] RS256 o EdDSA, librería rechaza `none` y mismatch
- [ ] Claims iss/sub/aud/exp/iat/jti presentes y validados
- [ ] Access exp ≤15 min, refresh rotado + detección reuse
- [ ] JWKS endpoint público con Cache-Control y kid
- [ ] Rotation plan documentado (90d, overlap)
- [ ] Revocación implementada (blacklist jti o user_version)
- [ ] Storage: httpOnly cookie / in-memory / SecureStore (nunca localStorage)
- [ ] CSRF cubierto si cookies, tenant_id en claims y validado
- [ ] Sin PII menores en claims
- [ ] Logout invalida refresh en DB
- [ ] Tests: token expirado, firma inválida, aud/iss incorrecto, refresh reuse, revocado
