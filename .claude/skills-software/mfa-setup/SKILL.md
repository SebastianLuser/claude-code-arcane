---
name: mfa-setup
description: "MFA/2FA implementation: TOTP, WebAuthn/Passkeys, SMS OTP, backup codes, recovery, step-up auth."
category: "security"
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

Rate limit en todos los endpoints MFA con Redis sliding window.

> → Read references/rate-limiting.md for límites y lockout por endpoint

## Schema DB

Tablas: `user_mfa`, `mfa_backup_codes`, `mfa_events`.

> → Read references/schema-db.md for esquema detallado de cada tabla

## Reglas por rol

Admins+docentes obligatorio, alumnos adultos opcional, menores nunca SMS.

> → Read references/role-rules.md for tabla detallada por rol con métodos y step-up maxAge

## Anti-patterns

> → Read references/anti-patterns.md for lista completa (13 items)

## Delegación

- `/scaffold-go` — scaffold endpoints Go
- `/doc-rfc` — documentar decisión técnica
- `/deploy-check` — checklist pre-deploy
- `/audit-dev` — auditar seguridad del flujo

## Checklist

> → Read references/checklist.md for checklist completo (15 items)

- [ ] Factor selection justified per user role (WebAuthn preferred, TOTP universal, SMS recovery-only)
- [ ] Recovery flow designed with backup codes and email verification
- [ ] Rate limits configured on all MFA verification endpoints (Redis sliding window)
- [ ] Backup codes generated, shown once, and stored as Argon2id hashes
- [ ] Step-up auth configured for sensitive operations (change email, export data, delete account)
- [ ] TOTP secrets encrypted at rest (AES-256-GCM + KMS, never stored in plaintext)
