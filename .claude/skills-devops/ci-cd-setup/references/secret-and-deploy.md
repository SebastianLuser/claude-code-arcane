# Secret Management & Deploy Strategies

## Secret Management

| Type | Location |
|------|----------|
| GITHUB_TOKEN | Auto-provided |
| CI tokens (Codecov, Expo) | Repo-level secrets |
| Staging creds | GitHub Environment: staging |
| Prod creds | GitHub Environment: production (behind reviewers) |
| DB/API keys (prod) | K8s/ECS secrets manager — never in workflow |
| Cloud auth | **OIDC** preferred — no long-lived keys |

## Deploy Strategies

| Strategy | When | Rollback |
|----------|------|----------|
| **Rolling** | Default, stateless services | Fast (revert deployment) |
| **Blue-green** | Zero-downtime, migration-safe | Instant (switch traffic) |
| **Canary** | High-risk, gradual confidence | Medium (shift back) |
| **OTA** | RN JS-only (EAS Update) | Instant (revert channel) |

Always document rollback plan before production deploy.

## Branch Protection

- [ ] Require PR + 1 approval before merge to main
- [ ] Require CI status checks to pass
- [ ] Require branch up to date; restrict force-push on main
- [ ] CODEOWNERS for critical paths (`.github/`, infra, auth)
