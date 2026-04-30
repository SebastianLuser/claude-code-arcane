# Quick Start Checklist — Pipeline completo desde cero

- [ ] Workflow `.github/workflows/ci.yml` creado con stages en orden: lint -> type-check -> test -> build -> deploy
- [ ] Lint + type-check + test corren en paralelo (jobs separados); build espera que los 3 pasen
- [ ] Caching activo (`setup-node`/`setup-go` built-in o `actions/cache` para paths custom)
- [ ] `npm ci` (no `npm install`) en todos los jobs Node
- [ ] Todas las actions pinneadas por SHA o major version (`@v3`, nunca `@master`)
- [ ] Concurrency group con `cancel-in-progress: true` en PRs
- [ ] GitHub Environment `staging` con auto-deploy en push a main
- [ ] GitHub Environment `production` con required reviewers + deploy solo en tags `v*`
- [ ] Secrets de prod en Environment `production`, nunca en repo-level ni hardcodeados
- [ ] OIDC para cloud auth (no long-lived keys)
- [ ] Branch protection: PR requerido + CI must pass + force-push bloqueado en main
- [ ] Rollback procedure documentado en README o runbook
