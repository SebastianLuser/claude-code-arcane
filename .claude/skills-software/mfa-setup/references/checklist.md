# Checklist — MFA Setup

- [ ] Roles con MFA obligatorio vs opcional definidos
- [ ] Factores soportados (minimo TOTP + backup codes)
- [ ] Schema `user_mfa` + `mfa_backup_codes` + `mfa_events` migrado
- [ ] KMS configurado para encriptar secrets
- [ ] Endpoints: enroll, verify, disable, backup/regenerate
- [ ] Recovery flow con email + backup code
- [ ] Rate limiting en verify con Redis
- [ ] Step-up middleware en endpoints sensibles
- [ ] UI enrolamiento con QR + backup codes
- [ ] UI login con fallback entre metodos
- [ ] Logging en mfa_events
- [ ] Alertas: 3+ fallos, recovery iniciado, MFA desactivado
- [ ] Tests: enroll, verify +-30s drift, backup single-use, rate limit
- [ ] Documentacion soporte (perdida de acceso)
- [ ] Retencion mfa_events >=1 anio
