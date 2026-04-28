---
name: brainstorm
description: "Guided game concept ideation — from zero idea to a structured game concept document. Uses professional studio ideation techniques, player psychology frameworks, and structured creative exploration."
argument-hint: "[genre or theme hint, or 'open'] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, WebSearch, Task, AskUserQuestion
---

# Brainstorm — Game Concept Ideation

## Setup

1. Parse argument for genre/theme hint (`roguelike`, `space survival`, `open`). Resolve review mode: `--review` flag → `production/review-mode.txt` → default `lean`. See `.claude/docs/director-gates.md`.
2. Check existing work: `design/gdd/game-concept.md` (resume), `design/gdd/game-pillars.md` (build on).
3. Run phases **interactively** — collaborative exploration, not silent generation. Use `AskUserQuestion` at key decision points.

Studio principles: withhold judgment, encourage unusual ideas, "yes and...", constraints as creative fuel, time-box phases.

### Phase 1: Creative Discovery

**Emotional anchors** (plain text, not constrained): moment in a game that moved/thrilled you, fantasy never quite found.

**Taste profile**: 3 most-played games (plain text — no preset options), genres loved/avoided.

**Practical constraints** (single multi-tab `AskUserQuestion`):
- Tab "Experience": Challenge & Mastery / Story & Discovery / Expression & Creativity / Relaxation & Flow
- Tab "Timeline": Weeks / Months / 1-2 years / Multi-year
- Tab "Dev level": First game / Shipped before / Professional background

Synthesize into **Creative Brief** (3-5 sentences: emotional goals, taste, constraints). Read back and confirm.

### Phase 2: Concept Generation

Generate **3 concepts** using ideation techniques:

| Technique | Approach |
|-----------|----------|
| Verb-First | Core player verb (build/fight/explore/solve) → build outward |
| Mashup | Genre A + Theme B tension creates unique hook |
| MDA Backward | Target emotion → dynamics → mechanics |

Per concept present: Working Title, Elevator Pitch (1-2 sentences), Core Verb, Core Fantasy, Unique Hook ("Like X, AND ALSO Y"), Primary MDA Aesthetic, Estimated Scope, Why It Could Work, Biggest Risk.

Present all three → `AskUserQuestion` plain list (NO tabs): pick one, combine, or fresh directions.

### Phase 3: Core Loop Design

For chosen concept, structured questioning:

| Loop | Focus |
|------|-------|
| **30-second** | Core action feel (AskUserQuestion with concept-derived options), key design dimension |
| **5-minute** | What structures cycles, "one more turn" psychology, choices |
| **Session** (30-120 min) | Complete session shape, stopping points, between-session hook |
| **Progression** (days/weeks) | Growth type (power/knowledge/options/story), long-term goal, "done" condition |

**Player motivation (SDT):** autonomy (meaningful choice), competence (skill growth), relatedness (connection).

### Phase 4: Pillars and Boundaries

Define **3-5 pillars**: name + one-sentence definition + design test ("If debating X vs Y, this pillar says choose __"). Pillars should create tension with each other.

**3+ anti-pillars**: "We will NOT do [thing] because it would compromise [pillar]."

Pillar confirmation via `AskUserQuestion` → iterate until user selects "Lock these in."

**Review mode gates:**
- `solo` / `lean` → skip CD-PILLARS and AD-CONCEPT-VISUAL, note skipped
- `full` → spawn both `creative-director` (CD-PILLARS gate) and `art-director` (AD-CONCEPT-VISUAL gate) in parallel via Task. Present verdicts together in two-tab AskUserQuestion (Pillars + Visual anchor). User's visual anchor selection → stored as Visual Identity Anchor.

If CD returns CONCERNS/REJECT on pillars → resolve before visual anchor selection.

### Phase 5: Player Type Validation

Using Bartle taxonomy + Quantic Foundry: primary player type, secondary appeal, who this is NOT for, market validation (successful games serving similar type).

### Phase 6: Scope and Feasibility

- **Platform**: AskUserQuestion (PC / Mobile / Console / Web / Multiple)
- **Engine**: AskUserQuestion (Unity / Unreal / No preference → suggest `/setup-engine` later). Don't second-guess if they pick one.
- **Art pipeline, content scope, MVP definition, biggest risks, scope tiers**

**Review mode gates:**
- `solo` / `lean` → skip TD-FEASIBILITY and PR-SCOPE
- `full` → spawn `technical-director` (TD-FEASIBILITY) after tech risks identified, then `producer` (PR-SCOPE) after scope tiers defined. Present assessments, offer adjustments if HIGH RISK/UNREALISTIC.

## Document Generation

Generate game concept using template at `.claude/docs/templates/game-concept.md`. Include Visual Identity Anchor section. Scope consistency rule: Estimated Scope must match full-vision timeline.

AskUserQuestion for write approval → if "revise" → iterate until approved → write to `design/gdd/game-concept.md`.

## Next Steps (full pipeline)

1. `/setup-engine` — configure engine + reference docs
2. `/art-bible` — visual identity (BEFORE GDDs)
3. `/design-review design/gdd/game-concept.md` — validate completeness
4. `/map-systems` — decompose into systems with dependencies
5. `/design-system` — per-system GDDs
6. `/create-architecture` — master architecture blueprint + ADR list
7. `/architecture-decision` (×N) — one ADR per decision
8. `/gate-check` — phase gate before production
9. `/prototype [core-mechanic]` — validate core loop
10. `/playtest-report` — validate hypothesis
11. `/sprint-plan new` — first sprint

## Context Window

If context ≥70%: note that `design/gdd/game-concept.md` is saved, suggest fresh session.

Verdict: **COMPLETE** — game concept created and handed off.
