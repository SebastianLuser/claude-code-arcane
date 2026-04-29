---
name: design-system
description: "Guided GDD authoring for a single game system. Gathers context, walks sections collaboratively, cross-references dependencies, writes incrementally."
category: "design"
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

Sections A-H + Visual/Audio + UI Requirements. Each has a goal and optional mandatory agent.

> → Read references/section-guidance.md for full section goals table and agent routing by system category

## Post-Design Validation

Self-check completeness, then registry update, offer review, update index, suggest next.

> → Read references/post-design-validation.md for 6-step validation procedure

## Protocol
- Question → Options → Decision → Draft → Approval for every section
- Never auto-generate full GDD. Never write without approval. Never contradict existing GDDs silently
- Incremental writes — each section survives interruptions
- Context ≥70% → warn user, suggest fresh session with resume
