# Checklist — MFA Setup

- [ ] Roles with mandatory vs optional MFA defined
- [ ] Supported factors (minimum TOTP + backup codes)
- [ ] Schema `user_mfa` + `mfa_backup_codes` + `mfa_events` migrated
- [ ] KMS configured to encrypt secrets
- [ ] Endpoints: enroll, verify, disable, backup/regenerate
- [ ] Recovery flow with email + backup code
- [ ] Rate limiting on verify with Redis
- [ ] Step-up middleware on sensitive endpoints
- [ ] Enrollment UI with QR + backup codes
- [ ] Login UI with fallback between methods
- [ ] Logging in mfa_events
- [ ] Alerts: 3+ failures, recovery started, MFA disabled
- [ ] Tests: enroll, verify +-30s drift, backup single-use, rate limit
- [ ] Support documentation (lost access)
- [ ] mfa_events retention >=1 year
