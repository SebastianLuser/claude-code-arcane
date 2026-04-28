---
name: story-done
description: "End-of-story completion review. Reads the story file, verifies each acceptance criterion against the implementation, checks for GDD/ADR deviations, prompts code review, updates story status to Complete, and surfaces the next ready story from the sprint."
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

### Test-Criterion Traceability

Map each AC to covering test (unit/integration/manual). Table: Criterion | Test | Status (COVERED/UNTESTED). Escalation: >50% UNTESTED → BLOCKING; ≤50% → ADVISORY (add to Completion Notes).

### Test Evidence by Story Type

| Type | Required Evidence | Gate |
|------|-------------------|------|
| Logic | Unit test in `tests/unit/[system]/` — must exist and pass | BLOCKING |
| Integration | Integration test or playtest doc | BLOCKING |
| Visual/Feel | Screenshot + sign-off in `production/qa/evidence/` | ADVISORY |
| UI | Walkthrough doc or interaction test | ADVISORY |
| Config/Data | Smoke check pass in `production/qa/smoke-*.md` | ADVISORY |

Check exact path from story's Test Evidence section first, then broad search. No type set → ADVISORY warning.

## Phase 4: Check Deviations

1. **GDD rules:** current TR requirement text from registry vs implementation (Grep key names)
2. **Manifest staleness:** story version vs current manifest version → ADVISORY if older
3. **ADR constraints:** forbidden patterns from manifest, grep implementation
4. **Hardcoded values:** numeric literals in gameplay logic
5. **Scope:** files touched outside story's stated scope

Categories: BLOCKING (contradicts GDD/ADR), ADVISORY (slight drift), OUT OF SCOPE (extra files).

### Phase 4b: QA Coverage Gate

Solo/lean → skip. Full → spawn `qa-lead` gate QL-TEST-COVERAGE with story file, test paths, QA test cases, ACs. Verdict: ADEQUATE → proceed; GAPS → ADVISORY; INADEQUATE → BLOCKING. Skip for Config/Data.

## Phase 5: Code Review Gate

Solo/lean → skip. Full → spawn `lead-programmer` gate LP-CODE-REVIEW. Pass implementation files, story, GDD section, ADR. CONCERNS → AskUserQuestion (Revise/Accept/Discuss). REJECT → must resolve. No implementation files → skip.

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
