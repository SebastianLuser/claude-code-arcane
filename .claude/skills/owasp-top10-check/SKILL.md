---
name: owasp-top10-check
description: Checklist y guía de revisión de seguridad basada en OWASP Top 10 (2021, referencia draft 2025) aplicada al stack Educabot (Go + TypeScript, React + Vite). Usar cuando se mencione auditoría de seguridad, revisión OWASP, hardening, pre-deploy security, pentest, vulnerabilidades, compliance (LGPD/COPPA).
stack: Go, TypeScript, React + Vite, PostgreSQL, GCP/AWS
owner: Educabot Security / Plataforma
lastUpdated: 2026-04-15
references:
  - https://owasp.org/Top10/ (2021, vigente)
  - https://owasp.org/www-project-top-ten/ (draft 2025 — revisar actualizaciones)
argument-hint: "[category 1-10 | all]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Task
---
# OWASP Top 10 Check — Educabot

Guía operativa para auditar aplicaciones Educabot contra OWASP Top 10 2021. Enfocada en Go (backend) y TypeScript/React+Vite (frontend/BFF). Pensada para productos que manejan **datos de menores de edad** — compliance LGPD (Brasil) y COPPA (USA) es obligatorio, no opcional.

## Cuándo usar

- Antes de un release mayor a producción
- Pre-deploy de features que tocan auth, pagos o PII de menores
- Auditorías trimestrales de plataforma
- Onboarding de nuevos servicios al ecosistema Educabot
- Preparación para pentest externo o bug bounty
- Investigación post-incidente de seguridad

## Cuándo NO usar

- Para microfixes o PRs triviales (usar `/check` simple)
- Como único control de seguridad (complementar con threat modeling, pentest, SAST/DAST en CI)
- Reemplazo de revisión humana de seguridad en flujos críticos (auth, pagos)
- En etapas muy tempranas de prototipo — priorizar threat modeling primero

---

## 1. A01: Broken Access Control

**Descripción:** El atacante accede a recursos o funciones fuera de su scope autorizado. Es la categoría #1 en frecuencia y criticidad. Incluye IDOR (Insecure Direct Object Reference), forced browsing, privilege escalation horizontal y vertical, bypass de middleware.

### Qué revisar
- Todos los endpoints REST/gRPC tienen middleware de autenticación **explícito**.
- Endpoints que operan sobre recursos verifican **ownership** (`resource.user_id == session.user_id`) o RBAC/ABAC.
- Row Level Security (RLS) habilitado en tablas con PII de alumnos.
- No se usa el `id` del path como única fuente de verdad de autorización.
- `/admin/*` tiene guard de rol separado; no depende solo de "ocultar" el menú.
- Frontend **nunca** es autoridad: no confiar en `user.role` del localStorage.
- CORS con whitelist estricta (ver A05).

### Ejemplo vulnerable (Go)
```go
// ❌ No verifica que la nota pertenezca al usuario autenticado
func GetGrade(c *gin.Context) {
    id := c.Param("id")
    var grade Grade
    db.First(&grade, id)
    c.JSON(200, grade) // IDOR: /api/grades/123 revela cualquier nota
}
```

### Ejemplo seguro (Go)
```go
func GetGrade(c *gin.Context) {
    id := c.Param("id")
    userID := c.MustGet("userID").(uint)
    var grade Grade
    if err := db.Where("id = ? AND user_id = ?", id, userID).First(&grade).Error; err != nil {
        c.AbortWithStatus(http.StatusNotFound) // mismo status que 403 para no filtrar existencia
        return
    }
    c.JSON(200, grade)
}
```

### Ejemplo seguro (TS / Express)
```ts
app.get('/api/grades/:id', requireAuth, async (req, res) => {
  const grade = await prisma.grade.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!grade) return res.sendStatus(404);
  res.json(grade);
});
```

### Herramientas
- Semgrep rules `r2c-security-audit`
- Burp Suite / OWASP ZAP (forced browsing, IDOR testing)
- Tests de autorización automatizados por endpoint (matriz rol × endpoint)
- **Delegar a:** `/rbac-abac` para diseño de permisos

