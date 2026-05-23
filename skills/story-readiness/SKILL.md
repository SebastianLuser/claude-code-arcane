---
name: story-readiness
description: "Validates story readiness: GDD refs, ADR, acceptance criteria, open questions. Verdict: READY / NEEDS WORK / BLOCKED."
category: "agile"
argument-hint: "[story-file-path or 'all' or 'sprint']"
user-invocable: true
allowed-tools: Read, Glob, Grep, AskUserQuestion, Task
model: haiku
---
# Story Readiness

Validates story files contain everything needed to begin implementation. **Read-only** — never edits files. Output: READY / NEEDS WORK / BLOCKED per story.

## Phase 0: Review Mode

Resolve: `--review` arg → `production/review-mode.txt` → default `lean`.

## Arguments

| Scope | Behavior |
|-------|----------|
| Specific path | Validate single story |
| `sprint` | All stories in most recent sprint plan |
| `all` | All `production/epics/**/*.md` (excluding EPIC.md) |
| No arg | AskUserQuestion for scope |

## Load Context

> → Read references/context-loading.md for required context files to load before evaluation

## Checklist

> → Read references/readiness-checklist.md for the full checklist (Design, Architecture, Scope, Open Questions, Assets, Definition of Done)

## Verdicts

| Verdict | Criteria |
|---------|----------|
| **READY** | All items pass or have explicit N/A |
| **NEEDS WORK** | Items fail but dependencies exist and aren't DRAFT |
| **BLOCKED** | Dependencies missing/DRAFT, or critical unresolved design question |

## Output

> → Read references/output-format.md for single/multiple/sprint output format

## Phase 8: Director Gate

Solo/lean → skip. Full → spawn `qa-lead` gate QL-STORY-READY with story title, ACs, dependency status, verdict. ADEQUATE → cleared. GAPS/INADEQUATE → surface to user.

## Protocol

- Read-only — never proposes edits or writes files
- After reporting, offer to draft missing sections in conversation
- Missing story file → redirect to `/create-epics` + `/create-stories`
- No GDD + small change → redirect to `/quick-design`
- Scope grown beyond sizing → suggest split
