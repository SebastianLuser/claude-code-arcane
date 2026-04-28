---
name: release
description: "Pre-release checklist and patch notes generation for web projects"
argument-hint: "[checklist|patch-notes|both]"
user-invocable: true
allowed-tools: ["Read", "Bash", "Glob", "Grep", "Write"]
---

## Route

| Argumento / Intención | Modo | Qué hace |
|----------------------|------|----------|
| `checklist` / "¿estamos listos para release?", "go/no-go" | CHECKLIST | Ejecuta Pre-Release Checklist completo |
| `patch-notes` / "generar notas", "release notes", "changelog" | PATCH-NOTES | Genera patch notes desde git log / changelog.md |
| `both` / (sin argumento) | BOTH | Checklist primero → patch notes al final |

**Regla:** si hay blockers en CHECKLIST, reportarlos antes de proceder a PATCH-NOTES.

## Pre-Release Checklist

**Codebase Health** — Scan for `TODO`/`FIXME`/`HACK`. Report counts and locations. FIXMEs are potential blockers.

**Build Verification**
- [ ] Clean build succeeds (no warnings), reproducible from tag
- [ ] Build version matches tagged commit
- [ ] Environment configs verified per target (staging, production)
- [ ] All env vars and secrets documented and set
**Quality Gates**
- [ ] Zero S1/S2 bugs (or documented exceptions with owner approval)
- [ ] All critical-path features tested, no regressions
- [ ] Performance budgets met (response times, memory, CPU)
**Data and Infrastructure**
- [ ] DB migrations tested forward and backward, rollback verified on staging
- [ ] Cache invalidation strategy confirmed
- [ ] API versioning and deprecation notices in place
**Monitoring and Rollback**
- [ ] Health checks and alerting configured
- [ ] Crash/error reporting active, dashboard accessible
- [ ] Rollback plan documented and tested
- [ ] On-call schedule set for first 72 hours post-deploy
**Compliance**
- [ ] Third-party license attributions complete
- [ ] Privacy policy and legal notices current
- [ ] Analytics/telemetry verified and receiving data

**Go / No-Go** — Summarize readiness, list blockers, require sign-offs from tech lead, QA, and product owner.

---

## Version Bump Criteria

| Bump  | When                                                        |
|-------|-------------------------------------------------------------|
| Major | Breaking API changes, incompatible schema migrations, removed endpoints |
| Minor | New features, new endpoints, backward-compatible additions  |
| Patch | Bug fixes, performance improvements, dependency updates     |

Default to the **higher** bump when uncertain.

---

## Patch Notes Generation

**Data sources** (priority order):
1. `production/releases/[version]/changelog.md` or `docs/CHANGELOG.md`
2. `git log` between previous release tag and current tag/HEAD
3. If none found: **BLOCKED** — instruct user to run `/changelog [version]` first.

**Categories**: Features | Improvements | Fixes (grouped by area) | Breaking Changes

**Writing rules**:
- Describe user/consumer impact, not implementation details
- Include before/after values for behavioral changes
- Strip internal jargon, ticket numbers, and sprint references
- Check for tone guide at `docs/PATCH-NOTES-STYLE.md` or project CLAUDE.md

Present notes with change count per category. Ask before writing to `docs/patch-notes/[version].md`.

---

## Release Process

1. **Tag** — annotated git tag from verified commit
2. **Deploy** — staging first, smoke tests, then promote to production
3. **Verify** — health checks, monitor error rates for 30 min
4. **Communicate** — publish patch notes, notify stakeholders

**Anti-patterns** (reject these): no rollback plan; skipping staging; undocumented breaking changes; missing migration rollback path; no monitoring before deploy; patch notes exposing internal system names or ticket IDs.
