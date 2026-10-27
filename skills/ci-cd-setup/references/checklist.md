# Quick Start Checklist — Full pipeline from scratch

- [ ] Workflow `.github/workflows/ci.yml` created with stages in order: lint -> type-check -> test -> build -> deploy
- [ ] Lint + type-check + test run in parallel (separate jobs); build waits for all 3 to pass
- [ ] Caching enabled (`setup-node`/`setup-go` built-in or `actions/cache` for custom paths)
- [ ] `npm ci` (not `npm install`) in every Node job
- [ ] Every action pinned by SHA or major version (`@v3`, never `@master`)
- [ ] Concurrency group with `cancel-in-progress: true` on PRs
- [ ] GitHub Environment `staging` with auto-deploy on push to main
- [ ] GitHub Environment `production` with required reviewers + deploy only on `v*` tags
- [ ] Prod secrets in the `production` Environment, never at repo level or hardcoded
- [ ] OIDC for cloud auth (no long-lived keys)
- [ ] Branch protection: PR required + CI must pass + force-push blocked on main
- [ ] Rollback procedure documented in the README or a runbook
