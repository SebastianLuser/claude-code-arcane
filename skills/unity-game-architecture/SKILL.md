---
name: unity-game-architecture
description: "Unity 6 architecture: _Project/ structure, ScriptableObjects, state machines, Addressables, pooling, 60 FPS budgets, save system."
category: "gamedev"
argument-hint: "[system or module name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# unity-game-architecture — Decisions & Conventions

Decision guide for Unity 6 (C#). Small teams, proven patterns without over-engineering.

## Philosophy

No ECS/DOTS unless the Profiler proves the need. Scale complexity with the project. Profile first, optimize later. Testable logic decoupled from MonoBehaviour.

## Folder Structure

`Assets/_Project/Scripts/` grouped by **feature** (not by type). Core/ (persistent managers, scene loader), Gameplay/[Feature]/, Systems/, UI/, Data/ (SO class defs), Utils/. Prefabs/, ScriptableObjects/ (.asset instances), Scenes/, Art/, Audio/, Shaders/. Plugins/ and ThirdParty/ outside _Project/.

## Architecture Decisions

| Pattern | When YES | When NO |
|--------|-----------|-----------|
| **Singletons** | Persistent global cross-scene state (run state, settings, audio, input, scene loader). Max 3-4 | Everything else. Only 1 scene → `[SerializeField]` or an SO event |
| **ScriptableObjects** | All tunable data (stats, items, abilities, level config). Editor-friendly, hot-swappable, shared by ref, testable | — |
| **Composition** | Entities = GO + small components (Health, Movement, Inventory) | Deep hierarchies (Player:Character:Entity:MB) |
| **State Machine** | Entity with 3+ states (combat turns, enemy AI, UI flows) | Simple on/off toggle |
| **SO Event Bus** | 3+ systems communicating without a direct reference (UI, SFX, VFX react) | Only 2 systems (direct ref OK). Complex payload (C# events) |
| **Input System** | Always the new one (`com.unity.inputsystem`). Action maps per context | Never legacy `Input.GetKey` |
| **Addressables** | Scenes and heavy assets (async loading, memory mgmt, DLC) | Lightweight settings/UI prefabs (direct is OK) |

## Performance, Save, Testing & Build

60 FPS target: <16ms/frame, 0 GC allocs in hot loops, <200 draw calls. JSON saves with versioning. Pure logic testable without Play Mode. IL2CPP+stripping for release.

> → Read references/performance-and-systems.md for budgets, optimization list, save system, testing, and build/git config

## Anti-patterns

> → Read references/anti-patterns.md for 13 common Unity anti-patterns to avoid

## Checklist

> → Read references/checklist.md for 14-item architecture validation checklist
