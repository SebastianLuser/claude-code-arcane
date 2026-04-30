# Implementation Details — JWT Strategy

## Go

`golang-jwt/jwt/v5` + `keyfunc/v3` para JWKS. Verifier con issuer/audience validation + `WithValidMethods(["RS256", "EdDSA"])`. Middleware Gin: extract Bearer -> parse -> check blacklist -> set user_id/tenant_id en context.

## TypeScript

`jose` (NO `jsonwebtoken` legacy). `createRemoteJWKSet` con cache. `jwtVerify` con issuer/audience/algorithms. Emision: `new SignJWT({claims}).setProtectedHeader({alg, kid})`.

## React (Vite)

Access token in-memory (variable). Refresh en cookie httpOnly+SameSite=Lax+Secure (seteada por backend). **Nunca localStorage/sessionStorage** (XSS = cuenta comprometida). Interceptor axios: 401 -> refresh -> retry once.

## React Native (Expo)

`expo-secure-store` -> Keychain (iOS) / Keystore (Android). **Nunca AsyncStorage** (plano, accesible con root). Mismo interceptor + refresh, pero refresh va en body (no cookie).

## CSRF

Cookie auth -> necesitas CSRF token (double-submit cookie o X-CSRF-Token header). Bearer header -> no hay CSRF (pero XSS expone token in-memory).
