---
name: unity-game-architecture
description: "Arquitectura Unity 6: _Project/ structure, ScriptableObjects, state machines, Addressables, pooling, 60 FPS budgets, save system."
category: "gamedev"
argument-hint: "[system or module name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# unity-game-architecture — Decisions & Conventions

Decision guide para Unity 6 (C#). Equipos chicos, patrones probados sin over-engineering.

## Filosofía

No ECS/DOTS salvo necesidad demostrada con Profiler. Escalar complejidad con el proyecto. Profile primero, optimizá después. Lógica testeable desacoplada de MonoBehaviour.

## Estructura de Carpetas

`Assets/_Project/Scripts/` agrupado por **feature** (no por tipo). Core/ (persistent managers, scene loader), Gameplay/[Feature]/, Systems/, UI/, Data/ (SO class defs), Utils/. Prefabs/, ScriptableObjects/ (.asset instances), Scenes/, Art/, Audio/, Shaders/. Plugins/ y ThirdParty/ fuera de _Project/.

## Decisiones de Arquitectura

| Patrón | Cuándo SÍ | Cuándo NO |
|--------|-----------|-----------|
| **Singletons** | State global persistente cross-scene (run state, settings, audio, input, scene loader). Max 3-4 | Todo lo demás. Solo 1 escena → `[SerializeField]` o SO event |
| **ScriptableObjects** | Todos los datos tuneables (stats, items, habilidades, config niveles). Editor-friendly, hot-swappable, shared by ref, testeable | — |
| **Composition** | Entidades = GO + componentes pequeños (Health, Movement, Inventory) | Jerarquías profundas (Player:Character:Entity:MB) |
| **State Machine** | Entidad con 3+ estados (combat turns, enemy AI, UI flows) | Toggle simple on/off |
| **SO Event Bus** | 3+ sistemas comunicándose sin referencia directa (UI, SFX, VFX reaccionan) | Solo 2 sistemas (ref directa OK). Payload complejo (C# events) |
| **Input System** | Siempre nuevo (`com.unity.inputsystem`). Action maps por contexto | Nunca `Input.GetKey` legacy |
| **Addressables** | Escenas y assets pesados (carga async, memory mgmt, DLC) | Settings/UI prefabs livianos (directo OK) |

## Performance, Save, Testing & Build

60 FPS target: <16ms/frame, 0 GC allocs in hot loops, <200 draw calls. JSON saves with versioning. Lógica pura testeable sin Play Mode. IL2CPP+stripping for release.

> → Read references/performance-and-systems.md for budgets, optimization list, save system, testing, and build/git config

## Anti-patterns

> → Read references/anti-patterns.md for 13 common Unity anti-patterns to avoid

## Checklist

> → Read references/checklist.md for 14-item architecture validation checklist
