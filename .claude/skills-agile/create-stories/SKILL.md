---
name: create-stories
description: "Break an epic into implementable story files with acceptance criteria, GDD traceability and ADR guidance. Run after /create-epics."
category: "agile"
argument-hint: "[epic-slug | epic-path] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Task, AskUserQuestion
agent: lead-programmer
---
# Create Stories

Break an epic into implementable stories — one behavior per story, ~2-4h each, fully traceable to GDD requirement + ADR decision. Run per epic, Foundation first, then Core, etc.

Output: `production/epics/[epic-slug]/story-NNN-[slug].md`

## 1. Parse Argument

Resolve review mode: `--review` arg → `production/review-mode.txt` → default `full`. Accept epic-slug or full path. No arg → list available epics via Glob.

## 2. Load Everything

Read in full: EPIC.md, its GDD (all 8 sections), all governing ADRs (Decision, Implementation Guidelines, Engine Compatibility, Engine Notes), `control-manifest.md` (rules + manifest version), `tr-registry.yaml`.

**ADR existence validation:** confirm all referenced ADR files exist on disk. Missing → stop immediately, redirect to `/architecture-decision`.

## 3. Classify Stories by Type

| Type | Assign when criteria reference... |
|---|---|
| **Logic** | Formulas, thresholds, state transitions, calculations |
| **Integration** | Two+ systems interacting, signals crossing boundaries, save/load |
| **Visual/Feel** | Animation, VFX, timing, audio sync |
| **UI** | Menus, HUD, buttons, screens, tooltips |
| **Config/Data** | Balance tuning values, data files only |

Mixed → assign type with highest implementation risk. Type determines test evidence required at `/story-done`.

## 4. Decompose GDD into Stories

For each GDD AC: group related criteria → each group = one story. Order: foundational first, edge cases last, UI last. Per story determine: GDD requirement + TR-ID (from registry), governing ADR (Proposed → story Blocked), story type, engine risk.

### 4b. QA Lead Gate (full mode only)

Solo/lean → skip. Full → spawn `qa-lead` gate QL-STORY-READY with story list + ACs + types + TR-IDs. Revise until ADEQUATE. Then qa-lead produces test case specs per story:

- **Logic/Integration:** Given/When/Then + edge cases per AC
- **Visual/UI:** Setup/Verify/Pass condition per AC

Specs embed into each story's `## QA Test Cases` section.

## 5. Present Stories for Review

Show full story list (title, type, ADR, TR-IDs covered, test required) before writing. AskUserQuestion: write all / review first.

## 6. Write Story Files

Each story file includes: header (epic, status, layer, type, manifest version), context (GDD path, TR-ID, ADR + decision summary, engine risk + notes, manifest rules), acceptance criteria (from GDD), implementation notes (from ADR), out of scope, QA test cases (from qa-lead), test evidence (required path by type + status), dependencies (depends on / unlocks).

Also update EPIC.md with populated stories table.

### 4b. Producer Epic Gate (full mode only)

Solo/lean → skip. Full → spawn `producer` gate PR-EPIC before writing.

## 7. After Writing

AskUserQuestion with context-aware next steps: start implementing (`/story-readiness`), create stories for next epic, plan sprint, or stop.

## Protocol

- Read all inputs before presenting
- Present all stories at once, not one at a time
- Warn on blocked stories (Proposed ADR)
- Ask before writing (per-epic approval)
- All content from GDDs, ADRs, manifest — no invention
- Never start implementation — stops at story file level

## Checklist

- [ ] Every story traces back to its parent epic via epic-slug reference
- [ ] Each story has a classified type (Logic, Integration, Visual/Feel, UI, Config/Data)
- [ ] Acceptance criteria are defined with Given/When/Then format for every story
- [ ] No single story exceeds one sprint of estimated effort (~2-4h target)
- [ ] Stories with Proposed ADRs are marked as Blocked
- [ ] EPIC.md stories table is updated with all created stories
