---
name: secret-management
description: "Gestión de secrets para apps Educabot (Go/TS/React/RN): GCP Secret Manager, AWS Secrets Manager, Vault, SOPS, sealed-secrets, rotation, env vars safe loading, no-secret-in-repo, CI/CD secrets, KMS envelope encryption, dev/stage/prod separation, audit logs. Usar para: secrets, api keys, vault, secret manager, kms, sops, rotation, .env."
---

# secret-management — Secrets & Credentials

Guía para manejar secrets en Educabot sin filtrarlos. Regla de oro: **si está en git, está comprometido**.

## Cuándo usar

- Setup de cualquier app con API keys / DB passwords / JWT signing keys
- Rotación de credenciales
- CI/CD pipelines que necesitan secrets
- Audits de seguridad
- Incidente: secret leak

## Cuándo NO usar

- Config público (URLs, feature flags booleanos, nombres) → env vars normales
- Tools internos sin secrets reales

---

## 1. Qué es un secret

**Sí:** API keys, DB passwords, JWT signing keys, OAuth client secrets, service account JSON, private keys (TLS/SSH), session secrets, webhook signing secrets, encryption keys, tokens de pago.

**No secret:** URLs públicas, feature names, environment name, log levels.

**Regla:** si comprometido causa daño → secret.

---

## 2. Provider — decisión

| Provider | Pros | Cons | Cuándo |
|----------|------|------|--------|
| **GCP Secret Manager** | Integración GCP nativa, IAM fine-grained, versioning, audit | Solo GCP | **Default Educabot** (runtime GCP) |
| **AWS Secrets Manager** | Rotación automática en RDS, IAM | $0.40/secret/mes, solo AWS | Stack AWS |
| **HashiCorp Vault** | Multi-cloud, dynamic secrets, PKI | Ops pesado | Enterprise multi-cloud |
| **Doppler** | DX excelente, UI simple | SaaS, $$ a escala | Startups / equipos chicos |
| **1Password Secrets Automation** | UX top, CLI integrado | $$ | Equipos ya en 1Password |
| **SOPS + KMS** (archivos) | Secrets en git cifrados, diffeables | Necesita KMS, ops manual | GitOps / infra-as-code |
| **sealed-secrets** (k8s) | Secrets en git cifrados para k8s | Solo k8s | Argo/Flux GitOps |

**Default Educabot:** GCP Secret Manager (runtime) + SOPS con GCP KMS (infra/IaC en git).

---

## 3. Reglas inviolables

1. **Nunca** commitear `.env`, `*.pem`, `*.key`, `service-account.json`
2. `.env.example` sí en git con **valores dummy o vacíos**
3. `.gitignore` bloquea: `.env`, `.env.*`, `!*.example`, `*.key`, `*.pem`, `*.p12`, `secrets/`
4. Pre-commit hook con **gitleaks** o **trufflehog**
5. Rotar credencial **en cuanto se sospeche leak** — no esperar "por las dudas"
6. Un secret = un valor único por env (dev/stage/prod); nunca compartir prod con dev
7. Acceso a secrets prod: mínimo necesario, con audit log
8. CI con secrets masked en logs

---

## 4. GCP Secret Manager — setup

### Crear
```bash
# crear secret
echo -n "super-secret-value" | gcloud secrets create stripe-webhook-secret \
  --data-file=- \
  --replication-policy=automatic \
  --labels=env=prod,app=alizia

# nueva versión (rotación)
echo -n "new-value" | gcloud secrets versions add stripe-webhook-secret --data-file=-

# grant runtime service account
gcloud secrets add-iam-policy-binding stripe-webhook-secret \
  --member="serviceAccount:alizia-api@proj.iam.gserviceaccount.com" \
  --role=roles/secretmanager.secretAccessor
```

### Go
```go
import "cloud.google.com/go/secretmanager/apiv1"
import smpb "cloud.google.com/go/secretmanager/apiv1/secretmanagerpb"

func getSecret(ctx context.Context, name string) (string, error) {
  client, err := secretmanager.NewClient(ctx)
  if err != nil { return "", err }
  defer client.Close()
  res, err := client.AccessSecretVersion(ctx, &smpb.AccessSecretVersionRequest{
    Name: fmt.Sprintf("projects/%s/secrets/%s/versions/latest", projectID, name),
  })
  if err != nil { return "", err }
  return string(res.Payload.Data), nil
}
```

