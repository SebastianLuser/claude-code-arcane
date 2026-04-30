# Checklist — JWT Strategy

- [ ] RS256 o EdDSA, libreria rechaza `none` y mismatch
- [ ] Claims iss/sub/aud/exp/iat/jti presentes y validados
- [ ] Access exp <=15 min, refresh rotado + deteccion reuse
- [ ] JWKS endpoint publico con Cache-Control y kid
- [ ] Rotation plan documentado (90d, overlap)
- [ ] Revocacion implementada (blacklist jti o user_version)
- [ ] Storage: httpOnly cookie / in-memory / SecureStore (nunca localStorage)
- [ ] CSRF cubierto si cookies, tenant_id en claims y validado
- [ ] Sin PII menores en claims
- [ ] Logout invalida refresh en DB
- [ ] Tests: token expirado, firma invalida, aud/iss incorrecto, refresh reuse, revocado
