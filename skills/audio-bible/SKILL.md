---
name: audio-bible
description: "Audio Bible authoring: sonic palette, emotional targets per game state, frequency allocation, mix hierarchy, audio standards. Use for: audio direction, sonic palette, the game's sonic identity."
category: "audio"
argument-hint: "[full|core|standards]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# audio-bible — Sonic Identity Specification

Defines the game's sonic identity. All audio production is gated against this document — it is the auditory equivalent of `/art-bible`.

## When to use

- After the game concept is approved, before producing a single sound
- When you need to standardize sonic judgment across sound designers and composers
- Before writing SFX specs (`/audio-spec`) or designing the music system (`/adaptive-music`)

## Input

1. Read the game concept (elevator pitch, pillars, core fantasy) and the art bible if one exists
2. Ask the user: scope (full bible / core sections 1-4 / standards only), target platforms, and sonic references (games, films, records)
3. If an audio bible already exists: detect complete vs empty sections, work only on the incomplete ones

---

## Audio Bible sections

### Core (sections 1-4) — define the sonic language

| # | Section | What it defines | Quality bar |
|---|---------|-----------|-------------------|
| 1 | **Sonic Identity Statement** | One-line sonic rule + 2-3 supporting principles | Resolves any sonic ambiguity. Each principle anchors in a game pillar |
| 2 | **Emotional Targets per Game State** | What the player should feel in exploration, combat, tension, victory, menu | Each state is audibly distinct without looking at the screen |
| 3 | **Sonic Palette** | Sources and textures: acoustic vs synthetic, organic vs processed, era/place, timbral vocabulary | A new sound can be accepted or rejected by reading this |
| 4 | **Frequency Allocation** | Which category owns which band — prevents masking before the mix exists | Dialogue, music, SFX and ambience do not compete for the same band |

### Production (sections 5-8) — concrete rules

| # | Section | What it defines |
|---|---------|-----------|
| 5 | **Mix Hierarchy** | Priority between categories, what ducks what, what is never stepped on |
| 6 | **Music Direction** | Instrumentation, scales/modes, tempo range, role of silence, adaptive strategy |
| 7 | **SFX Direction** | Impact philosophy, realism vs stylization, treatment of UI feedback, use of variation |
| 8 | **Audio Standards** | Sample rate, bit depth, formats, naming, loudness targets, memory and voice budgets per platform |

### Reference (section 9)

| # | Section | What it defines |
|---|---------|-----------|
| 9 | **References & Prohibitions** | 3-5 references with what to take and what to avoid from each. Explicit sonic prohibitions |

---

## Frequency allocation — the step most often skipped

Most game mixes break because nobody allocated bands before production. Defining a primary owner per band avoids redoing assets:

| Band | Primary owner | Note |
|---|---|---|
| Sub (20-60 Hz) | Impacts, explosions | Reserved, do not fill it with music |
| Low (60-250 Hz) | Music (bass, kick), body of impacts | Most frequent masking zone |
| Low-mid (250-500 Hz) | Ambience, body of props | Builds up mud if not controlled |
| Mid (500 Hz-2 kHz) | **Dialogue** — untouchable | Everything else yields here |
| High-mid (2-6 kHz) | UI feedback, transients, definition | Fatigues fast; use with precision |
| High (6-20 kHz) | Air, detail, brilliance | First to go under lossy compression |

When a new asset fights for a band it does not own, the fix is a design one (change the source), not EQ.

---

## Process

For each section:
1. **Draft** based on the game concept, pillars and references
2. **Present** it to the user for review
3. **Write** to file immediately after approval — ask "Should I write this section to `<path>`?" before using Write

Do not batch — write each approved section before moving to the next.

### Conflicts

If there is tension between audio direction and technical constraints (e.g. music in stems for adaptivity, but the memory budget does not allow it), surface the conflict explicitly with both positions. Do not resolve it silently.

If the sonic direction conflicts with accessibility (e.g. critical information conveyed only through audio), surface it and let the user decide.

---

## Principles

- The audio bible is a **constraint document**: it narrows the solution space in favor of sonic coherence
- Each section must connect to the game pillars
- Specific > generic: "dark and tense" is not enough — state the exact emotion, the timbral source, the frequency range, one sonic element that carries the mood
- For each reference: what to take AND what to avoid
- Silence is a design decision, not the absence of one — document it
- Standards must be producible: an external contractor should be able to deliver valid assets without additional briefing

---

## Anti-patterns

> → Read references/anti-patterns.md for common mistakes to avoid

## Verdict

When closing the document, issue a verdict per section:

- **READY** — the section resolves ambiguities and is actionable for production
- **CONCERNS** — it is written but generic or does not anchor in pillars; list what is missing
- **BLOCKED** — upstream input is missing (game concept, platforms, budget) and cannot be invented

If any Core section (1-4) stays BLOCKED, the bible does not unlock production yet.

## Next steps

- `/audio-spec` to turn the direction into SFX spec sheets and event lists
- `/adaptive-music` to design the music system against the emotional targets of section 2
- `/audio-mix` to implement the mix hierarchy of section 5
- `/audio-audit` to verify produced assets against the standards of section 8
