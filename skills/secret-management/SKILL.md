---
name: secret-management
description: "Secret management: GCP Secret Manager, Vault, SOPS, rotation, KMS, CI/CD secrets, env separation."
category: "security"
argument-hint: "[setup|rotate|audit]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# secret-management — Secrets & Credentials

Golden rule: **if it is in git, it is compromised**.

## What is a Secret

**Yes:** API keys, DB passwords, JWT signing keys, OAuth client secrets, SA JSON, private keys, session secrets, webhook signing, encryption keys, payment tokens. **No:** public URLs, feature names, env name, log levels. **Rule:** if compromising it causes harm → secret.

## Provider Decision

| Provider | When |
|----------|--------|
| **GCP Secret Manager** | **Educabot default** (GCP runtime), fine-grained IAM, versioning, audit |
| AWS Secrets Manager | AWS stack, automatic RDS rotation |
| HashiCorp Vault | Enterprise multi-cloud, dynamic secrets |
| Doppler / 1Password | Small teams, simple DX |
| **SOPS + KMS** | **Educabot default** (encrypted infra in git), diffable |
| sealed-secrets | k8s GitOps (Argo/Flux) |

## Inviolable Rules

1. Never commit `.env`, `*.pem`, `*.key`, `service-account.json`
2. `.env.example` in git with dummy/empty values
3. `.gitignore`: `.env`, `.env.*`, `!*.example`, `*.key`, `*.pem`, `secrets/`
4. Pre-commit hook: **gitleaks** or trufflehog
5. Rotate as soon as a leak is suspected — do not wait
6. One secret = a unique value per env (never share prod/dev)
7. Prod access: the minimum needed + audit log
8. CI: secrets masked in logs

## Setup per Stack

**Go:** `cloud.google.com/go/secretmanager/apiv1` → `AccessSecretVersion` with project/name/latest. In-memory cache with a 5-15min TTL.

**TS:** `@google-cloud/secret-manager` → `accessSecretVersion`. Same cache pattern.

> → Read references/implementation-details.md for envelope encryption, dev local, CI/CD, k8s, rotation, leak detection, leak response, and mobile details

> → Read references/anti-patterns.md for common secret management anti-patterns

> → Read references/checklist.md for the 11-item implementation checklist