---

## 2. A02: Cryptographic Failures

**Descripción:** Datos sensibles expuestos en tránsito o en reposo por uso incorrecto (o ausencia) de criptografía. Antes llamada "Sensitive Data Exposure".

### Qué revisar
- TLS 1.2+ obligatorio en todos los ingresos; TLS 1.3 preferido.
- Passwords hasheadas con **Argon2id** (preferido) o **bcrypt (cost ≥ 10)**. Nunca MD5/SHA1/SHA256 plano.
- JWT firmados con **RS256/EdDSA**, no `HS256` con secreto compartido entre servicios.
- Secretos fuera del repo: Secret Manager (GCP), AWS Secrets Manager, Vault. Nunca en `.env` commiteado.
- PII de menores cifrada en reposo (columnas sensibles con pgcrypto o KMS envelope).
- No loggear tokens, cookies de sesión, passwords, CPF/DNI.
- HSTS habilitado (`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`).
- Cookies con `Secure`, `HttpOnly`, `SameSite=Lax|Strict`.

### Ejemplo vulnerable (Go)
```go
// ❌ SHA1 + sin salt
hash := sha1.Sum([]byte(password))
```

### Ejemplo seguro (Go)
```go
import "golang.org/x/crypto/bcrypt"
hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
// verificación
err = bcrypt.CompareHashAndPassword(storedHash, []byte(input))
```

### Ejemplo seguro (TS)
```ts
import * as argon2 from 'argon2';
const hash = await argon2.hash(password, { type: argon2.argon2id });
const ok = await argon2.verify(hash, input);
```

### Herramientas
- `gosec` (detección de crypto débil en Go)
- `semgrep` reglas `javascript.lang.security.audit.weak-crypto`
- `trufflehog` / `gitleaks` para secretos en historia git
- **Delegar a:** `/secret-management`, `/jwt-strategy`

---

## 3. A03: Injection

**Descripción:** SQL, NoSQL, OS command, LDAP, template injection. Ocurre cuando input no confiable se concatena en un intérprete sin separación de código y datos.

### Qué revisar
- **Siempre** prepared statements / parametrización. Nunca `fmt.Sprintf` para queries.
- ORM (GORM, Prisma) usado correctamente — cuidado con `db.Raw()` y `$queryRawUnsafe`.
- Validación de input en el boundary (handlers) con structs tipados + validadores (`go-playground/validator`, `zod`).
- Comandos OS (`exec.Command`) con argv separado, no shell string.
- Templates (`html/template` en Go, React por defecto) escapan por defecto — cuidado con `dangerouslySetInnerHTML` y `template.HTML`.
- NoSQL: no aceptar objetos arbitrarios como filtros (Mongo operator injection).

### Ejemplo vulnerable (Go)
```go
// ❌ SQL injection trivial
query := fmt.Sprintf("SELECT * FROM students WHERE name = '%s'", c.Query("name"))
db.Raw(query).Scan(&students)
```

### Ejemplo seguro (Go, database/sql)
```go
rows, err := db.Query("SELECT * FROM students WHERE name = $1", name)
// o GORM
db.Where("name = ?", name).Find(&students)
```

### Ejemplo seguro (TS, Prisma)
```ts
const students = await prisma.student.findMany({ where: { name } });
// Si necesitás SQL crudo:
await prisma.$queryRaw`SELECT * FROM students WHERE name = ${name}`;
```

### Herramientas
- `gosec` G201/G202
- `semgrep` `sql-injection` rulesets
- `sqlmap` para testing manual
- Code review obligatorio en PRs con queries crudas

---

## 4. A04: Insecure Design

**Descripción:** Falla estructural de diseño: ausencia de threat modeling, modelos de negocio vulnerables, falta de defensa en profundidad. No se arregla con un parche — requiere repensar el flujo.

