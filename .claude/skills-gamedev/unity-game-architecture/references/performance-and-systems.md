# Performance & Systems Detail

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

JSON (JsonUtility/Newtonsoft) en `Application.persistentDataPath`. PlayerPrefs solo para settings. `version: int` en cada save + migrators v1->v2->v3. Atomic writes (.tmp -> validate -> rename). **Prohibido:** `BinaryFormatter`.

## Testing

Separar lógica gameplay (clases puras -> NUnit sin Play Mode) del wrapper MonoBehaviour (PlayMode tests solo para MB reales).

## Build & Git

Build: Mono (dev rápido), IL2CPP (release performance). Stripping disabled/dev, medium-high/release. Addressables build como step previo.

Git: .gitignore (Library/, Temp/, Builds/, Logs/, *.csproj, *.sln), LFS para binarios (.png/.fbx/.wav/.psd), Force Text serialization + Visible Meta Files, Smart Merge para .unity/.prefab.
