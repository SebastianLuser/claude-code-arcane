---
paths:
  - "src/core/**"
---

# Engine Code Rules

- ZERO allocations in hot paths (update loops, rendering, physics) — pre-allocate, pool, reuse
- All engine APIs must be thread-safe OR explicitly documented as single-thread-only
- Profile before AND after every optimization — document the measured numbers
- Engine code must NEVER depend on gameplay code (strict dependency direction: engine <- gameplay)
- Every public API must have usage examples in its doc comment
- Changes to public interfaces require a deprecation period and migration guide
- Use RAII / deterministic cleanup for all resources
- All engine systems must support graceful degradation
- Before writing engine API code, consult `docs/engine-reference/` for the current engine version and verify APIs against the reference docs

## Examples

**Correct** (zero-alloc hot path):

```csharp
// Pre-allocated list reused each frame
private readonly List<Transform> _nearbyCache = new(capacity: 64);

void FixedUpdate()
{
    _nearbyCache.Clear();  // Reuse, don't reallocate
    _spatialGrid.QueryRadius(transform.position, radius, _nearbyCache);
}
```

**Incorrect** (allocating in hot path):

```csharp
void FixedUpdate()
{
    var nearby = new List<Transform>();  // VIOLATION: allocates every frame
    nearby.AddRange(FindObjectsOfType<Enemy>());  // VIOLATION: scene scan every frame
}
```
