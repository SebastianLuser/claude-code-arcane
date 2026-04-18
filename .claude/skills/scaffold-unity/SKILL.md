---
name: scaffold-unity
description: "Scaffolding de proyectos Unity siguiendo la arquitectura de Project_T: Singleton managers, ScriptableObject data, Entity/State separation, flat structure sin namespaces. Usar cuando se mencione: nuevo proyecto Unity, scaffold Unity, crear juego Unity, boilerplate Unity."
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Unity Project Scaffold — Estilo Project_T

Genera la estructura de scripts y datos para un nuevo proyecto Unity siguiendo los patrones del Roguelite Dice Dungeon (Tesis-UADE-2026).

## Input

Preguntar al usuario:
1. **Nombre del juego**
2. **Género/tipo** (e.g., roguelite, platformer, RPG, puzzle)
3. **Perspectiva** (isométrica, top-down, side-scroll, first-person)
4. **Sistemas principales** (e.g., combate, inventario, diálogos, crafting)
5. **Render pipeline** (2D URP, 3D URP, HDRP) — default: 2D URP
6. **Tamaño del equipo**

## Arquitectura de referencia (Project_T)

### Principios

1. **Prototype quality** — código funcional sobre arquitectura perfecta
2. **No namespaces** — todo flat para simplicidad
3. **Singletons** para managers — `public static X Instance; void Awake() { Instance = this; }`
4. **ScriptableObjects** para TODOS los datos tuneables — nunca hardcodear números de gameplay
5. **C# events** (`System.Action<T>`) para comunicación cross-system
6. **Entity/State separation** — MonoBehaviour para avatar, clase pura para datos
7. **Static utilities** para cálculos puros sin estado

### Estructura de carpetas

```
Assets/
├── Scripts/
│   ├── Managers/       # Singletons (GameManager, AudioManager, etc.)
│   ├── Core/           # Tipos compartidos, enums, utilidades estáticas
│   ├── Data/           # ScriptableObject class definitions
│   ├── Entities/       # Entity (MB) + State (data class)
│   ├── [Sistema1]/     # Scripts de cada sistema de gameplay
│   ├── [Sistema2]/
│   ├── UI/             # Todos los scripts de UI
│   ├── Rendering/      # Shaders, render features, effects
│   └── Editor/         # Editor tools, inspectors
│
├── Data/               # ScriptableObject INSTANCES (.asset files)
│   ├── [Categoria1]/
│   └── [Categoria2]/
│
├── Prefabs/
│   ├── [Tipo1].prefab
│   └── [Tipo2].prefab
│
├── Resources/
│   ├── Materials/
│   └── Sounds/
│
├── Scenes/
│   └── GameScene.unity
│
├── Documents/
│   └── Game Design Document.md
│
└── Sounds/
```

## Archivos a generar

### 1. Core/Enums.cs
```csharp
// Enums del juego — agregar spacing para extensibilidad
public enum GameState
{
    MainMenu = 0,
    Exploration = 10,
    Combat = 20,
    Pause = 30,
    GameOver = 40,
    Victory = 50
}

// [Agregar enums específicos del género]
```

### 2. Core/SharedTypes.cs
```csharp
[System.Serializable]
public struct GameConfig
{
    // Valores globales del juego
}

// [Agregar structs compartidos]
```

### 3. Managers/GameManager.cs
```csharp
public class GameManager : MonoBehaviour
{
    public static GameManager Instance;
    
    public static event System.Action<GameState> OnStateChanged;
    
    public GameState CurrentState { get; private set; }
    
    void Awake()
    {
        Instance = this;
    }
    
    public void TransitionTo(GameState newState)
    {
        CurrentState = newState;
        OnStateChanged?.Invoke(newState);
    }
}
```

