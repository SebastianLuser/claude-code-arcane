---
name: scaffold-unity
description: "Scaffolding de proyectos Unity: estructura canónica, managers core, ScriptableObjects, Entity/State, naming conventions. Usar para: nuevo proyecto Unity, scaffold, crear juego, boilerplate Unity."
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

### Estructura de carpetas

```
Assets/
  _Project/
    Scripts/
      Core/             # GameManager, AudioManager, enums, shared types
      [Feature1]/       # Scripts agrupados por feature
      [Feature2]/
      Data/             # SO class definitions
      UI/
      Editor/           # Editor tools, inspectors
    Prefabs/
    ScriptableObjects/  # SO instances (.asset)
    Scenes/
    Art/
    Audio/
    Documents/
      Game Design Document.md
```

---

## Archivos a generar

### Core
- **Enums.cs** — Enum principal (GameState, etc.) con spacing para extensibilidad (0, 10, 20...)
- **SharedTypes.cs** — Structs compartidos (GameConfig, etc.)

### Managers
- **GameManager.cs** — Singleton, `DontDestroyOnLoad`, state con `OnStateChanged` event
- **AudioManager.cs** — Singleton, SFX pool (round-robin `AudioSource[]`), music source separada

### Data (por cada tipo de dato del juego)
- **{Nombre}Data.cs** — `ScriptableObject` con `[CreateAssetMenu]`, campos del tipo

### Entities (por cada entidad principal)
- **{Entity}Entity.cs** — MonoBehaviour (avatar), recibe Data, inicializa State
- **{Entity}State.cs** — Clase pura (datos mutables), factory method `Create(Data)`

### Documents
- **Game Design Document.md** — Esqueleto de GDD (o delegar a `/doc-gdd`)
- **CLAUDE.md** — Reglas del proyecto: stack, arquitectura, naming, pilares de diseño

---

## Naming Conventions

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Classes/Structs | PascalCase | `DiceBag`, `PlayerState` |
| ScriptableObjects | PascalCase + Data | `EnemyData`, `WeaponData` |
| Public methods | PascalCase | `TakeDamage()` |
| Private methods | camelCase | `calculateDamage()` |
| Private fields | _camelCase | `_currentHP` |
| Enums | PascalCase | `GameState.Combat` |
| Assets | lowercase_underscores | `enemy_goblin_idle.png` |

---

## Rules

- Generar C# funcional que compile
- NO namespaces
- TextMeshPro para todo texto (`using TMPro;`)
- `[CreateAssetMenu]` en todo ScriptableObject
- NO hardcodear valores de gameplay — todo en SOs
- Adaptar estructura y entidades al género del juego
- Español para docs, inglés para código
