---
name: doc-gdd
description: "Generate a full GDD (Project_T format): glossary, core loop, systems, balance, economy. Professional 16-section structure."
category: "gamedev"
argument-hint: "[game-name or empty]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
---
# GDD Generator — Project_T Style

## Input (ask the user)

1. Game name (or working title)
2. Genre (roguelite, RPG, puzzle, platformer, etc.)
3. Platform (PC, mobile, console, web)
4. Elevator pitch (1-2 sentences: what it is, what makes it unique)
5. Core mechanic (what the player does 80% of the time)
6. References (similar games/inspirations)
7. Team size and context (thesis, indie, jam, studio)

## GDD structure (16 sections)

1. **Summary** — table: genre, platform, engine, perspective, players, average session, target audience
2. **Concept** — elevator pitch in 2-3 sentences: "It's like [Ref] but with [differentiator]"
3. **Design Pillars** — 3 pillars with a 1-line explanation. Test: a feature that supports no pillar → it does not go in
4. **Art Direction** — visual style, color palette (hex/usage table), references/moodboard
5. **Game Feel and Feedback** — 3 visual/audio feedback principles with their application
6. **Glossary** — term/meaning/do-not-use table. ALWAYS use it in code, docs, UI
7. **Core Loop** — diagram (Prepare→Explore→Fight→Reward→repeat) + layers table (micro/mid/macro with duration and what happens)
8. **Core System** — turn/round structure, player mechanics, value tables
9. **Exploration/Levels** — generation (procedural/handcrafted/hybrid), types table (frequency/content), difficulty curve
10. **Enemies/Obstacles** — types table (HP/damage/behavior/appears in), AI/behavior
11. **Items/Power-ups** — categories table (effect/example), item economy balance
12. **Economy and Progression** — resources table (earned from/spent on), progression curve, meta-progression
13. **UI/UX** — screens table (purpose/elements), gameplay HUD
14. **Audio** — music table (situation/style/reference), SFX table (action/sound)
15. **Scope and Priorities** — MVP checklist + NOT included (post-MVP) + roadmap table (Prototype→VS→Alpha→Beta→Release)
16. **Open Decisions** — #/decision/options/status table [TBD]

Appendices: balance formulas, full stat tables, state flows.

## Writing rules

- Every sentence adds new info — do not ramble
- Bullet points > paragraphs
- Concrete numbers > vague descriptions ("100 HP, 2 AP" > "moderate health")
- No rhetorical questions or general recommendations
- Do not repeat info across sections
- Open decisions → PAS format (see `/doc-pas`)
- Max 2-3 sentences per system description — if it needs more, a table is missing
- Always in the user's language
- Glossary used consistently across the whole document
- Balance tables with numbers (even if estimated)
- Pending items marked [TBD] and listed in Open Decisions
- Adapt sections to the genre (a puzzle game does not need "enemies")
- The GDD is a living document — version and date it