### Node/TS
```ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
const client = new SecretManagerServiceClient();

export async function getSecret(name: string): Promise<string> {
  const [v] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${name}/versions/latest`,
  });
  return v.payload?.data?.toString() ?? '';
}
```

**Cache en memoria con TTL** (5-15min) — no pegarle a Secret Manager por cada request.

---

## 5. Envelope encryption (KMS)

Para encriptar data sensible en DB (PII, tokens de 3rd party, secrets de tenant):

```
plaintext → cifra con DEK (data encryption key, random por registro/tenant)
DEK        → cifra con KEK (key encryption key, en KMS)
guarda     → ciphertext + DEK_encrypted en DB
```

Beneficios:
- KMS nunca ve el plaintext
- Rotar KEK sin re-cifrar todo (solo DEKs)
- Scope per-tenant si querés

```go
// ejemplo: cifrar refresh token de OAuth de un tenant externo
dek := rand32()
ct := aesgcm.Seal(nil, nonce, plaintext, nil)   // con DEK
dekCt := kms.Encrypt(kekName, dek)               // con KEK en GCP KMS
db.Save(tenantID, ct, dekCt, nonce)
```

---

## 6. Dev local — sin committear nada

### Opción A — `.env` ignorado + seed script
```bash
# scripts/dev-secrets.sh
gcloud secrets versions access latest --secret=stripe-test-key > .env.local
```

### Opción B — `doppler run` / `gcloud secrets run`
```bash
doppler run -- npm run dev
# inyecta secrets como env vars, no tocan disco
```

### Opción C — SOPS para secrets compartidos de dev
```bash
# team.env cifrado con KMS
sops --encrypt --gcp-kms projects/.../keyRings/.../cryptoKeys/dev team.env > team.env.enc
# commit team.env.enc
sops --decrypt team.env.enc > .env   # local
```

**Nunca** mandar secrets por Slack/email/Notion — usar vault share o 1Password.

---

## 7. CI/CD secrets

### GitHub Actions
```yaml
jobs:
  deploy:
    permissions: { id-token: write, contents: read }
    steps:
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/123/locations/global/workloadIdentityPools/gh/providers/repo
          service_account: deployer@proj.iam.gserviceaccount.com
      # no hay GCP_SA_KEY — usa OIDC
```

**Workload Identity Federation** (OIDC) >>> service account JSON como secret.

### Secrets masked
GitHub masca automáticamente valores de `secrets.*` en logs — pero `echo $SECRET | base64` los desenmascara; nunca hacerlo.

### GitLab
```yaml
deploy:
  id_tokens:
    GCP_TOKEN: { aud: "//iam.googleapis.com/projects/..." }
  script:
    - gcloud auth login --cred-file=<(echo "$GCP_TOKEN")
```

---

## 8. Kubernetes

### Sealed Secrets (GitOps)
```bash
kubectl create secret generic stripe --from-literal=key=sk_live_xxx -n alizia --dry-run=client -o yaml | \
  kubeseal -o yaml > sealed-stripe.yaml
# commit sealed-stripe.yaml — seguro, sólo el controller en cluster puede decrypt
```

### External Secrets Operator
Mejor en runtime — sincroniza desde Secret Manager → Secret de k8s.
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata: { name: stripe }
spec:
  refreshInterval: 1h
  secretStoreRef: { name: gcp-backend, kind: ClusterSecretStore }
  target: { name: stripe }
  data:
    - secretKey: STRIPE_SECRET_KEY
      remoteRef: { key: stripe-webhook-secret, version: latest }
```

---

## 9. Rotación

### Quién rota
- **Automático**: DB passwords con AWS Secrets Manager rotation, JWT signing keys vía rotación programada
- **Manual programado**: API keys de 3rd party (Stripe, OpenAI) — cada 90d o por política
- **Emergencia**: leak → **inmediato**

### Proceso estándar (sin downtime)
1. Crear nueva versión del secret
2. App lee ambas versiones durante ventana (`latest` + `previous`)
3. Rotate upstream (ej. nuevo key en Stripe)
4. Confirmar tráfico en nueva versión
5. Deshabilitar versión anterior (`gcloud secrets versions disable`)
6. Tras N días sin issues, `destroy`

### JWT signing keys
- Usar `kid` header + JWKS endpoint
- Nueva key publicada antes de empezar a firmar con ella (propagación caché)
- Mantener 2 keys activas (current + previous) durante ventana de TTL del token

---

## 10. Leak detection

### Pre-commit
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks: [{ id: gitleaks }]
```

### CI
```yaml
- uses: gitleaks/gitleaks-action@v2
  env: { GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }} }
