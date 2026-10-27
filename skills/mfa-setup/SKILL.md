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

MFA for Educabot products (teachers, admins, students). WebAuthn/Passkeys preferred, TOTP universal, SMS for recovery only.

## When to use / NOT use

| Use | Do NOT use |
|------|---------|
| Add 2FA to a Go or Node/TS backend | Social login only (OAuth) with no additional factor |
| Integrate Passkeys in web (React+Vite) or mobile (RN) | Consumer apps for underage students with no sensitive data |
| Design enrollment, verification, recovery | Magic links as the only factor (passwordless ≠ MFA) |
| DB schema for MFA credentials | |
| Step-up auth on sensitive endpoints | |

## Factors

| Factor | Recommended | Risk | Library |
|--------|-------------|--------|----------|
| **WebAuthn/Passkeys** | Yes (preferred 2026+) | Low | `@simplewebauthn/server`, `go-webauthn/webauthn` |
| **TOTP (RFC 6238)** | Yes (universal default) | Medium (phishable) | `otplib` (Node), `pquerna/otp` (Go) |
| **SMS OTP** | Recovery only | High (SIM swap) | Twilio Verify, MessageBird |
| **Backup codes** | Mandatory | Low if hashed correctly | custom + Argon2id |

**Educabot rule:** MFA mandatory for admins+teachers (minimum TOTP/Passkey). Optional for adult students. Minors: NO SMS, only TOTP/parental Passkey.

## TOTP

- **Enrollment:** generate a BASE32 secret, store it encrypted (AES-256-GCM + KMS, never in plaintext). Generate the `otpauth://` URI → QR. Confirm enrollment only when the user enters a valid code.
- **Go:** `pquerna/otp` — `totp.Generate()` with Issuer "Educabot", Period 30, DigitsSix, AlgorithmSHA1 (Google Authenticator compatible)
- **TS:** `otplib` — `authenticator.generateSecret()` + `keyuri()` + QR via `qrcode`
- **Verification:** window ±1 step (30s) for drift. NO larger.

## WebAuthn / Passkeys

- **Registration:** `generateRegistrationOptions` (rpName "Educabot", rpID "educabot.com", attestationType "none", residentKey "preferred"). Store the challenge in the session/Redis with TTL 5min. Verify the response → store credentialID, publicKey, counter.
- **Login:** `generateAuthenticationOptions` + `verifyAuthenticationResponse`. Update the counter on every use (detects cloning).
- **Cross-device:** Passkeys sync via iCloud Keychain / Google Password Manager. Store only the public key + credentialID.

## SMS OTP (recovery only)

Twilio Verify for sending/verifying. Never the primary factor. Never for minors. Rate limit: 3 SMS/hour per number.

## Backup codes

Generate 10 codes, show them ONCE. Store only the Argon2id hash. On use: verify the hash, set `used_at`, invalidate. If fewer than 3 remain → prompt to regenerate.

## Recovery flow

1. "I can't access my 2FA" → email + 1 valid backup code
2. Recovery link to the email (TTL 15min, single-use)
3. Confirms → disable MFA → force re-enrollment
- NO secret questions. Detailed log + security alert. No backup and no email → manual identity validation (institution admin).

## Step-up auth

Require MFA even with an active session for: email/password/phone change, data export (LGPD/GDPR), account deletion, permission changes, access to student PII. Middleware checks `lastMfaTimestamp` against `maxAge`.

## Rate limiting

Rate limit every MFA endpoint with a Redis sliding window.

> → Read references/rate-limiting.md for limits and lockout per endpoint

## DB schema

Tables: `user_mfa`, `mfa_backup_codes`, `mfa_events`.

> → Read references/schema-db.md for the detailed schema of each table

## Rules per role

Mandatory for admins+teachers, optional for adult students, never SMS for minors.

> → Read references/role-rules.md for the detailed per-role table with methods and step-up maxAge

## Anti-patterns

> → Read references/anti-patterns.md for the full list (13 items)

## Delegation

- `/scaffold-go` — scaffold Go endpoints
- `/doc-rfc` — document the technical decision
- `/deploy-check` — pre-deploy checklist
- `/audit-dev` — audit the flow's security

## Checklist

> → Read references/checklist.md for the full checklist (15 items)

- [ ] Factor selection justified per user role (WebAuthn preferred, TOTP universal, SMS recovery-only)
- [ ] Recovery flow designed with backup codes and email verification
- [ ] Rate limits configured on all MFA verification endpoints (Redis sliding window)
- [ ] Backup codes generated, shown once, and stored as Argon2id hashes
- [ ] Step-up auth configured for sensitive operations (change email, export data, delete account)
- [ ] TOTP secrets encrypted at rest (AES-256-GCM + KMS, never stored in plaintext)
