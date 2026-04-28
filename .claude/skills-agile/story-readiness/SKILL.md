---
name: story-readiness
description: "Validate that a story file is implementation-ready. Checks for embedded GDD requirements, ADR references, engine notes, clear acceptance criteria, and no open design questions. Produces READY / NEEDS WORK / BLOCKED verdict with specific gaps. Use when user says 'is this story ready', 'can I start on this story', 'is story X ready to implement'."
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

## Load Context (once)

- `design/gdd/systems-index.md` — approved GDDs
- `docs/architecture/control-manifest.md` — manifest rules + version date
- `docs/architecture/tr-registry.yaml` — TR-ID index (missing → skip TR checks)
- ADR status fields — cached per unique ADR
- Current sprint file (if scope is sprint)

## Readiness Checklist

### Design Completeness
- [ ] **GDD requirement referenced** — specific requirement traced, not just filename
- [ ] **Requirement self-contained** — ACs understandable without opening GDD
- [ ] **ACs testable** — specific, observable conditions (not "implement X" or "works correctly")
- [ ] **No judgment calls** — no "feels responsive" without defined benchmark

### Architecture Completeness
- [ ] **ADR referenced or N/A stated** — explicit either way
- [ ] **ADR is Accepted** — Proposed → BLOCKED (may change). Missing → BLOCKED
- [ ] **TR-ID valid and active** — deprecated/superseded → NEEDS WORK. Not in registry → NEEDS WORK. No TR-ID or no registry → auto-pass
- [ ] **Manifest version current** — story older than manifest → NEEDS WORK (new rules may apply)
- [ ] **Engine notes present** — for post-cutoff APIs. N/A if pure data/config
- [ ] **Control manifest rules noted** — auto-pass if manifest doesn't exist

### Scope Clarity
- [ ] **Estimate present** (hours/points/t-shirt)
- [ ] **In-scope/out-of-scope boundary stated**
- [ ] **Dependencies listed** — other story IDs or explicit "None"

### Open Questions
- [ ] **No UNRESOLVED/TBD/TODO/?** in criteria or rules
- [ ] **Dependency stories not DRAFT** — DRAFT/missing → BLOCKED

### Asset References
- [ ] **Referenced assets exist** — Glob for asset paths (.png/.svg/.wav/.glb/.tscn etc). Missing → NEEDS WORK. No refs → auto-pass

### Definition of Done
- [ ] **≥3 testable ACs** — fewer = trivial or under-specified
- [ ] **Performance budget** if touching gameplay loop/rendering/physics
- [ ] **Story Type declared** — Logic/Integration/Visual-Feel/UI/Config-Data
- [ ] **Test evidence section** — where evidence will be stored for the story type

## Verdicts

| Verdict | Criteria |
|---------|----------|
| **READY** | All items pass or have explicit N/A |
| **NEEDS WORK** | Items fail but dependencies exist and aren't DRAFT |
| **BLOCKED** | Dependencies missing/DRAFT, or critical unresolved design question |

## Output

**Single story:** verdict + passing checks + gaps with specific fixes + blockers.

**Multiple stories:** summary table (Ready/Needs Work/Blocked counts) + ready list + needs work (primary gap per story) + blocked (blocker per story) + full detail for non-ready.

**Sprint escalation:** if Must Have stories are not ready → prominent warning at top.

## Phase 8: Director Gate

Solo/lean → skip. Full → spawn `qa-lead` gate QL-STORY-READY with story title, ACs, dependency status, verdict. ADEQUATE → cleared. GAPS/INADEQUATE → surface to user.

## Protocol

- Read-only — never proposes edits or writes files
- After reporting, offer to draft missing sections in conversation
- Missing story file → redirect to `/create-epics` + `/create-stories`
- No GDD + small change → redirect to `/quick-design`
- Scope grown beyond sizing → suggest split
