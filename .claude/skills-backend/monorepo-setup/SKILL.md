---
name: monorepo-setup
description: "Monorepo decisions: tool choice, package structure, dependency management, build pipeline, CI caching, versioning."
category: "infrastructure"
argument-hint: "[tool: pnpm|turbo|nx]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# monorepo-setup — Monorepo Structure & Tooling

## Monorepo vs Polyrepo

**Use monorepo:** apps share code (UI kit, SDK, types), need atomic cross-app refactors, frontend + mobile share logic.
**Stay polyrepo:** apps have nothing in common, independent teams with incompatible toolchains, single isolated service.

## Tool Choice

| Tool | When | Trade-off |
|------|------|-----------|
| **pnpm workspaces** | Always as base layer | Minimal, fast, `workspace:*`. No task runner |
| **Turborepo** | Default for TS monorepos | Local+remote cache, simple pipelines |
| **Nx** | Large teams, many apps, generators | Powerful but steeper curve |
| **Lerna** | Never for new projects | Superseded |

## Package Structure

- `apps/` — deployable applications (web, mobile, admin)
- `packages/ui/` — shared components (no route/auth deps). Use `exports` subpaths
- `packages/sdk/` — API client generated from OpenAPI. Stateless, auth via factory
- `packages/types/` — shared types, ideally generated from backend schema
- `packages/config/` — shared ESLint/TS/Prettier configs
- Root: pnpm-workspace.yaml, turbo.json, tsconfig.base.json

### Dependency Boundaries
- `apps → packages` OK. `packages → packages` OK (DAG, no cycles). `packages → apps` PROHIBITED.
- Enforce with `eslint-plugin-boundaries` or `@nx/enforce-module-boundaries`

## Dependency Management

- **Single version policy:** same React/TS/Vite across repo via `pnpm.overrides`
- **Internal packages:** always `workspace:*` protocol. Never publish private packages to npm
- **Updates:** Renovate with grouped PRs (preferred), or `pnpm up -r`

## Build Pipeline (Turborepo)

- `build`: `dependsOn: ["^build"]`, outputs: `dist/**`
- `lint`/`typecheck`: no outputs. `test`: outputs: `coverage/**`
- `dev`: `cache: false, persistent: true`
- Filter single app: `--filter=web...` | Affected only: `--filter=...[origin/main]`
- Remote cache (Turbo Cloud or self-hosted) shares between devs + CI

## CI Strategy

Only build/test what changed. Use `--filter=...[origin/main]` + remote cache + job matrix per app.

**Time targets:** 1-app PR < 2 min, shared-package PR < 8 min, full cold < 15 min.

## Versioning

| Artifact | Strategy |
|----------|----------|
| **Apps** | Continuous deploy, tag: `web-v2025.04.14` |
| **Public libs** | Changesets, strict semver |
| **Private libs** | `workspace:*`, no versioning |

> → Read references/anti-patterns-and-checklist.md for anti-patterns list and setup checklist