### Qué revisar
- Features sensibles tienen **threat model** documentado (STRIDE o similar) antes de implementar.
- Rate limiting en endpoints públicos (login, signup, password reset, APIs sin auth).
- Retry + exponential backoff en llamadas externas.
- Límites de negocio (ej. máx 10 intentos de login/hora, máx 100 requests/min por IP).
- Flujos de recuperación de cuenta no permiten enumeración de usuarios ("email no existe" vs "password incorrecta" → mismo mensaje).
- Separación de ambientes (dev/staging/prod) con datos distintos — nunca PII real en staging.
- Kill switches / feature flags para desactivar features comprometidas.

### Ejemplo vulnerable
- Endpoint de reset password sin rate limit → atacante dispara 10k emails/hora.
- Login que responde distinto si el usuario existe o no → enumeración.

### Ejemplo seguro
- Middleware `rate-limit` (Redis + token bucket) en todos los endpoints unauth.
- Respuestas genéricas en auth: "credenciales inválidas" siempre.

### Herramientas
- Threat modeling workshops (Microsoft Threat Modeling Tool, OWASP Threat Dragon)
- **Delegar a:** `/rate-limiting`

---

## 5. A05: Security Misconfiguration

**Descripción:** Configuraciones default, permisivas o inseguras. Incluye stack traces en prod, buckets públicos, headers faltantes, CORS abierto, features debug en prod.

### Qué revisar
- `NODE_ENV=production`, `GIN_MODE=release` en prod.
- CORS con **whitelist explícita**, nunca `*` con credentials.
- Security headers: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- Buckets GCS/S3 privados por default, URLs firmadas de corta duración para acceso.
- Endpoints `/debug/*`, `/pprof`, `/_health` detallados deshabilitados o auth-gated en prod.
- Stack traces no se devuelven al cliente; se loggean server-side con trace ID.
- Imágenes Docker: non-root user, mínima (distroless/alpine), sin secrets en layers.
- Kubernetes: `securityContext` con `runAsNonRoot`, `readOnlyRootFilesystem`, `allowPrivilegeEscalation: false`.

### Ejemplo vulnerable
```go
// ❌ Gin en debug mode en prod + CORS abierto
router := gin.Default()
router.Use(cors.New(cors.Config{ AllowAllOrigins: true, AllowCredentials: true }))
```

### Ejemplo seguro
```go
gin.SetMode(gin.ReleaseMode)
router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"https://app.educabot.com"},
    AllowCredentials: true,
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
}))
```

### Herramientas
- `trivy config` / `checkov` sobre Dockerfiles, K8s manifests, Terraform.
- `securityheaders.com` / `observatory.mozilla.org` para scan de headers.
- **Delegar a:** `/csp-headers`, `/secret-management`

---

## 6. A06: Vulnerable and Outdated Components

**Descripción:** Dependencias con CVEs conocidos, versiones sin soporte, librerías sin auditar.

### Qué revisar
- `npm audit` / `pnpm audit` sin HIGH/CRITICAL abiertas.
- `govulncheck ./...` limpio.
- Dependabot o Renovate habilitado en el repo.
- Lockfiles commiteados (`package-lock.json`, `go.sum`).
- SBOM generado en cada release (Syft / CycloneDX).
- Imágenes base Docker actualizadas regularmente (pin por digest, no `:latest`).
- Librerías abandonadas detectadas (último commit > 1 año + no mantenidas).

### Ejemplo CI (GitHub Actions)
```yaml
- name: Go vuln check
  run: |
    go install golang.org/x/vuln/cmd/govulncheck@latest
    govulncheck ./...

- name: NPM audit
  run: pnpm audit --audit-level=high

- name: Trivy filesystem scan
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: fs
    severity: HIGH,CRITICAL
    exit-code: 1
```

### Herramientas
- `govulncheck`, `npm audit`, `trivy`, `snyk`, `grype`
- **Delegar a:** `/deps-audit`

---

## 7. A07: Identification and Authentication Failures

**Descripción:** Fallas en manejo de identidad: brute force, credential stuffing, sesiones predecibles, MFA ausente, password policies débiles.

