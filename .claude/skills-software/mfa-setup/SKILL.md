---
name: mfa-setup
description: Implementación de Multi-Factor Authentication (MFA/2FA) en productos Educabot. TOTP, WebAuthn/Passkeys, SMS OTP, backup codes, recovery y step-up auth. Stack Go + TS (React/RN). Usar cuando se mencione MFA, 2FA, autenticación de dos factores, TOTP, passkeys, WebAuthn, OTP, Authenticator, segundo factor, verificación en dos pasos.
argument-hint: "[totp|webauthn|sms|backup-codes]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
metadata:
  category: security
  sources:
    - NIST SP 800-63B (Digital Identity Guidelines, Level 2)
    - WebAuthn Level 2 Specification (W3C)
    - RFC 6238 — TOTP: Time-Based One-Time Password
    - OWASP MFA Cheat Sheet
---
# MFA Setup — Educabot

MFA para productos Educabot (docentes, admins, alumnos). WebAuthn/Passkeys preferido, TOTP universal, SMS solo recovery.

## Cuándo usar / NO usar

| Usar | NO usar |
|------|---------|
| Agregar 2FA a backend Go o Node/TS | Solo login social (OAuth) sin factor adicional |
| Integrar Passkeys en web (React+Vite) o mobile (RN) | Apps consumer alumnos menores sin datos sensibles |
| Diseñar enrolamiento, verificación, recovery | Magic links como único factor (passwordless ≠ MFA) |
| Schema DB para credenciales MFA | |
| Step-up auth en endpoints sensibles | |

## Factores

| Factor | Recomendado | Riesgo | Librería |
|--------|-------------|--------|----------|
| **WebAuthn/Passkeys** | Sí (preferido 2026+) | Bajo | `@simplewebauthn/server`, `go-webauthn/webauthn` |
| **TOTP (RFC 6238)** | Sí (default universal) | Medio (phishable) | `otplib` (Node), `pquerna/otp` (Go) |
| **SMS OTP** | Solo recovery | Alto (SIM swap) | Twilio Verify, MessageBird |
| **Backup codes** | Obligatorio | Bajo si hash correcto | custom + Argon2id |

**Regla Educabot:** admins+docentes MFA obligatorio (mínimo TOTP/Passkey). Alumnos adultos opcional. Menores: NO SMS, solo TOTP/Passkey parental.

## TOTP

- **Enrolamiento:** generar secret BASE32, guardar encriptado (AES-256-GCM + KMS, nunca en claro). Generar `otpauth://` URI → QR. Confirmar enrolamiento solo cuando user ingrese código válido.
- **Go:** `pquerna/otp` — `totp.Generate()` con Issuer "Educabot", Period 30, DigitsSix, AlgorithmSHA1 (compatible Google Authenticator)
- **TS:** `otplib` — `authenticator.generateSecret()` + `keyuri()` + QR via `qrcode`
- **Verificación:** window ±1 step (30s) por drift. NO mayor.

## WebAuthn / Passkeys

- **Registro:** `generateRegistrationOptions` (rpName "Educabot", rpID "educabot.com", attestationType "none", residentKey "preferred"). Guardar challenge en sesión/Redis TTL 5min. Verificar response → guardar credentialID, publicKey, counter.
- **Login:** `generateAuthenticationOptions` + `verifyAuthenticationResponse`. Actualizar counter cada uso (detecta clonado).
- **Cross-device:** Passkeys sincronizan vía iCloud Keychain / Google Password Manager. Solo guardar public key + credentialID.

## SMS OTP (solo recovery)

Twilio Verify para envío/verificación. Nunca factor primario. Nunca menores. Rate limit: 3 SMS/hora por número.

## Backup codes

Generar 10 códigos, mostrar UNA VEZ. Guardar solo hash Argon2id. Al usar: verificar hash, marcar `used_at`, invalidar. Si quedan <3 → avisar para regenerar.

## Recovery flow

