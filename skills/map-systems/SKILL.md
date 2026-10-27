---
name: map-systems
description: "Decompose game concept into systems, map dependencies, prioritize design order, generate systems index."
category: "gamedev"
argument-hint: "[next | system-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# map-systems — Systems Decomposition

Decomposes a game concept into systems, maps dependencies and prioritizes the design order.

## Modes

- `/map-systems` — Full workflow (enumerate → dependencies → prioritize → write index)
- `/map-systems next` — Select the next undesigned system from the index
- `/map-systems [name]` — Design a specific system

---

## Phase 1: Context

**Required:** game concept (look in `design/gdd/`, `Documents/`, root). If it does not exist → ask the user.

**Optional:** game pillars, existing systems index (summarize, do not recreate), already-written GDDs.

If the index already exists: present the current state, ask what to do (update, design the next one, review priorities).

---

## Phase 2: Enumerate systems

### Explicit

Extract from: Core Mechanics, Core Loop, Technical Considerations, MVP Definition.

### Implicit — inference patterns

> → Read references/implicit-systems.md for [heuristics table: mentioned system → implicit systems]

Present each system with: name, category, 1-line description, explicit vs implicit.

**Validate with the user before continuing.**

---

## Phase 3: Dependencies → Phase 4: Prioritize

> → Read references/dependency-layers-priorities.md for [dependency heuristics, layers, risk detection, priority tiers and design order]

**Validate with the user before continuing** (both dependencies and priorities).

---

## Phase 5: Write the systems index

Create a table with: name, category, layer, priority tier, dependencies, status, design order.

Before writing, present a summary:
- Total per category and tier
- First 3 in design order
- High-risk systems (bottlenecks)

Ask for explicit approval before writing the file.

---

## Phase 6: Design systems

Select a system (by name, or `next` = highest-priority undesigned one) → hand off to `/design-system [name]`.

After each completed GDD: offer to continue with the next one or stop.

---

## Protocol

- **Never** auto-generate the full list without user review
- **Never** start designing without confirmation
- **Always** validate enumeration, dependencies and priorities
- **Ask permission** before writing files
- If the context window reaches ~70%: save progress, suggest a new session with `/map-systems next`