### Qué revisar
- Rate limit agresivo en `/login`, `/register`, `/password-reset` (ej. 5/min por IP + 10/hora por usuario).
- MFA disponible al menos para cuentas docentes/admin (TOTP mínimo).
- Password policy: mínimo 12 chars, contra diccionario de leaked passwords (HaveIBeenPwned API).
- Session IDs generados con CSPRNG, no predecibles.
- Session fixation prevention: regenerar ID post-login.
- Logout invalida server-side (blacklist JWT o sesiones server-side).
- Cookies con `SameSite=Lax`, `Secure`, `HttpOnly`.
- Tokens de reset password: one-time, expiran en ≤ 30min, firmados.
- Cuentas de menores: **sin** login por redes sociales sin consentimiento parental documentado (COPPA).

### Ejemplo vulnerable
- Login sin rate limit → credential stuffing trivial.
- JWT sin expiración o con expiración de 1 año.

### Herramientas
- Captcha / hCaptcha en signup y reset
- Monitoreo de intentos fallidos por IP/usuario → alertas
- **Delegar a:** `/mfa-setup`, `/oauth-setup`, `/jwt-strategy`

---

## 8. A08: Software and Data Integrity Failures

**Descripción:** Confianza en software, datos o CI/CD sin verificación de integridad. Incluye deserialización insegura y pipelines comprometibles.

### Qué revisar
- Artefactos de build firmados (cosign / Sigstore).
- Pipeline CD con provenance (SLSA level 2+).
- `package-lock.json` / `go.sum` **commiteados y verificados** en CI.
- Dependencias instaladas con `npm ci` (no `npm install`) en CI.
- No auto-update de software en prod sin signature verification.
- Deserialización de JSON/YAML/XML a tipos explícitos, no `interface{}` / `any` sin validación.
- No `eval`, `Function()`, `gob.Decode` sobre input externo.
- Webhooks firmados (HMAC) y verificados en recepción.
- Imágenes Docker pinneadas por digest (`FROM golang@sha256:...`), no por tag mutable.

### Ejemplo vulnerable (TS)
```ts
// ❌ eval de payload externo
const config = eval(userProvidedScript);
```

### Ejemplo seguro
```ts
const config = ConfigSchema.parse(JSON.parse(userProvidedJson)); // zod
```

### Herramientas
- `cosign` para firmar y verificar imágenes
- `syft` + `grype` para SBOM + vuln scan
- Branch protection en main + required reviewers

---

## 9. A09: Security Logging and Monitoring Failures

**Descripción:** Ausencia de logs, alertas o monitoreo imposibilita detectar y responder a incidentes.

### Qué revisar
- Eventos auth loggeados: login success/fail, logout, password reset, MFA challenge, cambios de permisos.
- Audit log **inmutable** para acciones sensibles (write-only, WORM o append-only).
- Logs estructurados (JSON) con trace ID correlacionable entre servicios.
- **Nunca** loggear: passwords, tokens, cookies, datos de tarjetas, PII completa de menores.
- Alertas configuradas: spikes de 5xx, intentos de login fallidos masivos, accesos desde geografías inusuales.
- Retención acorde a compliance (LGPD: depende del propósito; logs auth mínimo 6 meses recomendado).
- Plan de respuesta a incidentes documentado y ensayado.

### Ejemplo vulnerable
- Login falla silenciosamente sin log → credential stuffing pasa desapercibido semanas.

### Ejemplo seguro (Go, structured)
```go
logger.Info("auth.login.failed",
    "user_id", userID,
    "ip", clientIP,
    "trace_id", traceID,
    "reason", "invalid_password",
)
```

### Herramientas
- Stack Cloud Logging / Datadog / Grafana Loki
- **Delegar a:** `/logging-setup`, `/audit-log`, `/error-tracking`

---

## 10. A10: Server-Side Request Forgery (SSRF)

**Descripción:** El servidor realiza un HTTP request a una URL controlada por el usuario sin validar destino. Permite acceso a recursos internos (metadata de cloud, servicios internos, localhost).

