# Checklist

- [ ] `_Project/Scripts/` agrupada por feature
- [ ] Singletons solo state persistente cross-scene (<=4)
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
