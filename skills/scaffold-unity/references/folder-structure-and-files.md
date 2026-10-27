# Folder Structure & Files to Generate

## Folder structure

```
Assets/
  _Project/
    Scripts/
      Core/             # GameManager, AudioManager, enums, shared types
      [Feature1]/       # Scripts grouped by feature
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

## Files to generate

### Core
- **Enums.cs** — Main enum (GameState, etc.) with spacing for extensibility (0, 10, 20...)
- **SharedTypes.cs** — Shared structs (GameConfig, etc.)

### Managers
- **GameManager.cs** — Singleton, `DontDestroyOnLoad`, state with an `OnStateChanged` event
- **AudioManager.cs** — Singleton, SFX pool (round-robin `AudioSource[]`), separate music source

### Data (for each data type in the game)
- **{Name}Data.cs** — `ScriptableObject` with `[CreateAssetMenu]`, the type's fields

### Entities (for each main entity)
- **{Entity}Entity.cs** — MonoBehaviour (avatar), receives Data, initializes State
- **{Entity}State.cs** — Plain class (mutable data), factory method `Create(Data)`

### Documents
- **Game Design Document.md** — GDD skeleton (or delegate to `/doc-gdd`)
- **CLAUDE.md** — Project rules: stack, architecture, naming, design pillars
