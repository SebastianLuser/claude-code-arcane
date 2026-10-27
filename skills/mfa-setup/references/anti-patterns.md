# Anti-patterns — MFA Setup

- TOTP secret in plaintext in the DB — always AES-256-GCM + KMS
- SMS as the only MFA option
- No backup codes at enrollment
- Backup codes in plaintext — hash with Argon2id
- No rate limit on `/verify` — trivial brute force
- TOTP window >+-1 step
- Not updating the WebAuthn counter
- Secret questions as recovery
- Same OTP valid more than once
- Not invalidating sessions when MFA is disabled
- Reusing a WebAuthn challenge across requests
- SMS to minors
- No logging of MFA events
