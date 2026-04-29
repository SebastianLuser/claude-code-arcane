---
name: ux-design
description: "Guided UX spec authoring per screen/flow/HUD. Reads game concept, player journey, GDDs. Produces ux-spec.md or hud-design.md."
category: "design"
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

> → Read references/spec-sections.md for [section inventories for UX spec, HUD, pattern library, and key section guidance]

## Section Authoring Cycle

For each section: Context → Questions → Options → Decision → Draft → Approval → Write (Edit to replace placeholder).

> → Read references/cross-reference-and-routing.md for [cross-reference checks before marking ready, and agent routing table]

## Handoff

1. Update session state
2. Suggest `/ux-review [filename]` before implementation pipeline
3. Note cross-linked specs that should reference this one

## Protocol
- Question → Options → Decision → Draft → Approval for every section
- AskUserQuestion at every decision point
- Incremental writing — each section written immediately after approval
- Never auto-generate full spec. Never write without approval. Never contradict existing specs silently
