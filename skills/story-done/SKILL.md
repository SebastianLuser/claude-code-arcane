---
name: story-done
description: "End-of-story review: verify acceptance criteria, check GDD/ADR deviations, update status to Complete, surface next story."
category: "agile"
argument-hint: "[story-file-path] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Edit, AskUserQuestion, Task
---
# Story Done

Closes loop between design and implementation. Verifies acceptance criteria, checks GDD/ADR deviations, prompts code review, updates status. Output: updated story (Status: Complete) + next story.

## Phase 1: Find Story

Resolve review mode: `--review` arg → `production/review-mode.txt` → default `lean`. Story source: arg path → `production/session-state/active.md` → most recent sprint file (IN PROGRESS stories) → AskUserQuestion.

## Phase 2: Read Story

Extract: name/ID, TR-IDs, manifest version, ADR refs, acceptance criteria, implementation files, story type, engine notes, DoD, estimate. Also read: `tr-registry.yaml` (current requirement text by TR-ID), referenced GDD section (AC + key rules), referenced ADR (Decision + Consequences), `control-manifest.md` (current manifest version).

## Phase 3: Verify Acceptance Criteria

**Auto-verification:** file existence (Glob), test pass (Bash), no hardcoded values/strings (Grep), dependency existence.

**Manual verification** (AskUserQuestion, batch up to 4): subjective qualities, gameplay behavior, performance criteria. Options: "Yes — passes" / "No — fails" / "Not tested yet".

**Unverifiable:** mark `DEFERRED — requires playtest session`.

> → Read references/test-evidence-traceability.md for test-criterion mapping rules and evidence requirements by story type

## Phase 4: Check Deviations

1. **GDD rules:** current TR requirement text from registry vs implementation (Grep key names)
2. **Manifest staleness:** story version vs current manifest version → ADVISORY if older
3. **ADR constraints:** forbidden patterns from manifest, grep implementation
4. **Hardcoded values:** numeric literals in gameplay logic
5. **Scope:** files touched outside story's stated scope

Categories: BLOCKING (contradicts GDD/ADR), ADVISORY (slight drift), OUT OF SCOPE (extra files).

> → Read references/review-gates.md for QA Coverage Gate (Phase 4b) and Code Review Gate (Phase 5) details

## Phase 6: Completion Report

Present before updating files:

- AC status: X/Y passing (auto-verified/confirmed/FAILS/DEFERRED)
- Test-criterion traceability table
- Test evidence: type, required, found (YES path / NO BLOCKING / NO ADVISORY)
- Deviations (BLOCKING/ADVISORY)
- Scope (within/extra files)
- **Verdict: COMPLETE / COMPLETE WITH NOTES / BLOCKED**

BLOCKED → do not proceed, list fixes, offer help.

## Phase 7: Update Story

Ask approval → edit story: `Status: Complete` + `## Completion Notes` (date, criteria, deviations, test evidence, code review status). Advisory deviations → offer to log in `docs/tech-debt-register.md`. Update `production/sprint-status.yaml` if exists. Append to `production/session-state/active.md`.

## Phase 8: Surface Next Story

Read sprint plan → find READY/NOT STARTED stories (not blocked, Must/Should Have). Present up to 3 options. If all Must Have complete → sprint close-out sequence: `/smoke-check sprint` → `/team-qa sprint` → `/gate-check`.

## Protocol

- Never mark complete without user approval
- Never auto-fix failing criteria — report and ask
- Deviations are facts, not judgments — user decides
- BLOCKED verdict is advisory — user can override (document risk)
