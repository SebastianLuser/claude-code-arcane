---
name: deploy-check
description: "Pre-deploy verification: tests, build, secrets, migrations, env vars, rollback, health checks. Trigger: deploy, release checklist, rollback."
category: "operations"
argument-hint: "[env: staging|prod]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# deploy-check — Pre-Deploy Verification Guide

## Quick Start Checklist — Minimum pre-deploy

- [ ] Tests pass (`go test ./...` / `npm test`) — no red, no skips
- [ ] Clean build with no errors or relevant warnings
- [ ] No secrets in tracked files (`gitleaks detect` or `trufflehog`)
- [ ] Migrations: all committed, `up → down → up` tested on staging
- [ ] Env vars: every one in `.env.example` set in the target
- [ ] Rollback plan documented and tested — who runs it and when?
- [ ] Staging deployed and smoke tests passing before prod
- [ ] Health checks responding (`/health`, `/ready`)
- [ ] On-call notified / available during the first 2h after deploy

---

Run all independent checks in parallel. Any FAIL -> BLOCKERS FOUND, do not proceed.

## 1. Pre-Deploy Checklist

| Check | Criteria | Blocker? |
|-------|----------|----------|
| Git clean | No uncommitted changes, up-to-date with remote | Yes |
| Tests pass | All green (detect runner: go test, npm test, pytest) | Yes |
| Build succeeds | Clean build, no errors | Yes |
| Lint clean | No errors (warnings OK with justification) | Yes |
| Secrets scan | No passwords/keys/tokens in tracked files or staged diffs | Yes |
| Migrations | All committed, up+down tested, none pending | Yes |
| Dependencies | No critical/high vulnerabilities | Warn |
| Env vars | All required present in target (compare .env.example vs deploy config) | Yes |
| Secrets rotation | Expiring secrets rotated | Warn |

## 2. Rollback Readiness

- [ ] Rollback plan documented (who, how, trigger criteria)
- [ ] Previous version accessible and re-deployable
- [ ] DB migrations backward-compatible (new code + old schema AND old code + new schema)
- [ ] Feature flags to disable new functionality without full rollback
- [ ] Rollback tested in staging

**Migration strategy:** Add columns/tables -> deploy new code -> backfill -> remove old columns in LATER deploy.

## 3. Health Checks

| Probe | Purpose | Key config |
|-------|---------|------------|
| Startup | App initialized (heavy init, migrations) | initialDelay: 30s, failureThreshold: 10 |
| Readiness | Ready for traffic (DB connected, caches warm) | period: 5s, failureThreshold: 3 |
| Liveness | Process alive (not deadlocked) | period: 10s, failureThreshold: 5 |

Readiness checks downstream deps. Liveness does NOT — avoids cascading restarts.

## 4. Post-Deploy Verification

| Step | Timing | Action |
|------|--------|--------|
| Smoke tests | Immediately | Hit critical paths (auth, main endpoints, health) |
| Error rate | First 5-15 min | Compare to baseline, alert if >2x |
| Gradual rollout | Progressive | Canary 5% -> 25% -> 50% -> 100%, monitor each stage |
| Log review | First 15 min | New error patterns, stack traces, panics |
| Rollback trigger | Any stage | Error spike, failed smoke, P0 reports |

## Anti-patterns

- Deploying without rollback plan or untested rollback
- Friday/pre-holiday deploys (no responders available)
- Skipping staging, going straight to production
- Destructive migrations in same deploy as code changes
- Big-bang deploy instead of gradual rollout
- No post-deploy monitoring (green build != working production)
- Undocumented manual steps (bus factor = 1)

## 6. Report Format

| Check | Status | Detail |
|-------|--------|--------|
| Git / Tests / Build / Lint / Secrets / Migrations / Deps / Env / Rollback | PASS/FAIL/WARN/SKIP | specific detail |

**Result:** READY TO DEPLOY or BLOCKERS FOUND (list each blocker with fix action).