```

### Scan histórico
```bash
trufflehog git file://. --since-commit HEAD~1000
```

### GitHub Secret Scanning
- Habilitar en repos (gratis en public, incluido en Advanced Security para private)
- Partner program: GitHub avisa al provider (Stripe, AWS) → auto-revoca claves leakeadas

---

## 11. Qué hacer si leakeaste un secret

**Priorizar: rotar >>> investigar >>> borrar del repo.**

1. **Rotar YA** — nueva credencial, revocar la vieja en el provider
2. Auditar logs del provider: ¿uso entre timestamp de leak y ahora?
3. Si es un API key con blast radius grande (prod DB, payments) → incident
4. Borrar del repo **con rewrite**: `git filter-repo --path secrets.env --invert-paths` + force-push (coordinar con equipo)
5. Mandar aviso al equipo: no rebasar contra history vieja
6. Si fue en PR cerrado: igual se considera leakeado
7. Post-mortem: ¿por qué entró? ¿falló pre-commit? ¿CI scanner?

**No basta con `git rm`** — el commit queda en history.

---

## 12. Anti-patterns

- ❌ Secrets en `git` (aunque sea "solo en feature branch")
- ❌ `.env` como fuente de verdad de prod
- ❌ Mandar secret por Slack/email/Jira
- ❌ Service account JSON como GitHub secret (usar OIDC)
- ❌ Compartir secret entre envs (dev key == prod key)
- ❌ Secret sin rotación >1 año
- ❌ Logging de variables sin scrubbing: `console.log(process.env)`
- ❌ Secret en URL/querystring (se loguea en proxies/CDN)
- ❌ Secret en código mobile bundle → RN bundle es público (lo que va al device es leakeable)
- ❌ Decodificar secret en runtime a disco (`/tmp/sa.json`)
- ❌ Secret en build args de Docker → queda en layers
- ❌ Un solo "admin" con acceso total — perfil de bus factor

---

## 13. Mobile — caso especial

Apps RN no pueden ocultar secrets de forma segura (el bundle es extraible).

**Regla:** mobile NO tiene secrets. Habla con **tu backend**, que tiene los secrets.

- ❌ API key de Stripe/OpenAI en RN
- ✅ Token de sesión del user (no es un secret, es credencial del user)
- ✅ Llamar a tu backend, que llama al 3rd party

Para configs de cliente (Sentry DSN público, Firebase config) — OK en bundle, son "semi-públicas".

---

## 14. Auditoría

- Audit log de acceso a secrets (Secret Manager lo da gratis en Cloud Audit Logs)
- Revisión mensual: quién accedió a prod secrets
- Access review trimestral: ¿alguien que no debería tener acceso?
- Alerta si acceso fuera de horario laboral a prod
- Dashboard: cantidad de secrets, edad promedio, % rotados < 90d

---

## 15. Checklist review

```markdown
- [ ] Secret Manager configurado (GCP/AWS/Vault)
- [ ] Runtime SA con least-privilege (solo `secretAccessor`)
- [ ] `.gitignore` cubre .env, *.key, *.pem
- [ ] gitleaks pre-commit + CI
- [ ] GitHub Secret Scanning ON
- [ ] OIDC en CI (no JSON keys)
- [ ] Envelope encryption para PII en DB
- [ ] Sin secrets en build args de Docker
- [ ] Sin secrets en mobile bundle
- [ ] Política de rotación: prod 90d, emergencia inmediata
- [ ] Proceso de leak documentado (runbook)
- [ ] Audit logs centralizados + alertas fuera de hora
- [ ] Dev onboarding con secrets via Doppler/SOPS, no Slack
```

---

## 16. Output final

```
✅ Secret management — Alizia
   🔑 GCP Secret Manager (runtime) + SOPS/GCP KMS (infra en git)
   👤 Service accounts least-privilege, OIDC en GitHub Actions
   🔐 Envelope encryption para PII/tokens en DB
   🧹 gitleaks pre-commit + CI + GitHub Secret Scanning
   🔁 Rotación: prod 90d, JWT keys con kid+JWKS, rotate dual-window
   📝 Audit logs → alerta si acceso prod fuera de hora

Próximos pasos:
  1. Workload Identity Federation para todos los repos prod
  2. External Secrets Operator en k8s staging/prod
  3. Runbook "leaked secret" en docs/runbooks/
```

## Delegación

**Coordinar con:** `security-architect`, `sre-lead`, `platform-lead`, `compliance-specialist`
**Reporta a:** `security-architect`

**Skills relacionadas:**
- `/auth-setup` — JWT signing keys rotation
- `/payments-billing` — API keys Stripe/MP
- `/deploy-check` — CI secrets validation
- `/security-hardening` — leak response runbook
- `/incident` — leaked secret como incident P1
- `/observability-setup` — audit log pipeline
