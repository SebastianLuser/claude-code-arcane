# Rate Limiting — MFA Endpoints

| Endpoint | Limit | Lockout |
|----------|--------|---------|
| `/mfa/verify` (TOTP/SMS) | 5/5min per user+IP | 15 min |
| `/mfa/webauthn/authenticate` | 10/5min | 15 min |
| `/mfa/sms/send` | 3/hour per number | 24h on abuse |
| `/mfa/recovery/start` | 3/day per email | manual alert |

Redis sliding window or token bucket. Log every lockout.
