---
name: art-bible
description: "Art Bible authoring: mood, shape language, color system, character/environment direction, asset standards."
category: "gamedev"
argument-hint: "[full|core|standards]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# art-bible — Visual Identity Specification

Defines the game's visual identity. All asset production is gated against this document.

## When to use

- After the game concept is approved, before asset production
- When you need to standardize the visual style across artists
- Before generating asset specs (`/asset-spec`)

## Input

1. Read the game concept (elevator pitch, pillars, core fantasy)
2. Ask the user: scope (full bible / core sections 1-4 / asset standards only) and visual references (games, films, art)
3. If an art bible already exists: detect complete vs empty sections, work only on the incomplete ones

---

## Art Bible sections

### Core (sections 1-4) — define the visual language

| # | Section | What it defines | Quality criterion |
|---|---------|-----------|-------------------|
| 1 | **Visual Identity Statement** | 1-line visual rule + 2-3 supporting principles | Resolves any visual ambiguity. Each principle anchors to a pillar |
| 2 | **Mood & Atmosphere** | Emotional target per game state (exploration, combat, menu...) | Lighting, color temperature, contrast, energy. Each state visually distinct |
| 3 | **Shape Language** | Geometric vocabulary (silhouettes, environment geometry, UI shapes) | Readable at thumbnail size. Hero shapes vs supporting shapes |
| 4 | **Color System** | Primary palette (5-7 colors with roles), semantic colors, UI palette | Each color has an explicit meaning. Colorblind safety with backup cues |

### Production (sections 5-8) — concrete rules for production

| # | Section | What it defines |
|---|---------|-----------|
| 5 | **Character Design** | Archetypes, distinguishing features per type, expression style, LOD philosophy |
| 6 | **Environment Design** | Architectural style, texture philosophy, prop density, environmental storytelling |
| 7 | **UI/HUD Direction** | Diegetic vs screen-space, typography, iconography style, animation feel |
| 8 | **Asset Standards** | Formats, naming, texture res tiers, polycount budgets, export settings |

### Reference (section 9)

| # | Section | What it defines |
|---|---------|-----------|
| 9 | **References & Prohibitions** | 3-5 references with what to take and what to avoid from each. Explicit style prohibitions |

---

## Process

For each section:
1. **Draft** it based on the game concept, pillars and references
2. **Present** it to the user for review
3. **Write** it to file immediately after approval

Do not batch — write each approved section before moving to the next one.

### Conflicts

If there is tension between art direction and technical constraints (e.g. art wants 4K textures but the performance budget requires 2K), surface the conflict explicitly with both positions. Do not resolve it silently.

If UI direction conflicts with readability/accessibility, surface it and let the user decide.

---

## Principles

- The art bible is a **constraint document**: it narrows the solution space in favor of visual coherence
- Each section must connect to the game's pillars
- Specific > generic: "dark and foreboding" is not enough — state the exact emotion, lighting, contrast, and one visual element that carries the mood
- For each reference: what to take AND what to avoid (prevents "trying to copy X")
- Asset standards must be producible — an external team should be able to follow them without additional briefing

---

## Anti-patterns

> → Read references/anti-patterns.md for common mistakes to avoid

## Checklist

> → Read references/checklist.md for full Core/Production/Reference checklist
