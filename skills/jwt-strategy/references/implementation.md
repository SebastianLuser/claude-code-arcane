# Implementation Details — JWT Strategy

## Go

`golang-jwt/jwt/v5` + `keyfunc/v3` for JWKS. Verifier with issuer/audience validation + `WithValidMethods(["RS256", "EdDSA"])`. Gin middleware: extract Bearer -> parse -> check blacklist -> set user_id/tenant_id in the context.

## TypeScript

`jose` (NOT the legacy `jsonwebtoken`). `createRemoteJWKSet` with caching. `jwtVerify` with issuer/audience/algorithms. Issuing: `new SignJWT({claims}).setProtectedHeader({alg, kid})`.

## React (Vite)

Access token in memory (a variable). Refresh in an httpOnly+SameSite=Lax+Secure cookie (set by the backend). **Never localStorage/sessionStorage** (XSS = compromised account). Axios interceptor: 401 -> refresh -> retry once.

## React Native (Expo)

`expo-secure-store` -> Keychain (iOS) / Keystore (Android). **Never AsyncStorage** (plain text, accessible with root). Same interceptor + refresh, but the refresh goes in the body (not a cookie).

## CSRF

Cookie auth -> you need a CSRF token (double-submit cookie or X-CSRF-Token header). Bearer header -> no CSRF (but XSS exposes the in-memory token).
