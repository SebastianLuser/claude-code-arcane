# Checklist — JWT Strategy

- [ ] RS256 or EdDSA, the library rejects `none` and mismatches
- [ ] iss/sub/aud/exp/iat/jti claims present and validated
- [ ] Access exp <=15 min, rotated refresh + reuse detection
- [ ] Public JWKS endpoint with Cache-Control and kid
- [ ] Rotation plan documented (90d, overlap)
- [ ] Revocation implemented (jti blacklist or user_version)
- [ ] Storage: httpOnly cookie / in-memory / SecureStore (never localStorage)
- [ ] CSRF covered if cookies are used, tenant_id in the claims and validated
- [ ] No minors' PII in the claims
- [ ] Logout invalidates the refresh in the DB
- [ ] Tests: expired token, invalid signature, wrong aud/iss, refresh reuse, revoked
