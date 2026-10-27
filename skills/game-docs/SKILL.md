---
name: game-docs
description: "Game design docs: full GDD (core loop, balance, glossary) and PAS for design decisions."
category: "gamedev"
argument-hint: "[gdd [game-name] | pas [problem-title]]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# game-docs — GDD + Design Decisions

Two game design documentation formats: a full GDD and PAS for one-off decisions.

---

## 1. GDD (Game Design Document)

### Input

Ask the user:
1. **Game name**
2. **Genre** (roguelite, RPG, puzzle, platformer, etc.)
3. **Platform** (PC, mobile, console, web)
4. **Elevator pitch** (1-2 sentences: what it is and what makes it unique)
5. **Core mechanic** (what the player does 80% of the time)
6. **References** (similar games or inspirations)
7. **Context** (thesis, indie, jam, studio, team size)

### GDD Structure

16 sections: Summary, Concept, Pillars, Art, Game Feel, Glossary, Core Loop, Core System, Levels, Enemies, Items, Economy, UI/UX, Audio, Scope, Open Decisions. Adapt to the genre.

> → Read references/gdd-structure.md for full section table with content guidelines

---

## 2. PAS (Problem-Analysis-Solution)

Format for one-off design decisions: Problem → Analysis → Options → Decision. Use it for problematic mechanics, balance, features, playtest feedback. NOT for a full GDD, technical specs or bugs.

> → Read references/pas-format.md for full PAS template, usage criteria, and examples

---

## Writing rules (both formats)

Bullets > paragraphs. Concrete numbers > vague descriptions. Don't ramble, don't repeat across sections. [TBD] for pending decisions.

> → Read references/writing-rules.md for full 9-rule list with examples

---

## Rules

- Write the document in the user's language, or the one they ask for
- The GDD is a living document — version and date it
- Include MVP scope vs full game
- If info is missing → [TBD] + list it under Open Decisions
- Pillars are mandatory — everything is evaluated against them
