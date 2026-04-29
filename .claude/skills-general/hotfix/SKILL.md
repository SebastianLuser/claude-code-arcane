---
name: hotfix
description: "Emergency fix workflow that bypasses normal sprint processes with a full audit trail. Creates hotfix branch, tracks approvals, and ensures the fix is backported correctly."
category: "operations"
argument-hint: "[bug-id or description]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Task
---

> **Explicit invocation only**: Only run when user requests `/hotfix`.

## Phase 1: Assess Severity

| Severity | Criteria | Action |
|----------|----------|--------|
| S1 Critical | Unplayable, data loss, security vuln | Hotfix immediately |
| S2 Major | Significant feature broken, workaround exists | Hotfix within 24h |
| S3+ | Lower severity | Recommend normal bug fix workflow, stop |

## Phase 2: Create Hotfix Record

Draft record with: short description, date, severity, reporter, status IN PROGRESS, sections for Problem (player impact), Root Cause (fill during investigation), Fix (fill during implementation), Testing, Approvals (lead-programmer, qa-tester, producer checkboxes), Rollback Plan.

Ask to write to `production/hotfixes/hotfix-[date]-[short-name].md`.

## Phase 3: Create Hotfix Branch

If git initialized: `git checkout -b hotfix/[short-name] [release-tag-or-main]`

## Phase 4: Investigate and Implement

Minimal change only — NO refactoring, cleanup, or features alongside. Run targeted tests, check regressions in adjacent systems. Update record with root cause, fix, test results.

## Phase 5: Collect Approvals (Parallel)

Spawn via Task: `lead-programmer` (correctness/side effects), `qa-tester` (regression tests), `producer` (deploy timing/comms). All three must APPROVE before proceeding.

## Phase 5b: QA Re-Entry Gate

Spawn `qa-lead` with hotfix description, affected system, regression results, caller list (grep).

| QA Verdict | Action |
|------------|--------|
| Smoke check sufficient | `/smoke-check` → if PASS, proceed |
| Targeted QA pass | `/team-qa [affected-system]` → if APPROVED, proceed |
| Full QA required | `/team-qa sprint` — delays deploy but prevents bad patch |

Do not skip this gate.

## Phase 6: Update Bug Status and Deploy

Update original bug file: fixed in (branch/commit), date, status "Fixed — Pending Verification". Output deployment summary: severity, root cause, fix, QA gate result, approvals, rollback plan. Merge to BOTH release branch AND development branch.

### Rules
- MINIMUM change — no cleanup or refactoring
- Rollback plan documented before deployment
- Merge to both release AND dev branches
- Post-incident review within 48h
- If fix needs >4h → escalate to `technical-director`

## Phase 7: Post-Deploy Verification

`/bug-report verify [BUG-ID]` → if VERIFIED FIXED → `/bug-report close [BUG-ID]`. If STILL PRESENT → reopen, assess rollback, escalate. Schedule `/retrospective hotfix` within 48h.
