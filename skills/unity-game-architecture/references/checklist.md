# Checklist

- [ ] `_Project/Scripts/` grouped by feature
- [ ] Singletons only for persistent cross-scene state (<=4)
- [ ] Data in ScriptableObjects, not hardcoded
- [ ] Gameplay logic testable without Play Mode (pure classes)
- [ ] Object Pooling for frequent spawns
- [ ] GetComponent cached in Awake
- [ ] GC allocs in hot loops = 0 (Profiler)
- [ ] New Input System, not legacy
- [ ] Save system versioned, JSON, atomic writes
- [ ] Addressables for heavy assets
- [ ] WaitForSeconds cached
- [ ] Git LFS + Smart Merge configured
- [ ] IL2CPP + stripping for release
- [ ] Profiler run before closing a milestone
