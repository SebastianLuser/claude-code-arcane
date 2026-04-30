---
name: secret-management
description: "Secret management: GCP Secret Manager, Vault, SOPS, rotation, KMS, CI/CD secrets, env separation."
category: "security"
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

> → Read references/implementation-details.md for envelope encryption, dev local, CI/CD, k8s, rotation, leak detection, leak response, and mobile details

> → Read references/anti-patterns.md for common secret management anti-patterns

> → Read references/checklist.md for the 11-item implementation checklist
