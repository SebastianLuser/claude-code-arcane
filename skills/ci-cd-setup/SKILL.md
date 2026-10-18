---
name: ci-cd-setup
description: "CI/CD con GitHub Actions: pipeline stages, caching, environments, branch protection, deploy strategies."
category: "infrastructure"
argument-hint: "[stack: go|ts|react|rn]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# ci-cd-setup — Decision Guide

## Quick Start Checklist

> → Read references/checklist.md for full 12-item pipeline setup checklist

GitHub Actions. Principle: **fail fast, cache aggressively, gate production**.

## Pipeline Stages (ordered)

| Stage | Purpose | Notes |
|---|---|---|
| 1. Lint | Style + static analysis | Cheapest — run first |
| 2. Type-check | `tsc --noEmit` or equiv | Catches errors before tests |
| 3. Test | Unit + integration | Service containers for DB |
| 4. Build | Compile/bundle artifact | After tests pass |
| 5. E2E | Playwright (separate job) | Needs build artifact |
| 6. Deploy | Push image / deploy | Only on main/tags |

Parallelize lint + type-check + test; build waits for all.

## GitHub Actions Decisions

| Decision | Guidance |
|---|---|
| **Matrix** | Only for libraries (multi-version); apps pin one version |
| **Caching** | Always — `setup-node`/`setup-go` built-in; `actions/cache` for custom |
| **Artifacts** | Upload dist/ (7d retention); download in deploy job |
| **Concurrency** | Group per workflow+ref; `cancel-in-progress: true` on PRs |
| **Pinning** | Third-party actions by full commit SHA with the version in a comment; a bot keeps them current |
| **Reusable** | Shared logic → `org/shared-workflows` repo |
| **Monorepo** | Path filters; run only affected packages |

## Workflow Security

| Rule | Why |
|---|---|
| `permissions: contents: read` at the top, widened per job | The token defaults to more than most jobs need |
| No contributed code in `pull_request_target` / `workflow_run` | They run with secrets and a write token, even for forks |
| Untrusted `${{ github.event.* }}` only through `env:` | Expressions expand before the shell: a PR title can run commands |
| OIDC (`id-token: write`) instead of stored cloud keys | Short-lived credentials scoped to repo + branch |
| `npm ci` / `--frozen-lockfile` in every install step | See `/supply-chain-security` |

> → Read references/actions-hardening.md for examples of each rule, the repo settings to change, `persist-credentials`, and workflow linters (`actionlint`, `zizmor`)

## Environment Strategy

| Env | Trigger | Gate |
|---|---|---|
| **staging** | Push to main | Auto-deploy, no review |
| **production** | Tag `v*` or manual dispatch | Required reviewers (1-2) |

Promotion: CI green + staging smoke test + changelog reviewed. Use GitHub Environments for secret isolation.

## Branch Protection, Secrets & Deploy

> → Read references/secret-and-deploy.md for branch protection checklist, secret location table, and deploy strategies (rolling/blue-green/canary/OTA)

## Anti-patterns

> → Read references/anti-patterns.md for 8 common CI/CD anti-patterns

## Checklist

- [ ] CI on PR + main; concurrency + cancel-in-progress
- [ ] Caching active; coverage published
- [ ] Secrets in Environments (not repo-level for prod)
- [ ] Dependabot for actions + deps; CODEOWNERS; actions pinned by SHA
- [ ] `permissions:` read-only by default; no `pull_request_target` running PR code; untrusted inputs via `env:`
- [ ] Cloud deploys through OIDC, no long-lived keys in secrets
- [ ] Staging auto-deploys; prod gated by tag + reviewers
- [ ] Rollback procedure documented