### Qué revisar
- Features que hacen outbound basado en input: avatar por URL, webhook receivers, importers, link previews, OAuth redirect.
- **Whitelist** de dominios permitidos para outbound cuando el input es user-controlled.
- Bloquear IPs privadas: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16` (metadata GCP/AWS: `169.254.169.254`), `::1`, `fc00::/7`.
- Resolver DNS una sola vez y validar **la IP resuelta**, no solo el hostname (evita DNS rebinding).
- Usar un **egress proxy dedicado** con allowlist para llamadas externas.
- Deshabilitar redirects o limitarlos a 1-2 máximo y revalidar destino.
- Disable URL schemes peligrosos: `file://`, `gopher://`, `dict://`, `ftp://`.

### Ejemplo vulnerable (Go)
```go
// ❌ Avatar por URL sin validar destino
resp, _ := http.Get(userProvidedURL) // puede ir a http://169.254.169.254/computeMetadata/v1/
```

### Ejemplo seguro (Go, concepto)
```go
func safeFetch(rawURL string) ([]byte, error) {
    u, err := url.Parse(rawURL)
    if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
        return nil, errors.New("invalid scheme")
    }
    ips, err := net.LookupIP(u.Hostname())
    if err != nil { return nil, err }
    for _, ip := range ips {
        if ip.IsPrivate() || ip.IsLoopback() || ip.IsLinkLocalUnicast() {
            return nil, errors.New("blocked destination")
        }
    }
    client := &http.Client{
        Timeout: 5 * time.Second,
        CheckRedirect: func(req *http.Request, via []*http.Request) error {
            return http.ErrUseLastResponse // validar redirects manualmente
        },
    }
    resp, err := client.Get(rawURL)
    // ...
}
```

### Herramientas
- Egress proxy (Envoy, Squid) con allowlist
- `semgrep` reglas SSRF
- Testing manual con Burp Collaborator

---

## Herramientas automáticas recomendadas

| Categoría | Go | TypeScript/JS | Genérico |
|---|---|---|---|
| SAST | `gosec`, `staticcheck` | `semgrep`, `eslint-plugin-security` | `semgrep` |
| Dep scan | `govulncheck` | `npm audit`, `pnpm audit`, `snyk` | `trivy fs`, `grype` |
| Container | — | — | `trivy image`, `grype`, `docker scout` |
| IaC | — | — | `checkov`, `tfsec`, `trivy config` |
| DAST | — | — | OWASP ZAP, Burp Suite |
| Secrets | — | — | `gitleaks`, `trufflehog` |

### Semgrep en CI (ejemplo)
```yaml
- name: Semgrep
  uses: returntocorp/semgrep-action@v1
  with:
    config: >
      p/owasp-top-ten
      p/security-audit
      p/secrets
      p/javascript
      p/golang
```

---

## Pre-deploy security checklist

- [ ] `gosec` y `govulncheck` limpios (backend Go)
- [ ] `pnpm audit --audit-level=high` limpio (frontend/BFF)
- [ ] `trivy image` sin CRITICAL
- [ ] Secretos en Secret Manager, no en env vars planos
- [ ] CORS whitelist revisada
- [ ] Security headers (CSP, HSTS, XFO) configurados
- [ ] Rate limit en endpoints unauth
- [ ] Logs de auth habilitados + alertas configuradas
- [ ] MFA disponible en roles admin/docente
- [ ] Backups + plan de rollback probado
- [ ] Feature flag / kill switch para features nuevas
- [ ] Threat model de la feature actualizado

---

## Bug bounty / Responsible disclosure

Mantener en producción:
- `/.well-known/security.txt` con:
  ```
  Contact: mailto:security@educabot.com
  Expires: 2027-01-01T00:00:00Z
  Preferred-Languages: es, pt, en
  Policy: https://educabot.com/security/disclosure
  ```
