---
name: ux-review
description: "Validate UX spec, HUD, or pattern library for completeness, accessibility, GDD alignment. Produces verdict with specific gaps."
category: "design"
argument-hint: "[file-path or 'all' or 'hud' or 'patterns']"
user-invocable: true
allowed-tools: Read, Glob, Grep
agent: ux-designer
---
# UX Review

Quality gate between UX Design and Visual Design/Implementation. Read-only — reports findings only.

## Arguments

| Scope | Target |
|-------|--------|
| Specific path | One document |
| `all` | All files in `design/ux/` |
| `hud` | `design/ux/hud.md` |
| `patterns` | `design/ux/interaction-patterns.md` |
| No arg | Ask user |

## Cross-Reference Context (load once)

Input & Platform from `.claude/docs/technical-preferences.md`, accessibility tier from `design/accessibility-requirements.md`, pattern library from `design/ux/interaction-patterns.md`, referenced GDDs (UI Requirements sections), player journey from `design/player-journey.md`.

## Phase 3A: UX Spec Checklist

### Completeness (required sections)
Header (Status/Author/Platform), Purpose & Player Need, Player Context on Arrival, Navigation Position, Entry & Exit Points, Layout Specification, States & Variants (loading/empty/error min), Interaction Map (all input methods), Data Requirements (source + owner), Events Fired, Transitions & Animations, Accessibility, Localization (char limits), Acceptance Criteria (≥5 testable).

### Quality Checks
- **Player Need:** perspective from player not dev, unambiguous goal, specific context on arrival
- **States:** error + empty + loading documented, timed states have duration
- **Input Methods:** keyboard-only if PC, d-pad + face buttons if console, no mouse-precision on gamepad, focus order defined
- **Data:** no "UI" as owner (UI must not own game state), update triggers specified, null handling specified
- **Accessibility:** meets tier (Basic: no color-only, Standard+: focus order + contrast, Comprehensive+: screen reader), colorblind alternatives
- **GDD Alignment:** all referenced GDD UI Requirements addressed, no UI modifying state without GDD requirement, no missing requirements
- **Pattern Library:** components reference library (or flagged as new), no re-specification, new patterns flagged for library addition
- **Localization:** char limits present, 40% expansion accommodation
- **ACs Quality:** specific for QA without reading other docs, performance + resolution criteria present

## Phase 3B: HUD Checklist

Completeness: philosophy, info architecture covers all GDD systems, layout zones + safe margins, element specs (zone/visibility/data/priority), HUD states per gameplay context (exploration/combat/dialogue/paused min), visual budget, platform adaptation, tuning knobs.

Quality: no center play area coverage without visibility rule, all GDD info represented or explicitly hidden/demand, colorblind variants, notification queue/priority behavior, visual budget compliance. GDD alignment against `systems-index.md`.

## Phase 3C: Pattern Library Checklist

Catalog index current, standard controls specified (button/toggle/slider/dropdown/list/grid/modal/dialog/toast/tooltip/progress/input/tab/scroll), game-specific patterns present, each has When to Use/NOT/states/accessibility/implementation notes, animation + sound standards tables, no conflicting behaviors.

## Verdict

| Verdict | Meaning |
|---------|---------|
| **APPROVED** | Complete, consistent, implementation-ready |
| **NEEDS REVISION** | Specific gaps, fix before handoff (not full redesign) |
| **MAJOR REVISION NEEDED** | Fundamental issues, needs significant rework |

Report: completeness (X/Y sections), quality issues (BLOCKING/ADVISORY with fix), GDD alignment (X/Y requirements covered), accessibility compliance, pattern library consistency.

## Protocol

- Read-only — never edits files
- APPROVED → suggest `/team-ui`
- NEEDS REVISION → offer to help draft missing sections
- MAJOR REVISION → redirect to `/ux-design`
- Verdict is advisory — user decides whether to proceed
