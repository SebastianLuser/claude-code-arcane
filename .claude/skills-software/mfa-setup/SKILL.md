---
name: mfa-setup
description: Implementación de Multi-Factor Authentication (MFA/2FA) en productos Educabot. TOTP, WebAuthn/Passkeys, SMS OTP, backup codes, recovery y step-up auth. Stack Go + TS (React/RN). Usar cuando se mencione MFA, 2FA, autenticación de dos factores, TOTP, passkeys, WebAuthn, OTP, Authenticator, segundo factor, verificación en dos pasos.
---

# MFA Setup — Educabot

Guía para implementar MFA de forma segura en productos Educabot (docentes, admins, alumnos). Prioriza WebAuthn/Passkeys como método moderno, TOTP como universal, SMS solo recovery.

## Cuándo usar

- Agregar 2FA a un backend Go o Node/TS existente
- Integrar Passkeys/WebAuthn en web (React+Vite) o mobile (RN)
- Diseñar flujo de enrolamiento, verificación, recovery
- Definir schema de DB para credenciales MFA
- Proteger endpoints sensibles con step-up auth

## Cuándo NO usar

- Solo login social (OAuth) sin factor adicional → no es MFA real
- Apps puramente consumer de alumnos menores sin datos sensibles (valorar UX vs riesgo)
- "Magic links" por email como único factor → eso es passwordless, no MFA

---

## 1. Elección de factores

| Factor | Recomendado | Riesgo | Librería |
|---|---|---|---|
| WebAuthn/Passkeys | SI (preferido 2026+) | Bajo | `@simplewebauthn/server`, `go-webauthn/webauthn` |
| TOTP (RFC 6238) | SI (default universal) | Medio (phishable) | `otplib` (Node), `pquerna/otp` (Go) |
| SMS OTP | Solo recovery | Alto (SIM swap) | Twilio Verify, MessageBird |
| Backup codes | Obligatorio | Bajo si hash correcto | custom + Argon2id |

**Regla Educabot:**
- Admins y docentes: MFA obligatorio (mínimo TOTP o Passkey)
- Alumnos adultos: MFA opcional
- Alumnos menores: NO SMS (protección de datos), solo TOTP/Passkey parental si aplica

---

## 2. TOTP (RFC 6238)

### 2.1 Enrolamiento (Go con `pquerna/otp`)

```go
import "github.com/pquerna/otp/totp"

key, err := totp.Generate(totp.GenerateOpts{
    Issuer:      "Educabot",
    AccountName: user.Email,
    Period:      30,
    Digits:      otp.DigitsSix,
    Algorithm:   otp.AlgorithmSHA1, // compatible con Google Authenticator
})
// key.Secret() -> BASE32, guardar encriptado (AES-256-GCM con KMS)
// key.URL() -> otpauth://totp/Educabot:user@x?secret=BASE32&issuer=Educabot
// Generar QR con skip2/go-qrcode
```

### 2.2 Enrolamiento (Node con `otplib`)

```ts
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

const secret = authenticator.generateSecret(); // BASE32
const otpauth = authenticator.keyuri(user.email, 'Educabot', secret);
const qrDataUrl = await QRCode.toDataURL(otpauth);
// Guardar secret ENCRIPTADO (no en claro). Mostrar QR al user una sola vez.
```

### 2.3 Verificación

```ts
const isValid = authenticator.verify({ token: userInput, secret });
// window ±1 step (30s) por drift de reloj. NO mayor.
```

Confirmar enrolamiento solo cuando el user ingrese un código válido (prueba que escaneó).

---

## 3. WebAuthn / Passkeys

### 3.1 Registro (backend Node)

```ts
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';

// POST /mfa/webauthn/register/start
const options = await generateRegistrationOptions({
  rpName: 'Educabot',
  rpID: 'educabot.com',
  userID: user.id,
  userName: user.email,
  attestationType: 'none',
  authenticatorSelection: {
    residentKey: 'preferred',
    userVerification: 'preferred',
  },
});
// Guardar options.challenge en sesión/redis (TTL 5min)

// POST /mfa/webauthn/register/finish
const verification = await verifyRegistrationResponse({
  response: body,
  expectedChallenge: savedChallenge,
  expectedOrigin: 'https://app.educabot.com',
  expectedRPID: 'educabot.com',
});
// Guardar credentialID, publicKey, counter en user_mfa
```

