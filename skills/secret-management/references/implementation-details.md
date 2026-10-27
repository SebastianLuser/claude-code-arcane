# Implementation Details

## Envelope Encryption (KMS)

For PII/tokens in the DB: plaintext → encrypt with a DEK (random per record/tenant) → DEK encrypted with a KEK (in KMS) → store ciphertext + DEK_encrypted. KMS never sees plaintext. Rotate the KEK without re-encrypting everything.

## Local Dev

**A)** Ignored `.env` + seed script (`gcloud secrets versions access`). **B)** `doppler run -- npm run dev` (injects without touching disk). **C)** SOPS for shared dev secrets (KMS-encrypted, commit the `.enc`). **Never** send secrets over Slack/email/Notion.

## CI/CD

**GitHub Actions:** Workload Identity Federation (OIDC) >>> SA JSON. `google-github-actions/auth@v2` with `workload_identity_provider`. Secrets are auto-masked but `echo $SECRET | base64` unmasks them — never do it.

## Kubernetes

**Sealed Secrets** (GitOps): `kubeseal` → commit the sealed YAML. **External Secrets Operator** (runtime): syncs Secret Manager → k8s Secret with `refreshInterval`.

## Rotation

Automatic: DB passwords, scheduled JWT signing keys. Manual every 90d: third-party API keys. Emergency: leak → immediately.

Zero-downtime process: new version → the app reads both → rotate upstream → confirm traffic → disable the old one → destroy after N days.

JWT keys: `kid` + JWKS, the new key is published before signing with it, 2 keys active during the TTL.

## Leak Detection

Pre-commit: gitleaks hook. CI: gitleaks-action. Historical scan: `trufflehog git`. GitHub Secret Scanning (the partner program auto-revokes).

## If You Leaked a Secret

**Rotate >>> investigate >>> delete.** 1) Rotate NOW + revoke the old one. 2) Audit the provider's logs. 3) Large blast radius → incident. 4) `git filter-repo` + force-push. 5) Notify the team. 6) Post-mortem.

## Mobile (RN)

**Mobile has NO secrets.** The bundle is extractable. Talk to your backend, which holds the secrets. OK in the bundle: public Sentry DSN, Firebase config (semi-public).
