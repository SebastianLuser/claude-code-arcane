---
name: scaffold-unity
description: "Scaffolding de proyectos Unity: estructura canónica, managers core, ScriptableObjects, Entity/State, naming conventions. Usar para: nuevo proyecto Unity, scaffold, crear juego, boilerplate Unity."
category: "gamedev"
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# scaffold-unity — Unity Project Scaffold

Genera estructura base para un nuevo proyecto Unity.

## Input

Preguntar al usuario:
1. **Nombre del juego**
2. **Género** (roguelite, platformer, RPG, puzzle, etc.)
3. **Perspectiva** (isométrica, top-down, side-scroll, first-person)
4. **Sistemas principales** (combate, inventario, diálogos, crafting, etc.)
5. **Render pipeline** (2D URP, 3D URP, HDRP) — default: 2D URP

---

## Arquitectura

### Principios

1. Código funcional sobre arquitectura perfecta
2. No namespaces — flat para simplicidad en equipos chicos
3. Singletons solo para managers cross-scene (`GameManager`, `AudioManager`)
4. ScriptableObjects para todos los datos tuneables — nunca hardcodear gameplay
5. C# events (`System.Action<T>`) para comunicación cross-system
6. Entity/State separation — MonoBehaviour para avatar, clase pura para datos
7. Static utilities para cálculos puros sin estado

Para decisiones de arquitectura en detalle: `/unity-game-architecture`.

> → Read references/folder-structure-and-files.md for [estructura de carpetas y archivos a generar por categoría]

> → Read references/naming-conventions.md for [tabla de naming conventions por tipo de elemento]

---

## Rules

- Generar C# funcional que compile
- NO namespaces
- TextMeshPro para todo texto (`using TMPro;`)
- `[CreateAssetMenu]` en todo ScriptableObject
- NO hardcodear valores de gameplay — todo en SOs
- Adaptar estructura y entidades al género del juego
- Español para docs, inglés para código
