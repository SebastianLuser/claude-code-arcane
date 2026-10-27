---
name: scaffold-unity
description: "Unity project scaffolding: canonical structure, core managers, ScriptableObjects, Entity/State, naming conventions. Use for: new Unity project, scaffold, create a game, Unity boilerplate."
category: "gamedev"
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# scaffold-unity — Unity Project Scaffold

Generates the base structure for a new Unity project.

## Input

Ask the user:
1. **Game name**
2. **Genre** (roguelite, platformer, RPG, puzzle, etc.)
3. **Perspective** (isometric, top-down, side-scroll, first-person)
4. **Main systems** (combat, inventory, dialogue, crafting, etc.)
5. **Render pipeline** (2D URP, 3D URP, HDRP) — default: 2D URP

---

## Architecture

### Principles

1. Working code over perfect architecture
2. No namespaces — flat, for simplicity in small teams
3. Singletons only for cross-scene managers (`GameManager`, `AudioManager`)
4. ScriptableObjects for all tunable data — never hardcode gameplay
5. C# events (`System.Action<T>`) for cross-system communication
6. Entity/State separation — MonoBehaviour for the avatar, a plain class for the data
7. Static utilities for pure, stateless calculations

For detailed architecture decisions: `/unity-game-architecture`.

> → Read references/folder-structure-and-files.md for [folder structure and files to generate per category]

> → Read references/naming-conventions.md for [naming conventions table per element type]

---

## Rules

- Generate working C# that compiles
- NO namespaces
- TextMeshPro for all text (`using TMPro;`)
- `[CreateAssetMenu]` on every ScriptableObject
- Do NOT hardcode gameplay values — everything in SOs
- Adapt the structure and entities to the game's genre
- Docs in the user's language, code in English
