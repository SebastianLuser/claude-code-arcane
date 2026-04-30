# Anti-patterns — MFA Setup

- TOTP secret en claro en DB — siempre AES-256-GCM + KMS
- SMS como unica opcion MFA
- Sin backup codes al enrolar
- Backup codes en claro — hashear Argon2id
- Sin rate limit en `/verify` — brute force trivial
- Window TOTP >+-1 step
- No actualizar counter WebAuthn
- Preguntas secretas como recovery
- Mismo OTP valido mas de una vez
- No invalidar sesiones al desactivar MFA
- Reutilizar challenge WebAuthn entre requests
- SMS a menores
- Sin logging de eventos MFA
