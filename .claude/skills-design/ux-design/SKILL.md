---
name: ux-design
description: "Guided UX spec authoring per screen/flow/HUD. Reads game concept, player journey, GDDs. Produces ux-spec.md or hud-design.md."
argument-hint: "[screen/flow name] or 'hud' or 'patterns'"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Task
agent: ux-designer
---
# ux-design — UX Spec Authoring

## Modes

| Argument | Mode | Output |
|----------|------|--------|
| `hud` | HUD design | `design/ux/hud.md` |
| `patterns` | Interaction pattern library | `design/ux/interaction-patterns.md` |
| screen/flow name | UX spec | `design/ux/[name].md` |
| none | Ask user | AskUserQuestion |

## Context Gathering (Read Phase)

Read all before asking anything:
1. `design/gdd/game-concept.md` — warn if missing
2. `design/player-journey.md` — extract phases, emotional states, needs
3. Glob `design/gdd/*.md` → grep `UI Requirements` referencing this screen
4. Glob `design/ux/*.md` → note existing specs, entry/exit points
5. `design/ux/interaction-patterns.md` → pattern catalog index
6. `design/art/art-bible.md` → visual direction
7. `design/accessibility-requirements.md` → accessibility tier
8. `.claude/docs/technical-preferences.md` → Input & Platform section

Present context summary, then ask: "Anything else before we start?"

### Retrofit Detection
If output file exists → read it, show section status table (Complete/Empty/Placeholder), work only on incomplete sections using Edit.

## Skeleton Creation

Create output file with `[To be designed]` placeholders for all sections. Update `production/session-state/active.md`.

### UX Spec Sections
Purpose & Player Need | Player Context on Arrival | Navigation Position | Entry & Exit Points | Layout Specification (Info Hierarchy, Zones, Components, ASCII Wireframe) | States & Variants | Interaction Map | Events Fired | Transitions & Animations | Data Requirements | Accessibility | Localization | Acceptance Criteria | Open Questions

### HUD Sections
HUD Philosophy | Information Architecture (Inventory, Categorization: Must Show/Contextual/On Demand/Hidden) | Layout Zones | HUD Elements | Dynamic Behaviors | Platform Variants | Accessibility | Open Questions

### Pattern Library Sections
Overview | Pattern Catalog (extracted from existing specs) | Patterns (per-pattern: Category, Used In, Spec, When/When Not) | Gaps | Open Questions

## Section Authoring Cycle

For each section: Context → Questions → Options → Decision → Draft → Approval → Write (Edit to replace placeholder).

### Key Section Guidance
- **Layout**: Info hierarchy first → zone proposals → component inventory → optional ASCII wireframe
- **States & Variants**: Empty, error, loading, progression, platform variants as table
- **Interaction Map**: Per component — action, input mapping, feedback, outcome. Use input methods from tech-prefs
- **Events Fired**: Table: Player Action | Event Fired | Payload
- **Data Requirements**: Table: Data | Source System | Read/Write | Notes
- **Acceptance Criteria**: Min 5 checkboxes — 1 performance, 1 navigation, 1 error/empty, 1 accessibility, 1 core purpose

## Cross-Reference Check

Before marking ready:
1. GDD requirement coverage — every UI Requirement has a spec element
2. Pattern library alignment — new patterns flagged for addition
3. Navigation consistency — entry/exit points match related specs
4. Accessibility coverage — meets committed tier
5. Empty states — every data-dependent element has one

## Handoff

1. Update session state
2. Suggest `/ux-review [filename]` before implementation pipeline
3. Note cross-linked specs that should reference this one

## Agent Routing

| Topic | Coordinate with |
|-------|----------------|
| Visual aesthetics | `art-director` |
| Implementation feasibility | `ui-programmer` |
| Gameplay data | `game-designer` |
| Narrative/lore in UI | `narrative-director` |

## Protocol
- Question → Options → Decision → Draft → Approval for every section
- AskUserQuestion at every decision point
- Incremental writing — each section written immediately after approval
- Never auto-generate full spec. Never write without approval. Never contradict existing specs silently