### 4. Managers/AudioManager.cs
```csharp
public class AudioManager : MonoBehaviour
{
    public static AudioManager Instance;
    
    [SerializeField] private AudioSource musicSource;
    private AudioSource[] sfxPool;
    private int poolIndex;
    
    void Awake()
    {
        Instance = this;
        sfxPool = new AudioSource[8];
        for (int i = 0; i < sfxPool.Length; i++)
        {
            sfxPool[i] = gameObject.AddComponent<AudioSource>();
            sfxPool[i].playOnAwake = false;
        }
    }
    
    public static void Play(AudioClip clip, float volumeScale = 1f)
    {
        if (Instance == null || clip == null) return;
        var source = Instance.sfxPool[Instance.poolIndex];
        source.clip = clip;
        source.volume = volumeScale;
        source.Play();
        Instance.poolIndex = (Instance.poolIndex + 1) % Instance.sfxPool.Length;
    }
}
```

### 5. Data/ (ScriptableObject definitions)
```csharp
// Para cada tipo de dato del juego:
[CreateAssetMenu(menuName = "Game/{NombreData}")]
public class {NombreData} : ScriptableObject
{
    public string DisplayName;
    // [campos específicos]
}
```

### 6. Entities/ (Entity + State pattern)
```csharp
// {Entity}Entity.cs — MonoBehaviour (avatar en escena)
public class {Entity}Entity : MonoBehaviour
{
    public {Entity}State State { get; private set; }
    
    public void Initialize({Entity}Data data, Vector2Int position)
    {
        State = {Entity}State.Create(data);
        State.GridPosition = position;
    }
}

// {Entity}State.cs — Clase pura (datos mutables)
[System.Serializable]
public class {Entity}State
{
    public {Entity}Data BaseData;
    public int CurrentHP;
    public int MaxHP;
    public Vector2Int GridPosition;
    
    public bool IsAlive => CurrentHP > 0;
    
    public static {Entity}State Create({Entity}Data data)
    {
        return new {Entity}State
        {
            BaseData = data,
            CurrentHP = data.MaxHP,
            MaxHP = data.MaxHP
        };
    }
    
    public void TakeDamage(int amount)
    {
        CurrentHP = Mathf.Max(0, CurrentHP - amount);
    }
}
```

### 7. Documents/Game Design Document.md

Generar esqueleto de GDD usando la skill `/doc-gdd`.

### 8. CLAUDE.md

```markdown
# [Nombre del Juego] — Project Rules

## Project Overview
[Descripción breve]

## Tech Stack
- **Engine**: Unity [version]
- **Render Pipeline**: [pipeline]
- **Input**: New Input System
- **UI**: TextMeshPro + uGUI

## Architecture Rules
[Copiar reglas de naming, patrones, etc.]

## Game Design Rules
[Pilares de diseño, terminología]
```

## Color Palette (default — ajustar al juego)

| Element | Hex |
|---------|-----|
| Background | #1a1a2e |
| UI panel bg | #1e1e3a |
| UI text | #e0e0e0 |
| Accent | #ffd54f |
| Player | #4fc3f7 |
| Enemy | #ef5350 |
| HP bar | #e53935 |

## Naming Conventions

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Classes/Structs | PascalCase | `DiceBag`, `PlayerState` |
| ScriptableObjects | PascalCase + Data suffix | `EnemyData`, `WeaponData` |
| Public methods | PascalCase | `TakeDamage()` |
| Private methods | camelCase | `calculateDamage()` |
| Private fields | _camelCase | `_currentHP` |
| Enums | PascalCase | `GameState.Combat` |

## Rules
- Generar código C# funcional que compile
- NO usar namespaces
- Usar TextMeshPro para todo texto (`using TMPro;`)
- ScriptableObjects con `[CreateAssetMenu]`
- Enum values con spacing explícito (0, 10, 20...)
- NO hardcodear valores de gameplay
- Incluir CLAUDE.md con las convenciones
- Adaptar la estructura al género del juego
- En español para docs, en inglés para código
