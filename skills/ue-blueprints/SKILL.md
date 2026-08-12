---
name: ue-blueprints
description: "Blueprint visual scripting — Blueprint Classes, Event Graph, Construction Script, Cast vs Interface vs Event Dispatcher"
category: "gamedev"
argument-hint: "[blueprint o graph]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# UE Blueprints (Visual Scripting)

Structure gameplay logic in Unreal Engine 5 Blueprints: pick the right graph, expose data cleanly, and choose a communication method that doesn't create hard-reference spaghetti. Blueprints are node graphs, so the snippets below describe node flows rather than compilable code.

Ask before writing: this skill edits Blueprint assets and the C++ classes they derive from. Propose the change and get approval before using Write or Edit.

## Context Check

Read `docs/unreal/project-context.md` before proceeding. Confirm:

- Engine version — node names and defaults drift between releases
- Whether the project is Blueprint-only or has a C++ base (changes where logic belongs)
- Team conventions for the C++/Blueprint boundary and asset naming (`BP_`, `WBP_`, `BPI_`)

## When to Use

- Authoring a Blueprint Class, wiring the Event Graph (BeginPlay/Tick/overlap), using the Construction Script, creating variables/functions/macros, or choosing how two Blueprints communicate.
- The project works visually rather than in C++.

**When not to use:** performance-critical systems, large data structures, or anything that benefits from source-control diffs and unit tests → `/ue-cpp-foundations`. Player input mapping → `/ue-input-system`. AI decision logic → `/ue-ai-navigation`.

## Core Workflow

1. **Choose the Blueprint type.** A **Blueprint Class** (derived from Actor/Pawn/Character/ActorComponent) defines a reusable object. The **Level Blueprint** is a per-level graph for level-specific scripting only — don't put reusable logic there.
2. **Use the Construction Script for editor-time setup** (procedural placement, configuring components from variables) — it runs when the actor is placed or edited, *not* during play.
3. **Use the Event Graph for runtime logic.** `Event BeginPlay` for init, input/overlap events for reactions. Avoid `Event Tick` unless you truly need per-frame work.
4. **Expose data with variables.** Click the eye icon to make a variable Instance Editable, and group related ones with categories. Mark **pure** functions (no exec pin) for getters.
5. **Pick a communication method by coupling.** Direct **Cast** for things you own, **Blueprint Interface** to call across types without hard references, **Event Dispatcher** to broadcast one-to-many.
6. **Verify** with the Blueprint debugger: drop breakpoints on nodes, watch variable values, and use Print String to confirm execution paths during Play In Editor (PIE).

## Patterns

### 1. Reactive Event Graph (no Tick)

```text
Event BeginPlay
  -> Set 'StartLocation' = GetActorLocation
  -> Bind Event to OnComponentBeginOverlap (TriggerVolume) [calls custom event OnEnterZone]

OnEnterZone (Other Actor)
  -> Branch: Other Actor == Player?
       True  -> Open Door (Timeline drives the rotation)   // event-driven, runs once
```

Prefer events (overlaps, timers, dispatchers) and Timelines over polling in Tick.

### 2. Direct reference + Cast (tight coupling, use sparingly)

```text
Overlapped Actor (Actor ref)
  -> Cast To BP_Player
       Cast Failed -> (do nothing)
       Success     -> call BP_Player.ApplyDamage(10)
```

`Cast To` creates a hard reference to that class, which then loads with this Blueprint. Fine when the caller genuinely depends on that type; otherwise prefer an Interface.

### 3. Blueprint Interface (decoupled call)

```text
// 1. Create BPI_Interactable with function 'Interact(Instigator)'.
// 2. Add the interface to BP_Door, BP_Chest, BP_Lever and implement 'Interact' in each.
// 3. Caller, with any Actor ref:
Player presses Use
  -> Does Object Implement Interface (BPI_Interactable)?  // safe check, no Cast/hard ref
       True -> Interact (Message) on Target Actor
```

### 4. Event Dispatcher (one-to-many broadcast)

```text
// In BP_Player: declare Event Dispatcher 'OnHealthChanged (float NewHealth)'.
TakeDamage -> Set Health -> Call 'OnHealthChanged' (Health)   // broadcast

// In WBP_HUD BeginPlay: Bind Event to 'OnHealthChanged' -> update health bar.
// Many listeners can bind; the player never references them.
```

## Common Mistakes

- **Cast spaghetti / long load times** — chains of `Cast To` create hard references that pull whole asset trees into memory. Decouple with Interfaces or Dispatchers.
- **Logic in the Level Blueprint that should be reusable** — it can't be reused across levels. Put it in a Blueprint Class.
- **`Event Tick` overuse** — every-frame nodes add up fast. Use events, Timers (`Set Timer by Event`), and Timelines instead.
- **Construction Script doing gameplay** — it runs in the editor on edit/placement; spawning gameplay actors or starting logic there causes editor-only artifacts. Initialize in BeginPlay.
- **Variable not visible on the instance** — toggle Instance Editable (the eye); to set it before spawn via the Spawn node, also mark "Expose on Spawn".
- **Interface call did nothing** — the target doesn't implement the interface. Use "Does Implement Interface" before calling, or the Message version, which is safe on non-implementers.
- **Blueprint graphs that outgrew visual scripting** — past roughly 20 nodes in one function, readability and diffability collapse. Move it to C++.

## Reference Files

> → Read references/communication.md for the Cast vs Interface vs Event Dispatcher decision guide and step-by-step dispatcher binding

Primary docs: [Blueprints Visual Scripting](https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-blueprints-visual-scripting-in-unreal-engine).

---

## Related Skills

- `/ue-cpp-foundations` — when to drop to C++, and how BP and C++ classes interoperate
- `/ue-gameplay-framework` — the framework classes these Blueprints usually derive from
- `/ue-input-system` — the modern way to feed input events into these graphs
- `/ue-ai-navigation` — AI decision logic that Blueprints trigger
- `/ue-naming-conventions` — asset prefixes and Content folder layout for these assets

---

## Checklist

Validate before considering the work done:

- [ ] No `Cast To` chain creates a hard reference that could be an Interface call
- [ ] `Event Tick` is unused, or its per-frame cost is justified and measured
- [ ] Reusable logic lives in a Blueprint Class, not the Level Blueprint
- [ ] Construction Script does editor-time setup only, with no gameplay side effects
- [ ] Conventions in `docs/unreal/project-context.md` were read and followed
- [ ] The Common Mistakes section of this skill was reviewed against the change

**PASS** — every item holds. **CONCERNS** — the work stands but at least one item is unresolved and worth flagging to the user. **FAIL** — an item is violated in a way that breaks correctness, load times or the frame budget; fix it before handing the work over.

## Next Steps

- `/ue-cpp-foundations` — migrate any graph that outgrew visual scripting
- `/perf-profile` — measure Blueprint tick and load cost
- `/code-review` — architectural and quality review of the change
- `/commit` — conventional commit once the change is verified