- Email `security@educabot.com` monitoreado.
- SLA de triage público (ej. 72h primera respuesta).
- Safe harbor claim para investigadores que sigan la política.

---

## Consideraciones específicas Educabot

Educabot opera con **datos de menores de edad** en LatAm. Implicaciones:

- **LGPD (Brasil):** consentimiento parental para menores de 12. Minimización de datos. Derecho al olvido operativo.
- **COPPA (USA):** si hay usuarios US menores de 13, consentimiento verificable de padres antes de recolectar PII.
- **A01 (Access Control) y A02 (Crypto) son críticos** — fuga de datos de menores es tanto penal como reputacional catastrófico.
- PII de alumnos (nombre, escuela, notas) debe cifrarse en reposo y accederse con audit log.
- Logs no deben contener PII completa de menores en claro (hashear/truncar).
- Chatbots / features de IA: prohibir que modelos aprendan de datos de menores sin opt-in parental.

---

## Anti-patterns

- ❌ "Vamos a seguridad en la próxima iteración" → nunca llega; seguridad es pre-requisito, no feature.
- ❌ Depender solo de WAF o Cloudflare → bypasseable; seguridad en depth.
- ❌ Correr scanners y no fixear los findings → peor que no correrlos (falso sentido de seguridad).
- ❌ Enfocar seguridad solo en backend e ignorar frontend → XSS, CSP, secrets en bundle, localStorage con tokens.
- ❌ Postergar patches de seguridad por "no entrar en el sprint" → CVEs no esperan al PO.
- ❌ Roles hardcodeados en el frontend como única defensa.
- ❌ `"eval"` / `exec()` sobre contenido de usuario, aunque sea "solo admins".
- ❌ Copy-paste de snippets de StackOverflow con queries concatenadas.
- ❌ `dangerouslySetInnerHTML` con contenido que viene de la API sin sanitize.
- ❌ JWT en `localStorage` sin plan de mitigación de XSS.
- ❌ Logs con passwords, tokens, o CPF/DNI completos.
- ❌ Buckets cloud públicos "temporalmente" para debugging.

---

## Output ✅ — formato del reporte

Al finalizar la auditoría, entregar:

```markdown
# OWASP Top 10 Audit — <servicio> — <fecha>

## Resumen ejecutivo
- Alcance: <repos/servicios auditados>
- Hallazgos críticos: N
- Hallazgos altos: N
- Hallazgos medios: N
- Hallazgos bajos: N

## Hallazgos por categoría

### A01 Broken Access Control — [CRÍTICO / ALTO / MEDIO / BAJO / OK]
- Archivo:línea
- Descripción
- PoC
- Remediación propuesta
- Ticket Jira: ALZ-XXX

... (repetir para A02-A10)

## Plan de remediación priorizado
1. [CRÍTICO] ...
2. [ALTO] ...

## Herramientas ejecutadas
- gosec: vX.Y, findings: N
- govulncheck: ...
- trivy: ...

## Próximos pasos
- [ ] Crear tickets en Jira (usar `/jira-tickets`)
- [ ] Programar re-scan en 30 días
```

---

## Delegación a otros skills

- `/rbac-abac` — diseño de permisos (A01)
- `/secret-management` — manejo de secretos (A02, A05)
- `/jwt-strategy` — estrategia de tokens (A02, A07)
- `/rate-limiting` — rate limits (A04, A07)
- `/csp-headers` — headers de seguridad (A05)
- `/mfa-setup` — multi-factor auth (A07)
- `/oauth-setup` — OAuth/OIDC (A07)
- `/deps-audit` — auditoría de dependencias (A06)
- `/logging-setup`, `/audit-log`, `/error-tracking` — observabilidad (A09)
- `/deploy-check` — checklist pre-deploy (integra esta skill)
- `/incident` — post-mortem si la auditoría surge de un incidente
- `/jira-tickets` — crear tickets de remediación

---

**Recordatorio:** OWASP Top 10 es piso, no techo. Para servicios críticos complementar con OWASP ASVS Level 2+, threat modeling formal, y pentest externo anual.
