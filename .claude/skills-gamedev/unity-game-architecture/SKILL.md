---
name: unity-game-architecture
description: "Arquitectura Unity 6: estructura canónica _Project/, singletons, ScriptableObjects data-driven, composition, state machines, SO event bus, Input System, Addressables, performance budgets 60 FPS, object pooling, save system versionado, testing, build pipeline. Usar para: arquitectura Unity, estructura, performance, ScriptableObject, singleton, object pool, Addressables, state machine, build, save system."
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

## Performance (60 FPS target)

| Métrica | Budget |
|---------|--------|
| CPU main thread/frame | <16ms (60fps), <6.94ms (144fps) |
| GC allocs en hot loop | **0** por frame |
| Draw calls | <200 (batch + atlas + GPU instancing) |

Optimizaciones: Object Pooling (`ObjectPool<T>`) para spawns frecuentes, cache GetComponent en Awake (nunca en Update), Burst+Jobs solo para hot loops demostrados, LOD Groups, Occlusion Culling, Texture Atlases, GPU Instancing, Static Batching.

Memory: `UnloadSceneAsync` en additive loading, `UnloadUnusedAssets` tras cambio escena, max texture size por plataforma, mesh compression.

Coroutines: cachear `WaitForSeconds` como `static readonly`. Async I/O: preferir UniTask (zero-alloc).

## Save System

JSON (JsonUtility/Newtonsoft) en `Application.persistentDataPath`. PlayerPrefs solo para settings. `version: int` en cada save + migrators v1→v2→v3. Atomic writes (.tmp → validate → rename). **Prohibido:** `BinaryFormatter`.

## Testing

Separar lógica gameplay (clases puras → NUnit sin Play Mode) del wrapper MonoBehaviour (PlayMode tests solo para MB reales).

## Build & Git

Build: Mono (dev rápido), IL2CPP (release performance). Stripping disabled/dev, medium-high/release. Addressables build como step previo.

Git: .gitignore (Library/, Temp/, Builds/, Logs/, *.csproj, *.sln), LFS para binarios (.png/.fbx/.wav/.psd), Force Text serialization + Visible Meta Files, Smart Merge para .unity/.prefab.

## Anti-patterns

Scripts/ flat en Assets/, singleton para todo, GameObject.Find/FindObjectOfType en Update, GetComponent en Update sin cache, Instantiate/Destroy en hot path sin pool, LINQ .ToList()/.Where() en Update, string concat en logs Update, public fields everywhere (usar [SerializeField] private), escenas monolíticas, ignorar Profiler, ECS/DOTS sin necesidad, save binario sin versión, Resources/ para todo.

## Checklist

- [ ] `_Project/Scripts/` agrupada por feature
- [ ] Singletons solo state persistente cross-scene (≤4)
- [ ] Data en ScriptableObjects, no hardcoded
- [ ] Lógica gameplay testeable sin Play Mode (clases puras)
- [ ] Object Pooling en spawns frecuentes
- [ ] GetComponent cacheado en Awake
- [ ] GC allocs en hot loops = 0 (Profiler)
- [ ] Input System nuevo, no legacy
- [ ] Save system versionado, JSON, atomic writes
- [ ] Addressables para assets pesados
- [ ] WaitForSeconds cacheados
- [ ] Git LFS + Smart Merge configurado
- [ ] IL2CPP + stripping para release
- [ ] Profiler ejecutado antes de cerrar milestone
