---
name: secret-management
description: "Gestión de secrets para apps Educabot (Go/TS/React/RN): GCP Secret Manager, AWS Secrets Manager, Vault, SOPS, sealed-secrets, rotation, env vars safe loading, no-secret-in-repo, CI/CD secrets, KMS envelope encryption, dev/stage/prod separation, audit logs. Usar para: secrets, api keys, vault, secret manager, kms, sops, rotation, .env."
argument-hint: "[setup|rotate|audit]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# secret-management — Secrets & Credentials

Regla de oro: **si está en git, está comprometido**.

## Qué es un Secret

**Sí:** API keys, DB passwords, JWT signing keys, OAuth client secrets, SA JSON, private keys, session secrets, webhook signing, encryption keys, payment tokens. **No:** URLs públicas, feature names, env name, log levels. **Regla:** si comprometido causa daño → secret.

## Provider Decision

| Provider | Cuándo |
|----------|--------|
| **GCP Secret Manager** | **Default Educabot** (runtime GCP), IAM fine-grained, versioning, audit |
| AWS Secrets Manager | Stack AWS, rotación automática RDS |
| HashiCorp Vault | Enterprise multi-cloud, dynamic secrets |
| Doppler / 1Password | Equipos chicos, DX simple |
| **SOPS + KMS** | **Default Educabot** (infra en git cifrada), diffeables |
| sealed-secrets | k8s GitOps (Argo/Flux) |

## Reglas Inviolables

1. Nunca commitear `.env`, `*.pem`, `*.key`, `service-account.json`
2. `.env.example` en git con valores dummy/vacíos
3. `.gitignore`: `.env`, `.env.*`, `!*.example`, `*.key`, `*.pem`, `secrets/`
4. Pre-commit hook: **gitleaks** o trufflehog
5. Rotar en cuanto se sospeche leak — no esperar
6. Un secret = un valor único por env (nunca compartir prod/dev)
7. Acceso prod: mínimo necesario + audit log
8. CI: secrets masked en logs

## Setup por Stack

**Go:** `cloud.google.com/go/secretmanager/apiv1` → `AccessSecretVersion` con project/name/latest. Cache en memoria con TTL 5-15min.

**TS:** `@google-cloud/secret-manager` → `accessSecretVersion`. Mismo cache pattern.

## Envelope Encryption (KMS)

Para PII/tokens en DB: plaintext → cifra con DEK (random por registro/tenant) → DEK cifrado con KEK (en KMS) → guarda ciphertext + DEK_encrypted. KMS nunca ve plaintext. Rotar KEK sin re-cifrar todo.

## Dev Local

**A)** `.env` ignorado + seed script (`gcloud secrets versions access`). **B)** `doppler run -- npm run dev` (inyecta sin tocar disco). **C)** SOPS para secrets compartidos dev (cifrado con KMS, commit `.enc`). **Nunca** mandar secrets por Slack/email/Notion.

## CI/CD

**GitHub Actions:** Workload Identity Federation (OIDC) >>> SA JSON. `google-github-actions/auth@v2` con `workload_identity_provider`. Secrets auto-masked pero `echo $SECRET | base64` los desenmascara — nunca hacerlo.

## Kubernetes

**Sealed Secrets** (GitOps): `kubeseal` → commit sealed YAML. **External Secrets Operator** (runtime): sincroniza Secret Manager → k8s Secret con `refreshInterval`.

## Rotación

Automático: DB passwords, JWT signing keys programadas. Manual 90d: API keys 3rd party. Emergencia: leak → inmediato.

Proceso sin downtime: nueva versión → app lee ambas → rotate upstream → confirmar tráfico → disable anterior → destroy tras N días.

JWT keys: `kid` + JWKS, nueva key publicada antes de firmar, 2 keys activas durante TTL.

## Leak Detection

Pre-commit: gitleaks hook. CI: gitleaks-action. Scan histórico: `trufflehog git`. GitHub Secret Scanning (partner program auto-revoca).

## Si Leakeaste un Secret

**Rotar >>> investigar >>> borrar.** 1) Rotar YA + revocar vieja. 2) Auditar logs provider. 3) Blast radius grande → incident. 4) `git filter-repo` + force-push. 5) Aviso al equipo. 6) Post-mortem.

## Mobile (RN)

**Mobile NO tiene secrets.** Bundle es extraible. Habla con tu backend que tiene los secrets. OK en bundle: Sentry DSN público, Firebase config (semi-públicas).

## Anti-patterns

- Secrets en git, `.env` como fuente de verdad prod, secrets por Slack/email
- SA JSON como GitHub secret (usar OIDC), compartir secret entre envs
- Sin rotación >1 año, logging sin scrubbing (`console.log(process.env)`)
- Secret en URL/querystring, en código mobile, en build args Docker, a disco (/tmp/sa.json)
- Un solo admin con acceso total (bus factor)

## Checklist

- [ ] Secret Manager configurado (GCP/AWS/Vault)
- [ ] Runtime SA least-privilege (solo secretAccessor)
- [ ] .gitignore cubre .env, *.key, *.pem
- [ ] gitleaks pre-commit + CI, GitHub Secret Scanning ON
- [ ] OIDC en CI (no JSON keys)
- [ ] Envelope encryption para PII en DB
- [ ] Sin secrets en build args Docker ni mobile bundle
- [ ] Rotación: prod 90d, emergencia inmediata
- [ ] Proceso de leak documentado (runbook)
- [ ] Audit logs + alertas fuera de hora
- [ ] Dev onboarding via Doppler/SOPS, no Slack
