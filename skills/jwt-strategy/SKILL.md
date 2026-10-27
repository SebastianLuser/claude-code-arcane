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

**Default:** Web SPA → opaque httpOnly session cookie + refresh rotation. Mobile/external APIs → short JWT (RS256) + rotated refresh.

## Algorithms

**RS256** or **EdDSA (Ed25519)** — asymmetric. The private key signs, the public key verifies via JWKS. Forbidden: `HS256` across multiple services (shared secret), `alg: none`.

## Claims

Mandatory standard claims: `iss`, `sub` (user ID), `aud`, `exp`, `iat`, `nbf`, `jti` (for revocation). Educabot custom: `tenant_id`, `roles`, `scope`, `user_version`. **Minors: NEVER email/name/PII — only sub (UUID) + tenant_id.**

## Lifetimes

Access: 5-15 min. Refresh: 7-30 days, rotated on every use, in an httpOnly cookie + DB.

## Refresh Token Rotation

Each `POST /auth/refresh`: validate → mark as `rotated_at` → issue a new one with the same `family_id` + `parent_jti`. An already rotated refresh arrives → reuse detected → revoke the whole family.

## JWKS

`/.well-known/jwks.json` with the active public keys. Cache it respecting `Cache-Control` (~10 min). Rotate every **90 days**: 2 active kids during the overlap (issue with the new one, validate with both). `kid` in the JWT header.

## Server-side Validation

1. Signature against JWKS (correct kid)
2. `exp` not expired, `nbf` already passed
3. `iss` matches, `aud` includes the current service
4. `jti` not on the blacklist (Redis)
5. `user_version` matches the DB (if used)

## Implementation

Go (`golang-jwt`), TS (`jose`), React (in-memory + cookie), React Native (`expo-secure-store`).

> → Read references/implementation.md for per-stack details: Go, TS, React, React Native and CSRF

## Logout

`POST /auth/logout` → delete the refresh in the DB → clear the cookie (Max-Age=0) → the frontend drops the in-memory access token. The access token stays valid until `exp`. Immediate kill switch: `jti` to the Redis blacklist with TTL = exp - now.

## Revocation

**A) jti blacklist:** Redis `SET revoked:<jti> 1 EX <ttl>`. +1 Redis hit/request.

**B) user_version (Educabot default):** the user has a `version` in the DB (incremented on logout-all/password change/role change). The JWT includes `user_version`. Middleware compares them (cacheable). Cheaper at scale.

## Multi-tenant

`tenant_id` in the claims is **mandatory**. The backend validates that resources belong to the JWT's `tenant_id`. Passing tenant_id through query/body is forbidden.

## Anti-patterns

> → Read references/anti-patterns.md for the full table (12 items) with remediation

## Checklist

> → Read references/checklist.md for the full checklist (11 items)
