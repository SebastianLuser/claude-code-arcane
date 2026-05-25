---
name: vn-narrative-design
description: "Design the complete narrative structure for a visual novel: story arcs, branching paths, endings, character relationships, and pacing. Produces a story outline document that drives all other VN skills."
category: "visualnovel"
argument-hint: "[concept-hint or empty] [--scope short|medium|epic]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebSearch, AskUserQuestion
---

When this skill is invoked:

1. **Parse arguments** for concept hint and scope
   - `short`: 2-5 hours playtime, 1-3 endings, linear with minor branches
   - `medium`: 5-15 hours, 3-6 endings, moderate branching (default)
   - `epic`: 15+ hours, 6+ endings, complex branching with routes

2. **Check for existing work**:
   - Read `design/narrative/story-outline.md` if it exists (resume)
   - Read `design/gdd/game-concept.md` if it exists (use pillars)
   - Read `design/characters/*.md` for established characters

---

## Phase 1: Story Foundation

Ask the user interactively using `AskUserQuestion`:

**Tab "Genre"**: What genre defines your visual novel?
- Romance / Drama / Mystery-Thriller / Fantasy-Adventure / Horror / Sci-Fi

**Tab "Tone"**: What overall tone should the story have?
- Lighthearted & Comedic / Emotional & Dramatic / Dark & Suspenseful / Bittersweet & Reflective

**Tab "POV"**: What point of view for the protagonist?
- Named protagonist with defined personality
- Self-insert protagonist (player IS the character)
- Multiple viewpoint characters

Then ask in conversation (not constrained choices):
- What emotional experience should the player have by the end?
- Are there themes you want to explore?
- Any reference visual novels or stories that inspire this project?

**Synthesize** into a **Story Brief**:
> **Genre**: [genre] | **Tone**: [tone] | **POV**: [pov]
> **Core theme**: [theme]
> **Emotional arc**: [start feeling] → [midpoint shift] → [end feeling]
> **Inspirations**: [references]

---

## Phase 2: Story Structure Design

### Act Structure
Design a 3-5 act structure appropriate to scope:

| Act | Purpose | Chapters | Key Events |
|-----|---------|----------|------------|
| I — Setup | Introduce world, characters, conflict | 1-3 | Inciting incident |
| II — Rising | Deepen relationships, escalate conflict | 4-8 | Major choice points |
| III — Climax | Confrontation, route-specific peaks | 9-11 | Route climaxes |
| IV — Resolution | Endings, epilogues | 12+ | Multiple endings |

### Route Architecture (for medium/epic scope)
Design the branching structure:

```
Common Route (Acts I-II early)
├── Route A: [Character/Theme]
│   ├── Good Ending A1
│   ├── Normal Ending A2
│   └── Bad Ending A3
├── Route B: [Character/Theme]
│   ├── Good Ending B1
│   └── Bad Ending B2
├── Route C: [Character/Theme] (unlockable after A+B)
│   └── True Ending
└── Hidden Route (conditions: all good endings seen)
    └── Secret Ending
```

### Branching Philosophy
Present options and let user choose:
- **Hub-and-spoke**: common trunk with route branches (Fate/stay night style)
- **Waterfall**: early choices create increasingly divergent paths (428 style)
- **Parallel routes**: independent character routes selected early (Clannad style)
- **Kinetic with choices**: mostly linear with impactful decision points

---

## Phase 3: Character Web

For each major character, define:

| Field | Description |
|-------|-------------|
| **Name** | Full name + nickname/alias |
| **Role** | Protagonist / Love Interest / Antagonist / Support / Mentor |
| **Archetype** | (e.g., Tsundere, Genki, Kuudere, Mentor, Trickster) |
| **Want** | External goal (what they pursue) |
| **Need** | Internal growth (what they actually need) |
| **Secret** | Hidden information revealed during their route |
| **Relationship to MC** | Initial dynamic and how it evolves |
| **Conflict** | What creates tension with the protagonist |
| **Key scenes** | 3-5 pivotal moments in their arc |

Design the **Relationship Map** — how characters relate to each other beyond
just their connection to the protagonist.

---

## Phase 4: Pacing and Choice Architecture

### Choice Design Principles
- **Meaningful choices**: every choice should affect at least one variable
  (affinity, flag, stat) — no dead-end cosmetic choices
- **Foreshadowing**: good choices hint at consequences without spoiling
- **Characterization**: choices reveal the protagonist's personality
- **Tension pacing**: alternate high-tension choices with breathing room

### Choice Types:
1. **Affinity choices** — increase relationship with a character (+5, +10)
2. **Route locks** — accumulate to determine which route you enter
3. **Flag choices** — set boolean flags that alter future scenes
4. **Stat checks** — gated by accumulated stats (courage, intelligence)
5. **Timed choices** — pressure decisions (optional, use sparingly)

### Pacing Template per Chapter:
```
Scene 1: Establishing (calm) — set the scene, re-orient player
Scene 2: Development (rising) — advance plot or relationship
Scene 3: Choice point (peak) — meaningful decision
Scene 4: Consequence (falling) — show impact of choice
Scene 5: Hook (cliffhanger) — motivate next chapter
```

---

## Phase 5: Endings Design

For each ending, define:
- **Trigger conditions**: flags, affinity thresholds, choices required
- **Emotional tone**: triumphant / bittersweet / tragic / ambiguous
- **Resolution**: what the ending resolves (and what it leaves open)
- **Epilogue**: what happens after the main conflict resolves
- **Unlock order**: which endings should be experienced first for maximum impact

---

## Phase 6: Write Story Outline Document

Write to `design/narrative/story-outline.md` using incremental file writing:

```markdown
# [Title] — Story Outline

## Story Brief
[from Phase 1]

## Act Structure
[from Phase 2]

## Route Map
[branching diagram from Phase 2]

## Character Web
[from Phase 3]

## Choice Architecture
[from Phase 4 — list every major choice point with chapter, type, and impact]

## Endings
[from Phase 5]

## Chapter Breakdown
[per-chapter: scenes, characters present, choices, flags set/checked]

## Asset Requirements
[scenes → backgrounds needed, characters → sprites needed, CGs → event art needed]
```

After completion, suggest next steps:
- `/vn-character-design` for detailed character profiles and sprite specs
- `/vn-gdd` for the full game design document
- `/vn-dialogue-tree` for detailed choice flowcharts
