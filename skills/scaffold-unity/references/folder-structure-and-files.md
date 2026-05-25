# Folder Structure & Files to Generate

## Estructura de carpetas

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
- **CLAUDE.md** — Reglas del proyecto: stack, arquitectura, naming, pilares de diseno
