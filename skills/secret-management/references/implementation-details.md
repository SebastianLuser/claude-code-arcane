# Implementation Details

## Envelope Encryption (KMS)

Para PII/tokens en DB: plaintext → cifra con DEK (random por registro/tenant) → DEK cifrado con KEK (en KMS) → guarda ciphertext + DEK_encrypted. KMS nunca ve plaintext. Rotar KEK sin re-cifrar todo.

## Dev Local

**A)** `.env` ignorado + seed script (`gcloud secrets versions access`). **B)** `doppler run -- npm run dev` (inyecta sin tocar disco). **C)** SOPS para secrets compartidos dev (cifrado con KMS, commit `.enc`). **Nunca** mandar secrets por Slack/email/Notion.

## CI/CD

**GitHub Actions:** Workload Identity Federation (OIDC) >>> SA JSON. `google-github-actions/auth@v2` con `workload_identity_provider`. Secrets auto-masked pero `echo $SECRET | base64` los desenmascara — nunca hacerlo.

## Kubernetes

**Sealed Secrets** (GitOps): `kubeseal` → commit sealed YAML. **External Secrets Operator** (runtime): sincroniza Secret Manager → k8s Secret con `refreshInterval`.

## Rotacion

Automatico: DB passwords, JWT signing keys programadas. Manual 90d: API keys 3rd party. Emergencia: leak → inmediato.

Proceso sin downtime: nueva version → app lee ambas → rotate upstream → confirmar trafico → disable anterior → destroy tras N dias.

JWT keys: `kid` + JWKS, nueva key publicada antes de firmar, 2 keys activas durante TTL.

## Leak Detection

Pre-commit: gitleaks hook. CI: gitleaks-action. Scan historico: `trufflehog git`. GitHub Secret Scanning (partner program auto-revoca).

## Si Leakeaste un Secret

**Rotar >>> investigar >>> borrar.** 1) Rotar YA + revocar vieja. 2) Auditar logs provider. 3) Blast radius grande → incident. 4) `git filter-repo` + force-push. 5) Aviso al equipo. 6) Post-mortem.

## Mobile (RN)

**Mobile NO tiene secrets.** Bundle es extraible. Habla con tu backend que tiene los secrets. OK en bundle: Sentry DSN publico, Firebase config (semi-publicas).
