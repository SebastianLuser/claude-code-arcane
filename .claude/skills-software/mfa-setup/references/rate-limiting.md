# Rate Limiting — MFA Endpoints

| Endpoint | Limite | Lockout |
|----------|--------|---------|
| `/mfa/verify` (TOTP/SMS) | 5/5min por user+IP | 15 min |
| `/mfa/webauthn/authenticate` | 10/5min | 15 min |
| `/mfa/sms/send` | 3/hora por numero | 24h si abuso |
| `/mfa/recovery/start` | 3/dia por email | alerta manual |

Redis sliding window o token bucket. Loguear cada lockout.
