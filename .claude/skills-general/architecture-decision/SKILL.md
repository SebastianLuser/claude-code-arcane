---
name: architecture-decision
description: "Creates an Architecture Decision Record (ADR) documenting a significant technical decision, context, alternatives, and consequences."
category: "documentation"
argument-hint: "[title] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Task, AskUserQuestion
---
# architecture-decision — ADR Authoring

> → Read templates/adr.md for the full ADR document skeleton with all sections

## Parse Arguments

- `--review [full|lean|solo]` → or read `production/review-mode.txt` → default `lean`
- **Retrofit mode:** arg starts with `retrofit <path>` → read existing ADR, show section status, fill only missing sections (Status, ADR Dependencies, Engine Compatibility, GDD Requirements). Never modify existing content
- No argument → ask for title before proceeding

## Phase 0: Load Engine Context (ALWAYS FIRST)

1. Read `docs/engine-reference/[engine]/VERSION.md` → engine name, version, cutoff risk
2. Identify domain from title (Physics, Rendering, UI, Audio, etc.)
3. Read module reference + `breaking-changes.md` + `deprecated-apis.md`
4. Display knowledge gap warning if MEDIUM/HIGH risk
5. No engine configured → prompt to run `/setup-engine`

## Phase 1: Context Gathering

1. Scan `docs/architecture/` for next ADR number
2. Read related code, existing ADRs, GDDs from `design/gdd/`
3. **Architecture Registry Check (BLOCKING):** Read `docs/registry/architecture.yaml`, present locked constraints. If proposed decision contradicts registered stance → surface conflict, offer align/supersede/exception. Don't proceed until resolved

## Phase 2: Collaborative Design

Derive assumptions from context, then confirm/adjust via AskUserQuestion:
- Problem statement, 2-3 alternatives, GDD linkage, dependencies, Status=Proposed
- After confirmation, separate AskUserQuestion for any schema/data design questions
- ADR Dependencies: depends on, enables, blocks (or "None" for each)

## Phase 3: Generate ADR

Use template from `templates/adr.md`. Fill all sections from gathered context.

### Reviews (before saving)

| Review | When |
|--------|------|
| Engine Specialist | Always (if engine configured) — validate idiomatic approach, deprecated APIs |
| TD-ADR (technical-director) | `full` mode only — architectural coherence |

### GDD Sync Check

Before write approval, scan GDDs for naming inconsistencies with ADR interfaces. Surface as warning block if found, offer to update GDD in same pass.

## Phase 4: Write

AskUserQuestion for write approval. Write to `docs/architecture/adr-[NNNN]-[slug].md`.

## Phase 5: Update Architecture Registry

Scan ADR for new stances (state ownership, interface contracts, performance budgets, forbidden patterns). Present candidates. **BLOCKING** — don't write registry without explicit approval.

## Phase 6: Closing

List remaining priority ADRs as options. Include "Start writing GDDs" if all prereqs done.

**Always include:** "Run `/architecture-review` in a **fresh session** (never same session as authoring)."

Update blocked stories to Ready if this ADR unblocks them.

## Protocol
- Derive assumptions first, confirm via AskUserQuestion (not open-ended questions)
- Never generate ADR until user confirms assumptions
- Registry entries are append-only (supersede old, add new)
- Retrofit mode: only add missing sections, never modify existing
