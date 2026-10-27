---
name: rollback-strategy
description: "Rollback strategy: every deploy reversible in <5min. Code/config/data/infra, canary, auto-rollback, Cloud Run, GKE, mobile."
category: "operations"
argument-hint: "[code|config|data|infra]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Rollback Strategy

> **Every deploy must be reversible in <5 minutes. If it is not, it is a dangerous deploy.**

## When to use / NOT use

| Use | Do NOT use |
|------|---------|
| Plan the rollback **before** deploying | Simple fix forward (typo, log) — sometimes a hotfix is faster |
| Production incident | Corrupt data already written — rolling back code does not fix data |
| Design CI/CD pipelines | Past the compatibility window with an irreversible schema |
| Validate the reverse path on breaking changes | Static assets on a CDN — purge + redeploy can be more direct |
| Quarterly DR drills | |

Every release needs: a concrete rollback command written beforehand, an owner who runs it, a clear criterion for when (SLO, error rate), proof that it works.

## Rollback types

| Type | What | Difficulty |
|------|-----|------------|
| **Code** | Redeploy the previous Docker image version | Simple if versioning is right |
| **Config** | Revert a feature flag or env var — instant, no redeploy | Always prefer |
| **Data** | Revert a DB migration — `DROP COLUMN` does not come back without a restore | Hard/impossible. See `/data-migrations` |
| **Infra** | `terraform apply` the previous state version | Requires a clean state, check drift |

## Strategy per layer

### Stateless (Cloud Run, GKE)
Rollback = redeploy the previous image. GKE: `kubectl rollout undo`. Cloud Run: shift traffic to the previous revision with `gcloud run services update-traffic`.

### DB migrations — expand/contract
Never irreversible drops in the same release as the code. 4 phases: expand (add the new, backward-compatible) → migrate data + dual-write → cutover (read from the new) → contract (drop the old one release later). See `/data-migrations`.

### Feature flags
Instant toggle off without a redeploy. Rule: every user-facing feature goes behind a flag with a server-side kill switch.

## Artifact versioning

- Tag by **git SHA**: `gcr.io/educabot/service:$GIT_SHA`. NEVER `:latest` in prod
- Retain at least **10 images** (Artifact Registry lifecycle policy)
- Map SHA ↔ release ↔ Jira ticket (audit)

## DB compatibility window

Code N-1 must work with schema N, and code N with schema N-1, for at least one release. Never merge a breaking schema + code in the same PR. Split: PR1=expand, PR2=code, PR3=contract.

## Manual rollback runbook

> → Read references/runbook-commands.md for exact rollback commands (Cloud Run, GKE, feature flags, GitHub Actions, post-rollback, PITR, cache/CDN)

## References

> → Read references/blue-green.md for blue-green on Cloud Run, Vercel and ECS, when it beats canary or rolling, and the rules for a shared DB and workers
> → Read references/canary-auto-rollback.md for canary progression and auto-rollback triggers
> → Read references/anti-patterns.md for common rollback anti-patterns
> → Read references/pre-deploy-checklist.md for the pre-deploy validation checklist
> → Read references/mobile-rollback.md for React Native rollback mitigations
> → Read references/communication-protocol.md for incident communication protocol

## Post-rollback

1. Create an incident with `/incident`
2. Capture the logs of the bad period before rotation (see runbook)
3. Capture metrics (Grafana/Cloud Monitoring)
4. RCA (5 whys, fishbone)
5. Fix forward: fix, test, redeploy — do not stay on the old version indefinitely

## Delegation

- `/data-migrations` — expand/contract, reversible migrations
- `/deploy-check` — full pre-deploy checklist
- `/incident` — post-mortem + Jira ticket
- `/audit-dev` — audit pipelines and runbooks
