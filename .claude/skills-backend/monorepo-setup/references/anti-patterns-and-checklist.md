# monorepo-setup — Anti-patterns & Checklist

## Anti-patterns

- Monorepo without workspaces (symlinks, copy-paste) — guaranteed desync
- Circular dependencies between packages
- No cache in CI — 30-min builds
- Not filtering affected packages (same tests in 5 jobs)
- Different React versions across apps — subtle bugs
- God "utils" package with no cohesion
- Publishing private libs to public npm
- No CODEOWNERS — PRs without clear reviewers
- Apps importing directly from other apps (move to package)
- Monorepo to force stack on unwilling independent teams

## Checklist

- [ ] pnpm-workspace.yaml with apps/ and packages/
- [ ] turbo.json with pipeline + cache outputs
- [ ] Base tsconfig extended by all apps
- [ ] Boundary lint rule enforced
- [ ] Remote cache configured
- [ ] CI with `--filter=...[main]` + cache
- [ ] CODEOWNERS configured
- [ ] Single version policy for critical deps
- [ ] Renovate/Dependabot with grouping
- [ ] Root scripts: dev, build, lint, test
