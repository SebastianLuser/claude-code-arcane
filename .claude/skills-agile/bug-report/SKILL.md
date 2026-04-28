---
name: bug-report
description: "Creates a structured bug report from a description, or analyzes code to identify potential bugs. Ensures every bug report has full reproduction steps, severity assessment, and context."
argument-hint: "[description] | analyze [path-to-file]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write
---

## Phase 1: Parse Arguments

| Mode | Trigger | Action |
|------|---------|--------|
| Description | no keyword | Generate bug report from description |
| Analyze | `analyze [path]` | Read files, identify potential bugs |
| Verify | `verify [BUG-ID]` | Confirm fix resolved the bug |
| Close | `close [BUG-ID]` | Mark verified bug as closed |

No argument → ask user for bug description.

## Phase 2A: Description Mode

Parse description for: what broke, when, repro steps, expected behavior. Search codebase for related files. Draft report with: summary (title, ID, severity S1-S4, priority P1-P4, status), classification (category, system, frequency, regression), environment (build, platform, scene, state), reproduction steps (preconditions, steps, expected/actual), technical context (affected files, related systems, root cause), evidence, related issues.

## Phase 2B: Analyze Mode

Read target files. Identify: null references, off-by-one, race conditions, unhandled edge cases, resource leaks, incorrect state transitions. Generate bug report per finding.

## Phase 2C: Verify Mode

Read `production/qa/bugs/[BUG-ID].md`. Re-run repro steps via Grep/Glob (check if root cause path still exists). Run related tests. Check for regression (grep for original pattern).

| Verdict | Meaning |
|---------|---------|
| VERIFIED FIXED | Repro fails, tests pass |
| STILL PRESENT | Bug reproduces as described |
| CANNOT VERIFY | Automated checks inconclusive, needs manual playtest |

Ask to update bug file status. If STILL PRESENT → reopen, suggest `/hotfix`.

## Phase 2D: Close Mode

Confirm status is `Verified Fixed` — otherwise stop, require verify first. Append closure record (date, resolution, commit/PR, verified by, regression test). Update status to Closed. Check triage reports for references.

## Phase 3: Save Report

Ask: "May I write this to `production/qa/bugs/BUG-[NNNN].md`?"

## Phase 4: Next Steps

- **After filing**: `/bug-triage` to prioritize; if S1/S2 → `/hotfix [BUG-ID]`
- **After fix**: `/bug-report verify [BUG-ID]` — never close without verification
- **After VERIFIED FIXED**: `/bug-report close [BUG-ID]` → `/bug-triage` to refresh
