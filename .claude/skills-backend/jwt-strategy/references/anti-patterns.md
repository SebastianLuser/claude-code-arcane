# Anti-patterns — JWT Strategy

| # | No hacer | Hacer en cambio |
|---|----------|-----------------|
| 1 | `alg: none` o HS256 en multi-service | RS256 / EdDSA con JWKS publico |
| 2 | Access token con exp >1h | Access <=15 min, refresh 7-30 dias rotado |
| 3 | Refresh sin rotacion ni deteccion de reuse | Rotar en cada uso + revocar family si se detecta reuse |
| 4 | Public key hardcodeada | JWKS endpoint `/.well-known/jwks.json` con 2 kids activos |
| 5 | No validar `aud` / `iss` | Validar siempre — impide aceptar tokens de otro servicio |
| 6 | PII (email, nombre, DNI) en claims | Solo `sub` (UUID) + `tenant_id` + roles; nunca PII de menores |
| 7 | `jwt-decode` en cliente para logica | Solo para UI (display); validacion siempre server-side |
| 8 | Sin plan de revocacion | Blacklist jti en Redis o user_version en claims |
| 9 | `jsonwebtoken` en TS | Usar `jose` (soporte JWKS, async, modern) |
| 10 | Tokens en localStorage / AsyncStorage | In-memory (SPA) / HttpOnly cookie / SecureStore (RN) |
| 11 | `tenant_id` por query param o body | Siempre en claims del JWT; backend valida |
| 12 | Rotar JWKS sin overlap | Mantener 2 kids activos 90 dias; emitir con nueva, validar con ambas |