### 3.2 Login (ceremonia de autenticación)

Similar con `generateAuthenticationOptions` + `verifyAuthenticationResponse`. Actualizar `counter` cada uso (detecta clonado).

### 3.3 Cross-device

Passkeys se sincronizan vía iCloud Keychain (Apple) y Google Password Manager (Android/Chrome). No guardar el private key, solo public key + credentialID.

---

## 4. SMS OTP (solo recovery)

```ts
// Twilio Verify
await twilio.verify.v2.services(SERVICE_SID)
  .verifications.create({ to: phone, channel: 'sms' });

await twilio.verify.v2.services(SERVICE_SID)
  .verificationChecks.create({ to: phone, code });
```

- Nunca como factor primario (SIM swap, phishing por SMS)
- Nunca para menores de edad
- Rate limit agresivo: 3 SMS/hora por número

---

## 5. Backup codes

```ts
import argon2 from 'argon2';
import { randomBytes } from 'crypto';

// Generar 10 códigos, mostrar UNA VEZ
const codes = Array.from({length: 10}, () =>
  randomBytes(5).toString('hex').match(/.{1,4}/g)!.join('-') // e.g. a1b2-c3d4-e5
);

// Guardar solo hash
for (const code of codes) {
  const hash = await argon2.hash(code, { type: argon2.argon2id });
  await db.mfa_backup_codes.insert({ user_id, code_hash: hash });
}
```

Al usar un código: verificar hash, marcar `used_at`, invalidar. Si quedan < 3, avisar al user para regenerar.

---

## 6. Recovery flow

```
1. User click "No tengo acceso a mi 2FA"
2. Request: email + 1 backup code válido
3. Enviar link de recovery al email (TTL 15min, single-use)
4. User confirma → desactivar MFA → forzar re-enrolamiento
```

- NO usar preguntas secretas (inseguras, respuestas públicas en RRSS)
- Log detallado de cada recovery (alerta a seguridad)
- Si no hay backup codes ni email: proceso manual con validación de identidad (docente → institución admin)

---

## 7. Step-up authentication

Requerir MFA aunque la sesión esté activa, para acciones sensibles:

- Cambio de email / password
- Cambio de número de teléfono
- Export de datos (LGPD/GDPR)
- Eliminación de cuenta
- Cambios de permisos (admin → super-admin)
- Acceso a datos de alumnos (docentes viendo PII)

```go
// Middleware
func RequireStepUp(maxAge time.Duration) gin.HandlerFunc {
    return func(c *gin.Context) {
        lastMfa := getLastMfaTimestamp(c)
        if time.Since(lastMfa) > maxAge {
            c.JSON(403, gin.H{"error": "step_up_required"})
            c.Abort()
            return
        }
        c.Next()
    }
}
// Uso: router.POST("/account/email", RequireStepUp(5*time.Minute), handler)
```

---

## 8. Rate limiting

| Endpoint | Límite | Lockout |
|---|---|---|
| `/mfa/verify` (TOTP/SMS) | 5 intentos / 5 min por (user+IP) | 15 min |
| `/mfa/webauthn/authenticate` | 10 / 5 min | 15 min |
| `/mfa/sms/send` | 3 / hora por número | 24h si abuso |
| `/mfa/recovery/start` | 3 / día por email | alerta manual |

Usar Redis con sliding window o token bucket. Loguear cada lockout.

---

## 9. Schema de base de datos

