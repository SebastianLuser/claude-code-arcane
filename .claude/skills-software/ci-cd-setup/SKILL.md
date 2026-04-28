---
name: ci-cd-setup
description: "CI/CD decision guide: GitHub Actions pipeline stages, caching, environments, branch protection, deploy strategies, secrets. Use for: ci, cd, github actions, pipeline, workflow, deploy, release."
argument-hint: "[stack: go|ts|react|rn]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# ci-cd-setup — Decision Guide

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
| **Pinning** | SHA or major version; never `@master` |
| **Reusable** | Shared logic → `org/shared-workflows` repo |
| **Monorepo** | Path filters; run only affected packages |

## Environment Strategy

| Env | Trigger | Gate |
|---|---|---|
| **staging** | Push to main | Auto-deploy, no review |
| **production** | Tag `v*` or manual dispatch | Required reviewers (1-2) |

Promotion: CI green + staging smoke test + changelog reviewed. Use GitHub Environments for secret isolation.

## Branch Protection

- [ ] Require PR + 1 approval before merge to main
- [ ] Require CI status checks to pass
- [ ] Require branch up to date; restrict force-push on main
- [ ] CODEOWNERS for critical paths (`.github/`, infra, auth)

## Secret Management

| Type | Location |
|---|---|
| GITHUB_TOKEN | Auto-provided |
| CI tokens (Codecov, Expo) | Repo-level secrets |
| Staging creds | GitHub Environment: staging |
| Prod creds | GitHub Environment: production (behind reviewers) |
| DB/API keys (prod) | K8s/ECS secrets manager — never in workflow |
| Cloud auth | **OIDC** preferred — no long-lived keys |

## Deploy Strategies

| Strategy | When | Rollback |
|---|---|---|
| **Rolling** | Default, stateless services | Fast (revert deployment) |
| **Blue-green** | Zero-downtime, migration-safe | Instant (switch traffic) |
| **Canary** | High-risk, gradual confidence | Medium (shift back) |
| **OTA** | RN JS-only (EAS Update) | Instant (revert channel) |

Always document rollback plan before production deploy.

## Anti-Patterns

- Unpinned actions (`@master`); `npm install` instead of `npm ci`
- Test after build — flip order (test is cheap, build is expensive)
- Single monolithic job — loses parallelism
- No concurrency group — duplicate runs waste minutes
- Prod deploy without gate/tag; `:latest` without semver tag
- No caching; all tests on every PR in monorepo
- Secrets in workflow env block of public repo
- No rollback plan

## Pre-Merge Checklist

- [ ] CI on PR + main; concurrency + cancel-in-progress
- [ ] Caching active; coverage published
- [ ] Secrets in Environments (not repo-level for prod)
- [ ] Dependabot for actions + deps; CODEOWNERS; actions pinned
- [ ] Staging auto-deploys; prod gated by tag + reviewers
- [ ] Rollback procedure documented