1. "No tengo acceso a mi 2FA" → email + 1 backup code válido
2. Link recovery al email (TTL 15min, single-use)
3. Confirma → desactivar MFA → forzar re-enrolamiento
- NO preguntas secretas. Log detallado + alerta seguridad. Sin backup ni email → validación identidad manual (institución admin).

## Step-up auth

Requerir MFA aunque sesión activa para: cambio email/password/phone, export datos (LGPD/GDPR), eliminación cuenta, cambios permisos, acceso PII alumnos. Middleware verifica `lastMfaTimestamp` contra `maxAge`.

## Rate limiting

| Endpoint | Límite | Lockout |
|----------|--------|---------|
| `/mfa/verify` (TOTP/SMS) | 5/5min por user+IP | 15 min |
| `/mfa/webauthn/authenticate` | 10/5min | 15 min |
| `/mfa/sms/send` | 3/hora por número | 24h si abuso |
| `/mfa/recovery/start` | 3/día por email | alerta manual |

Redis sliding window o token bucket. Loguear cada lockout.

## Schema DB

- **`user_mfa`**: id, user_id, type (totp/webauthn/sms), secret_encrypted (TOTP), credential_id+public_key+counter+transports+device_name (WebAuthn), phone_encrypted (SMS), created_at, last_used_at, verified_at
- **`mfa_backup_codes`**: id, user_id, code_hash (Argon2id), used_at, created_at. Índice parcial: `user_id WHERE used_at IS NULL`
- **`mfa_events`**: id, user_id, event_type (enrolled/verified/failed/recovery/disabled), mfa_type, ip, user_agent, created_at

## Reglas por rol

| Rol | MFA | Métodos | Step-up maxAge |
|-----|-----|---------|----------------|
| Super-admin | Obligatorio | Passkey + TOTP (2 factores) | 2 min |
| Admin institución | Obligatorio | Passkey o TOTP | 5 min |
| Docente | Obligatorio | Passkey/TOTP; SMS solo recovery | 10 min |
| Alumno adulto (16+) | Opcional | TOTP o Passkey | 15 min |
| Alumno menor | No obligatorio | TOTP (vía tutor); NUNCA SMS | N/A |

## Anti-patterns

- TOTP secret en claro en DB — siempre AES-256-GCM + KMS
- SMS como única opción MFA
- Sin backup codes al enrolar
- Backup codes en claro — hashear Argon2id
- Sin rate limit en `/verify` — brute force trivial
- Window TOTP >±1 step
- No actualizar counter WebAuthn
- Preguntas secretas como recovery
- Mismo OTP válido más de una vez
- No invalidar sesiones al desactivar MFA
- Reutilizar challenge WebAuthn entre requests
- SMS a menores
- Sin logging de eventos MFA

## Checklist

- [ ] Roles con MFA obligatorio vs opcional definidos
- [ ] Factores soportados (mínimo TOTP + backup codes)
- [ ] Schema `user_mfa` + `mfa_backup_codes` + `mfa_events` migrado
- [ ] KMS configurado para encriptar secrets
- [ ] Endpoints: enroll, verify, disable, backup/regenerate
- [ ] Recovery flow con email + backup code
- [ ] Rate limiting en verify con Redis
- [ ] Step-up middleware en endpoints sensibles
- [ ] UI enrolamiento con QR + backup codes
- [ ] UI login con fallback entre métodos
- [ ] Logging en mfa_events
- [ ] Alertas: 3+ fallos, recovery iniciado, MFA desactivado
- [ ] Tests: enroll, verify ±30s drift, backup single-use, rate limit
- [ ] Documentación soporte (pérdida de acceso)
- [ ] Retención mfa_events ≥1 año

## Delegación

- `/scaffold-go` — scaffold endpoints Go
- `/doc-rfc` — documentar decisión técnica
- `/deploy-check` — checklist pre-deploy
- `/audit-dev` — auditar seguridad del flujo