```sql
CREATE TABLE user_mfa (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(20) NOT NULL CHECK (type IN ('totp','webauthn','sms')),
    -- TOTP
    secret_encrypted BYTEA,                 -- AES-256-GCM, key en KMS
    -- WebAuthn
    credential_id    BYTEA UNIQUE,
    public_key       BYTEA,
    counter          BIGINT DEFAULT 0,
    transports       TEXT[],                 -- ['internal','hybrid']
    device_name      VARCHAR(100),           -- "iPhone de Juan"
    -- SMS
    phone_encrypted  BYTEA,
    -- Metadata
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    last_used_at     TIMESTAMPTZ,
    verified_at      TIMESTAMPTZ             -- null hasta primer uso exitoso
);
CREATE INDEX idx_user_mfa_user ON user_mfa(user_id);

CREATE TABLE mfa_backup_codes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash   TEXT NOT NULL,              -- Argon2id
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_backup_codes_user ON mfa_backup_codes(user_id) WHERE used_at IS NULL;

CREATE TABLE mfa_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    event_type  VARCHAR(40) NOT NULL,       -- 'enrolled','verified','failed','recovery','disabled'
    mfa_type    VARCHAR(20),
    ip          INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 10. Reglas Educabot por rol

| Rol | MFA | Métodos permitidos | Step-up |
|---|---|---|---|
| Super-admin | Obligatorio | Passkey + TOTP (2 factores) | 2 min |
| Admin institución | Obligatorio | Passkey o TOTP | 5 min |
| Docente | Obligatorio | Passkey o TOTP; SMS solo recovery | 10 min |
| Alumno adulto (16+) | Opcional | TOTP o Passkey | 15 min |
| Alumno menor | NO obligatorio | TOTP (vía tutor); NUNCA SMS | N/A |

---

## Anti-patterns

- ❌ Guardar TOTP secret en claro en DB — siempre AES-256-GCM con KMS
- ❌ SMS como única opción de MFA — vulnerable a SIM swap
- ❌ No entregar backup codes al enrolar — usuarios se quedan fuera
- ❌ Backup codes en claro — hashear con Argon2id
- ❌ Sin rate limit en `/verify` — brute force trivial (10^6 combinaciones)
- ❌ Window TOTP > ±1 step — facilita replay
- ❌ No actualizar `counter` WebAuthn — no detecta credencial clonada
- ❌ Preguntas secretas como recovery — inseguras
- ❌ Mismo código OTP válido más de una vez
- ❌ No invalidar sesiones al desactivar MFA
- ❌ Reutilizar challenge WebAuthn entre requests
- ❌ SMS a menores de edad
- ❌ MFA sin logging de eventos — imposible auditar incidentes

---

## Checklist de implementación

- [ ] Definir qué roles requieren MFA (obligatorio vs opcional)
- [ ] Elegir factores soportados (mínimo: TOTP + backup codes)
- [ ] Schema `user_mfa` + `mfa_backup_codes` + `mfa_events` migrado
- [ ] KMS configurado para encriptar secrets (AWS KMS / GCP KMS)
- [ ] Endpoints: `/mfa/enroll`, `/mfa/verify`, `/mfa/disable`, `/mfa/backup/regenerate`
- [ ] Recovery flow con email + backup code
- [ ] Rate limiting en `/verify` (5/5min) con Redis
- [ ] Step-up middleware en endpoints sensibles
- [ ] UI de enrolamiento con QR + copia de backup codes
- [ ] UI de login con fallback entre métodos
- [ ] Logging en `mfa_events` de cada enroll/verify/fail/disable
- [ ] Alertas: 3+ fallos consecutivos, recovery iniciado, MFA desactivado
- [ ] Tests: enroll happy path, verify con drift ±30s, backup code single-use, rate limit
- [ ] Documentación para soporte (qué hacer si user pierde acceso)
- [ ] Política de retención de `mfa_events` (mínimo 1 año por compliance)

---

## Output ✅

Al terminar deberías tener:

- ✅ Migrations aplicadas (`user_mfa`, `mfa_backup_codes`, `mfa_events`)
- ✅ Endpoints de enrolamiento y verificación funcionando con tests
- ✅ Secrets encriptados con KMS, nunca en claro ni en logs
- ✅ Backup codes hasheados con Argon2id, mostrados una sola vez
- ✅ Rate limiting activo con métricas observables
- ✅ Step-up auth protegiendo endpoints sensibles
- ✅ UI clara para enroll, login, recovery y regenerar backup codes
- ✅ Eventos auditables en `mfa_events`
- ✅ Runbook de soporte para recovery manual

---

## Delegación

- Para scaffold inicial de endpoints Go → `/scaffold-go`
- Para documentar la decisión técnica → `/doc-rfc`
- Para checklist pre-deploy → `/deploy-check`
- Para auditar seguridad del flujo ya implementado → `/audit-dev`
- Para sincronizar variables de entorno (KMS keys, Twilio SID) → `/env-sync`
- Para generar diagrama ER de las tablas MFA → `/db-diagram`
- Para post-mortem si hay brecha → `/incident`
