---
paths:
  - "infra/**"
  - "terraform/**"
  - "pulumi/**"
  - ".github/workflows/**"
  - ".gitlab-ci.yml"
  - "k8s/**"
  - "kubernetes/**"
  - "helm/**"
  - "docker/**"
  - "Dockerfile"
  - "**/Dockerfile"
  - "docker-compose.yml"
  - "docker-compose.*.yml"
---

# Infrastructure & CI/CD Rules

- **Infrastructure is code**: every cloud resource created must exist in Terraform / Pulumi / equivalent. No click-ops in production. If you click-ops for an emergency, open a PR within 24h to codify.
- **State is remote and locked**: no local `terraform.tfstate` committed. Remote backend (S3 + DynamoDB, GCS, Terraform Cloud) with locking.
- **Least privilege by default**: IAM roles scoped to the narrowest set of actions + resources. No wildcard `*:*`. Service accounts per service, not shared.
- **Secrets never in IaC files**: reference from secret manager (AWS Secrets Manager, GCP Secret Manager, Vault, K8s Secret). No `password = "..."` in Terraform.
- **Environment parity**: dev / staging / prod share the same module definitions, differ only via variables. No `if env == "prod"` forks in module code.
- **Destructive plans require explicit approval**: any `terraform plan` showing `destroy` on a stateful resource (DB, bucket, queue) requires a second reviewer. CI should flag these.
- **Containers are versioned by digest in production** (`@sha256:...`), not by tag. Tags are mutable; digests are not.
- **Image builds are reproducible**: pin base image by digest, pin all apt/apk packages by version, run multi-stage builds to minimize attack surface.
- **Kubernetes resources have limits**: every pod declares CPU + memory requests and limits. Missing limits = OOM-kill + noisy neighbor problems.
- **Health checks on every service**: liveness + readiness probes. Readiness gates traffic; liveness triggers restart. They are not the same.
- **CI pipelines fail fast**: run cheapest checks first (lint, typecheck) then tests then integration then build. Short-circuit on first failure unless explicitly matrix-parallel.
- **CI is the source of truth for deploys**: nobody runs `kubectl apply` / `terraform apply` from their laptop against production. Pipeline auth is what touches prod.
- **Workflows pin action versions by SHA** for third-party actions (`uses: org/action@<sha>`). Tags are moveable and a supply-chain risk.
- **Monitoring on day one**: metrics + logs + traces + alerts defined in the same PR that ships the service. No "we'll add monitoring later."

## Change Management

- Infra changes to production go through a staging apply first — same module, different workspace/env
- `terraform apply` output is archived to the PR so reviewers can see what actually ran
- Rollback plan documented in PR description for any stateful change

## Anti-Patterns

- `aws configure` / personal credentials being what deploys to prod
- `latest` tag in any production manifest
- Inline shell scripts in CI that do complex logic — move to a versioned script with tests
- Copying `production.tf` to `staging.tf` and diverging them by hand
- Running DB migrations from a CI job that doesn't have transactional rollback if the deploy fails after
