# Anti-patterns

- Flat Scripts/ in Assets/
- Singleton for everything
- GameObject.Find/FindObjectOfType in Update
- GetComponent in Update without caching
- Instantiate/Destroy on a hot path without a pool
- LINQ .ToList()/.Where() in Update
- String concatenation in Update logs
- Public fields everywhere (use [SerializeField] private)
- Monolithic scenes
- Ignoring the Profiler
- ECS/DOTS without a need
- Unversioned binary save
- Resources/ for everything
