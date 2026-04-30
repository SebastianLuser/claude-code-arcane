---
name: jwt-strategy
description: "JWT strategy: RS256/EdDSA, JWKS rotation, refresh tokens, secure storage, revocation, multi-tenant."
category: "security"
argument-hint: "[setup|rotate|audit]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
metadata:
  category: security
  sources:
    - JWT RFC 7519 (JSON Web Token)
    - JWK RFC 7517 (JSON Web Key)
    - JWT Best Practices RFC 8725
    - jose library documentation (github.com/panva/jose)
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

Go (`golang-jwt`), TS (`jose`), React (in-memory + cookie), React Native (`expo-secure-store`).

> → Read references/implementation.md for detalles por stack: Go, TS, React, React Native y CSRF

## Logout

`POST /auth/logout` → delete refresh en DB → clear cookie (Max-Age=0) → frontend borra access in-memory. Access sigue válido hasta `exp`. Kill switch inmediato: `jti` a blacklist Redis con TTL = exp - now.

## Revocación

**A) Blacklist jti:** Redis `SET revoked:<jti> 1 EX <ttl>`. +1 Redis hit/request.

**B) user_version (Default Educabot):** user tiene `version` en DB (incrementa en logout-all/password change/role change). JWT incluye `user_version`. Middleware compara (cacheable). Más barato a escala.

## Multi-tenant

`tenant_id` en claims **obligatorio**. Backend valida que recursos pertenezcan a `tenant_id` del JWT. Prohibido pasar tenant_id por query/body.

## Anti-patterns

> → Read references/anti-patterns.md for tabla completa (12 items) con remediación

## Checklist

> → Read references/checklist.md for checklist completo (11 items)
