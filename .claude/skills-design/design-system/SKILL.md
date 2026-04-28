---
name: design-system
description: "Guided GDD authoring for a single game system. Gathers context, walks sections collaboratively, cross-references dependencies, writes incrementally."
argument-hint: "<system-name> [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task, AskUserQuestion, TodoWrite
---
# design-system — GDD System Authoring

## Parse Arguments

- Review mode: `--review [full|lean|solo]` flag → `production/review-mode.txt` → default `lean`
- System name required. If missing: check `design/gdd/systems-index.md` for next undesigned system
- **Retrofit mode**: If arg starts with `retrofit` or is path to existing GDD → read file, show section status, fill only missing/placeholder sections

## Context Gathering

Read all before asking anything:
1. `design/gdd/game-concept.md` (required)
2. `design/gdd/systems-index.md` (required) — priority, layer, dependencies
3. Upstream/downstream dependency GDDs — extract interfaces, formulas, edge cases, tuning knobs
4. `design/registry/entities.yaml` — known cross-system facts (locked values)
5. `docs/consistency-failures.md` — past conflict patterns for this domain
6. `design/gdd/game-pillars.md`, related GDDs (optional)
7. `.claude/docs/technical-preferences.md` → engine + version → engine reference docs → feasibility brief

Present context summary with dependencies, registry facts, engine constraints. Warn if upstream deps undesigned.

## Skeleton Creation

Create `design/gdd/[system-name].md` with template sections. Update session state.

## Section-by-Section Design

Cycle per section: Context → Questions → Options → Decision → Draft → Approval (AskUserQuestion) → Write (Edit with section heading for uniqueness)

After writing Sections C/D: check registry for value conflicts.

### Section Guidance

| Section | Goal | Mandatory Agent |
|---------|------|----------------|
| **A: Overview** | One-paragraph description. Framing/ADR-ref/Fantasy multi-tab question | — |
| **B: Player Fantasy** | Emotional target | `creative-director` |
| **C: Detailed Design** | Unambiguous spec: Core Rules, States/Transitions, System Interactions | Category specialist (see routing table) |
| **D: Formulas** | Math with variable tables, ranges, worked examples | `systems-designer` + `economy-designer` if costs |
| **E: Edge Cases** | If [condition] → [exact outcome] format | `systems-designer` |
| **F: Dependencies** | Every connection with direction, interface, hard/soft | — |
| **G: Tuning Knobs** | Designer-adjustable values with safe ranges | `systems-designer` if complex |
| **H: Acceptance Criteria** | Given-When-Then, testable by QA | `qa-lead` |
| Visual/Audio | Required for visual categories, optional otherwise | `art-director` |
| UI Requirements | Flag for `/ux-design` if real content | `ux-designer` if complex |

### Agent Routing

| System Category | Primary | Supporting |
|----------------|---------|------------|
| Foundation/Infrastructure | `systems-designer` | `gameplay-programmer`, `engine-programmer` |
| Combat, damage, health | `game-designer` | `systems-designer`, `ai-programmer`, `art-director` |
| Economy, loot, crafting | `economy-designer` | `systems-designer`, `game-designer` |
| Progression, XP, skills | `game-designer` | `systems-designer`, `economy-designer` |
| Dialogue, quests, lore | `game-designer` | `narrative-director`, `writer`, `art-director` |
| UI systems | `game-designer` | `ux-designer`, `ui-programmer`, `art-director` |
| AI, pathfinding | `game-designer` | `ai-programmer`, `systems-designer` |
| Animation, movement | `game-designer` | `art-director`, `technical-artist`, `gameplay-programmer` |

## Post-Design Validation

1. **Self-check**: All 8 sections have real content, formulas have variables, edge cases have resolutions
2. **CD Pillar Review** (full mode only): Spawn `creative-director` gate CD-GDD-ALIGN
3. **Registry update**: Scan for new entities/items/formulas/constants → append to `design/registry/entities.yaml`
4. **Offer review**: Direct to `/design-review` in **fresh session** (never inline)
5. **Update systems index**: Status → Designed/Approved/In Review
6. **Suggest next**: `/consistency-check`, next system, `/gate-check`

## Protocol
- Question → Options → Decision → Draft → Approval for every section
- Never auto-generate full GDD. Never write without approval. Never contradict existing GDDs silently
- Incremental writes — each section survives interruptions
- Context ≥70% → warn user, suggest fresh session with resume
