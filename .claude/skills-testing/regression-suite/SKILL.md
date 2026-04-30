---
name: regression-suite
description: "Map test coverage to critical paths, find bugs lacking regression tests, flag coverage drift. Maintains regression-suite.md."
category: "testing"
argument-hint: "[update | audit | report]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Regression Suite

Ensures every bug fix has a regression test, the suite stays current, and coverage drift is detected. Maintains `tests/regression-suite.md` — a curated index of tests covering critical paths and known failures.

**When to run:** after fixing a bug, before release gate (`/gate-check polish`), sprint close.

## Phase 1: Parse Arguments

| Mode | What |
|------|------|
| `update` | Scan new bug fixes this sprint, check for regression test presence, add to manifest |
| `audit` | Full audit of all GDD critical paths vs test coverage |
| `report` | Read-only status report (no writes) |
| No arg | `update` if sprint active, else `audit` |

## Phase 2: Load Context

- **Existing suite:** read `tests/regression-suite.md` — total tests, last updated, STALE/QUARANTINED. If absent → "will create one"
- **Test inventory:** glob `tests/unit/**/*_test.*`, `tests/integration/**/*_test.*`, `tests/regression/**/*`. Note system + filename
- **GDD critical paths** (audit mode): read `systems-index.md` → per MVP system read GDD Acceptance Criteria, Formulas, Edge Cases
- **Sprint context** (update mode): current sprint plan + completed stories
- **Closed bugs:** glob `production/qa/bugs/*.md`, filter Status: Closed/Fixed. Note system + regression test mention

## Phase 3: Map Coverage — Critical Paths (audit only)

Per GDD acceptance criterion, grep test directories for related tests:

| Status | Meaning |
|--------|---------|
| **COVERED** | Test targets this criterion's logic |
| **PARTIAL** | Test exists, doesn't cover all cases |
| **MISSING** | No test found |
| **EXEMPT** | Visual/Feel or UI — not automatable |

MISSING items on formulas/state machines → **HIGH PRIORITY** gap.

## Phase 4: Map Coverage — Fixed Bugs

Per closed bug: grep tests for bug ID or failure scenario.
- **HAS REGRESSION TEST** — test found
- **MISSING REGRESSION TEST** — flag as gap, suggest path `tests/unit/[system]/[bug-slug]_regression_test.[ext]`

## Phase 5: Detect Coverage Drift

- Stories completed with no test files
- New systems in systems-index since last update
- GDD sections revised since last update
- Suite last-updated >2 sprints ago → likely stale

## Phase 6: Generate Report + Manifest

**Report** (conversation): coverage tables (critical paths, bug regression, drift indicators), recommended new tests with priority.

**Manifest** (`tests/regression-suite.md`): last updated, total tests, coverage %, how to run, registered tests per system (table: file/function/covers/added), known gaps (priority/system/path/covers/reason), quarantined tests.

## Phase 7: Write Output

"May I write/update `tests/regression-suite.md`?"
- `update`: append new entries (never remove existing)
- `audit`: rewrite full manifest
- `report`: no writes

After writing: suggest creating HIGH priority missing tests, flag bugs without regression tests for next sprint, recommend `/regression-suite audit` if drift detected.

Verdict: **COMPLETE** (or **BLOCKED** if declined).

## Protocol

- Never remove existing tests from manifest without explicit approval
- Gaps are advisory, not blocking (except at release gate)
- Quarantine ≠ deletion — flaky tests go to `/test-flakiness`
- Always ask before writing

## Checklist

- [ ] Existing `tests/regression-suite.md` loaded (or creation acknowledged if absent)
- [ ] Critical paths from GDD acceptance criteria mapped to test coverage status
- [ ] Every closed bug fix has a corresponding regression test (or gap flagged)
- [ ] Flaky/quarantined tests identified and routed to `/test-flakiness`
- [ ] Manifest updated with new entries, coverage %, and last-updated date
