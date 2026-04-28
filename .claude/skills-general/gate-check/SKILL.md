---
name: gate-check
description: "Quality gate validation for phase transitions: artifact checks, quality criteria, verdict with blockers"
argument-hint: "[target-phase] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Task, AskUserQuestion
model: opus
---
# gate-check — Phase Gate Validation

Validates project readiness to advance to the next phase. Checks required artifacts, quality standards, and blockers. Produces verdict: PASS / CONCERNS / FAIL.

## Software phases

1. **Discovery** — Scope, tech choices, NFRs
2. **Design** — Architecture, ADRs, threat model, API spec
3. **Pre-Production** — Epics, test framework, CI/CD, env setup
4. **Production** — Feature development, coverage, error tracking
5. **Pre-Release** — Load test, security audit, a11y, runbooks
6. **Release** — Deploy prep, monitoring, rollback plan

## Gate criteria per transition

### Discovery -> Design
- [ ] Scope doc / PRD with problem statement, success metrics, out-of-scope
- [ ] Tech choices documented (framework, DB, cache, queue)
- [ ] Non-functional requirements (latency, throughput, scale)

### Design -> Pre-Production
- [ ] Architecture doc with layered design
- [ ] >= 3 ADRs covering foundation decisions (auth, data, API)
- [ ] API spec (OpenAPI/GraphQL) if applicable
- [ ] DB schema initial (migrations or ERD)
- [ ] Threat model if PII/auth/financial data involved

### Pre-Production -> Production
- [ ] Test framework initialized with examples
- [ ] CI/CD pipeline functional (runs on every PR)
- [ ] Epics defined with acceptance criteria
- [ ] Environment setup documented, secrets wired (.env.example)

### Production -> Pre-Release
- [ ] All MVP features implemented
- [ ] Test coverage: >70% domain, >50% integration
- [ ] Error tracking wired (Sentry, Datadog, etc.)
- [ ] Structured logging with request IDs
- [ ] Staging deploy with smoke tests passing

### Pre-Release -> Release
- [ ] Load test results meeting targets
- [ ] Security audit: HIGH/CRITICAL findings remediated
- [ ] Accessibility audit (WCAG AA) if public UI
- [ ] Incident runbooks documented
- [ ] Rollback plan documented
- [ ] Monitoring dashboards configured
- [ ] Changelog / release notes drafted

## Execution process

1. **Detect current phase** from `production/stage.txt` or infer from project structure
2. **Check artifacts** — verify files exist with meaningful content (not just template headers)
3. **Run quality checks** — tests via CI, coverage, linting
4. **Cross-reference** — architecture docs vs implementation, sprint plans vs work items
5. **Mark unverifiable items** as MANUAL CHECK NEEDED — never assume PASS

## Verdict rules

| Condition | Verdict |
|-----------|---------|
| All artifacts present + all quality checks pass | **PASS** |
| Minor gaps addressable during next phase | **CONCERNS** |
| Critical blockers must resolve before advancing | **FAIL** |

## Chain-of-verification

Before finalizing, generate 5 challenge questions to disprove the verdict:
- For PASS: "Which checks did I verify by reading files vs inferring?"
- For CONCERNS: "Could any concern escalate to a blocker?"
- For FAIL: "What is the minimal path to PASS?"

Answer each independently, revise verdict only with specific evidence.

## On PASS

Write new phase to `production/stage.txt` (with user confirmation).

## Anti-patterns

- Assuming PASS for items not actually verified
- Checking file existence without verifying meaningful content
- Skipping cross-reference between design docs and implementation
- Blocking the user — verdict is advisory, user makes final call
