---
name: test-flakiness
description: "Detect flaky tests from CI logs or test history. Aggregates pass rates, flags intermittent failures, maintains flaky registry."
category: "testing"
argument-hint: "[ci-log-path | scan | registry]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

# Test Flakiness Detection

Identifies flaky tests (pass and fail without code changes), classifies causes, recommends quarantine or fix.

Output: updated `tests/regression-suite.md` quarantine section + optional `production/qa/flakiness-report-[date].md`

**When to run:** Polish phase, when devs start dismissing CI failures as "probably flaky", after `/regression-suite` identifies quarantined tests.

## Phase 1: Parse Arguments

| Mode | What |
|------|------|
| `[ci-log-path]` | Analyse specific CI log file |
| `scan` | Scan all available CI logs in `.github/` or `test-results/` |
| `registry` | Review existing regression-suite.md quarantine, provide remediation |
| No arg | `scan` if CI logs accessible, else `registry` |

## Phase 2: Locate CI Log Data

Check: `.github/`, `test-results/` (Unity NUnit XML), `Saved/Logs/` (Unreal). If path argument → read directly. No logs found → explain options (run tests 3x, save CI output, or run `registry` mode) and ask user.

## Phase 3: Parse Test Results

**JUnit XML:** grep `<testcase name=`, `<failure`, `<error` — extract classname + name. **Plain text:** grep pass/fail patterns per engine. Build table: `test_id → [result_per_run]`.

## Phase 4: Identify Flaky Tests

Flaky = both PASS and FAIL across runs with no code changes.

| Threshold | Fail Rate | Action |
|-----------|-----------|--------|
| **High** | >25% | Quarantine immediately |
| **Moderate** | 5-25% | Investigate and fix soon |
| **Low/suspected** | 1-5% | Monitor, collect more data |

### Cause classification

| Cause | Symptoms | Fix |
|-------|----------|-----|
| **Timing/async** | Fails after awaiting signals/timers, correlates with load | Explicit await/synchronisation |
| **Order dependency** | Fails after specific tests, passes in isolation | Proper setup/teardown, test isolation |
| **Random seed** | Intermittent no pattern, involves RNG | Pass explicit seed |
| **Resource leak** | Fails more often later in run | Fix cleanup in teardown |
| **External state** | Fails when file/scene/global from prior test | Isolate from file system, in-memory mocks |
| **Floating point** | Fails on `== 0.5` comparisons | Epsilon comparison (is_equal_approx) |
| **Scene/prefab race** | Fails when scenes not ready | Await one frame after instantiation |

Grep test file for timing calls, randf, global state, float equality to narrow cause.

## Phase 5: Recommend Action

- **Quarantine (high):** disable in CI with skip annotation, log in regression-suite quarantine. Fix root cause before removing.
- **Fix soon (moderate):** specific fix based on cause. Don't quarantine — fix directly.
- **Monitor (low):** collect more data. Note as "suspected" in suite.

## Phase 6: Generate Report

Conversation summary: runs analysed, tests tracked, flaky tests table (test/system/fail rate/cause/recommendation), clean test count, data limitations (<5 runs = less confidence).

## Phase 7: Write Output

1. "May I update quarantine section of `tests/regression-suite.md`?" → Edit to append (never remove existing)
2. "May I write full report to `production/qa/flakiness-report-[date].md`?"

After writing: add skip annotations for quarantined tests, surface straightforward fixes, schedule fix work before release gate.

## Protocol

- Never delete test files — quarantine = annotate + list, not remove
- <3 runs → flag as "suspected" not "confirmed"
- Fix is always the goal — quarantine is temporary
- Ask before both writes. On write: Verdict **COMPLETE**. On decline: Verdict **BLOCKED**.
- Flakiness is a team problem — surface clearly, don't silently quarantine

## Checklist

- [ ] CI logs parsed and test results extracted (JUnit XML or plain text)
- [ ] Flaky pattern identified (both PASS and FAIL across runs without code changes)
- [ ] Root cause classified per test (timing, order dependency, random seed, resource leak, etc.)
- [ ] Fix vs quarantine decision made based on fail rate threshold (>25% quarantine, 5-25% fix)
- [ ] Flaky registry updated in `tests/regression-suite.md` quarantine section
