# Performance & Systems Detail

## Performance (60 FPS target)

| Metric | Budget |
|---------|--------|
| CPU main thread/frame | <16ms (60fps), <6.94ms (144fps) |
| GC allocs in a hot loop | **0** per frame |
| Draw calls | <200 (batch + atlas + GPU instancing) |

Optimizations: Object Pooling (`ObjectPool<T>`) for frequent spawns, cache GetComponent in Awake (never in Update), Burst+Jobs only for proven hot loops, LOD Groups, Occlusion Culling, Texture Atlases, GPU Instancing, Static Batching.

Memory: `UnloadSceneAsync` with additive loading, `UnloadUnusedAssets` after a scene change, max texture size per platform, mesh compression.

Coroutines: cache `WaitForSeconds` as `static readonly`. Async I/O: prefer UniTask (zero-alloc).

## Save System

JSON (JsonUtility/Newtonsoft) in `Application.persistentDataPath`. PlayerPrefs only for settings. `version: int` in every save + migrators v1->v2->v3. Atomic writes (.tmp -> validate -> rename). **Forbidden:** `BinaryFormatter`.

## Testing

Separate gameplay logic (pure classes -> NUnit without Play Mode) from the MonoBehaviour wrapper (PlayMode tests only for real MBs).

## Build & Git

Build: Mono (fast dev), IL2CPP (release performance). Stripping disabled for dev, medium-high for release. Addressables build as a prior step.

Git: .gitignore (Library/, Temp/, Builds/, Logs/, *.csproj, *.sln), LFS for binaries (.png/.fbx/.wav/.psd), Force Text serialization + Visible Meta Files, Smart Merge for .unity/.prefab.
