---
name: audit-dev
description: "Comprehensive software audit: architecture, code, tests, security, docs and technical debt."
category: "workflow"
argument-hint: "[full|architecture|security|quality|api|deps]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Task
---
# Software Development Audit

## Input

Arg: `full` (default), `architecture`, `security`, `quality`, `api`, `deps`, or a specific path.

## Phase 1 — Detect stack and structure

Identify languages/frameworks/package manager. Read the root configs. Map the folders. Identify CI/CD. Read README/docs.

## Phase 2 — Analysis per dimension (agents in parallel)

| Dimension | Severity | What to look for |
|-----------|-----------|------------|
| Architecture | CRITICAL | Stack conventions, separation of concerns, circular deps, clear entry point, consistent patterns, hardcoded config, error handling |
| Code quality | HIGH | Dead code, duplication, functions >50 lines, cyclomatic complexity, inconsistent naming, abandoned TODOs, magic numbers, swallowed errors |
| Testing | HIGH | Existence and coverage, unit/integration/e2e balance, useful tests (behavior, not implementation), flaky/global state, fixtures, ease of running |
| Security | CRITICAL | Secrets in code, input validation, SQL injection, XSS, auth/authz, CORS, vulnerable deps, rate limiting |
| API/Contracts | MEDIUM | Documentation (OpenAPI), consistent naming, standard error responses, versioning, validation, pagination |
| Dependencies/Infra | MEDIUM | Outdated/unused deps, lock file, Docker (base images, multi-stage), CI pipeline (tests, lint, security) |
| Documentation | LOW | Useful README, API docs, ADRs, onboarding possible |

## Phase 3 — Produce the report

Save as `AUDIT.md` at the root. Sections: date/stack/overall status (**HEALTHY** if every scorecard dimension is OK, **NEEDS ATTENTION** if any is WARN, **CRITICAL** if any is CRIT), executive summary (3-5 sentences), scorecard (dimension/status OK-WARN-CRIT/note table), critical findings, important findings, observations, what is done well, recommended action plan, per-dimension details with evidence (paths, lines).

## Rules

- Write the report in the user's language. Cite file paths and lines
- A concrete solution per problem
- Agents in parallel per dimension
- NO over-engineering (100% coverage, DI frameworks)
- Calibrate to the project's size/stage
- Prioritize by real impact, not purism
- Acknowledge what is done well
