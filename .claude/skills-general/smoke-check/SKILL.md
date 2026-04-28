---
name: smoke-check
description: "Critical path smoke test gate before QA hand-off. Runs automated tests, verifies core functionality, PASS/FAIL report."
argument-hint: "[sprint | quick | --platform pc|console|mobile|all]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, AskUserQuestion
---
# Smoke Check

Gate between "implementation done" and "ready for QA". **A build that fails smoke check does not go to QA.**

Output: `production/qa/smoke-[date].md`

## Arguments

- `sprint` (default): full smoke check against current sprint stories
- `quick`: skip coverage scan (Phase 3) and Batch 3
- `--platform pc|console|mobile|all`: add platform-specific checks

## Phase 1: Detect Environment

1. Verify `tests/` exists (else stop → `/test-setup`)
2. Check CI workflow for test refs
3. Read engine from `.claude/docs/technical-preferences.md`
4. Load smoke test list from `production/qa/smoke-tests.md` or `tests/smoke/`
5. Load QA plan from `production/qa/qa-plan-*.md` (most recent)

Report: engine, test dir, CI status, QA plan path.

## Phase 2: Run Automated Tests

- **Unity/Unreal:** Check for test result artifacts (XML/JSON). If none → request manual confirmation
- Parse: total, passing, failing, failure names (up to 10)
- **NOT RUN ≠ FAIL** — record as warning, developer confirms manually

## Phase 3: Test Coverage (skip if `quick`)

For each story in scope: glob `tests/unit/[system]/` and `tests/integration/[system]/`

| Status | Meaning |
|--------|---------|
| COVERED | Test file found matching story |
| MANUAL | Visual/Feel story with evidence doc |
| MISSING | Logic story without test (advisory, not FAIL) |
| EXPECTED | Config/Data story, no test required |

## Phase 4: Manual Smoke Checks (AskUserQuestion, max 3 batches)

| Batch | Content | When |
|-------|---------|------|
| 1 — Core stability | Launch, new game, menu inputs | Always |
| 2 — Sprint changes | Primary mechanic, regressions | Always |
| 3 — Data/perf | Save/load, frame rate | Unless `quick` |
| Platform batches | PC/console/mobile specific | If `--platform` |

## Phase 5: Verdict

| Verdict | Criteria |
|---------|----------|
| **FAIL** | Automated tests failed, OR any Batch 1/2 FAIL |
| **PASS WITH WARNINGS** | Tests pass/NOT RUN, all Batch 1/2 pass, but MISSING coverage |
| **PASS** | All tests pass, all checks pass, no MISSING coverage |

## Phase 6: Write & Gate

Present report → ask approval → write to `production/qa/smoke-[date].md`

- FAIL: list failures, "fix and re-run before QA"
- PASS (WITH WARNINGS): "ready for QA", list advisory items
- PASS: "ready for QA, share qa-plan with qa-tester"

## Protocol
- NOT RUN = warning, not auto-FAIL. Developer confirms manually
- Never auto-fix failures — report only
- PASS WITH WARNINGS doesn't block QA hand-off
- Never write report without explicit approval
