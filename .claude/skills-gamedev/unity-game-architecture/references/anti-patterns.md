# Anti-patterns

- Scripts/ flat en Assets/
- Singleton para todo
- GameObject.Find/FindObjectOfType en Update
- GetComponent en Update sin cache
- Instantiate/Destroy en hot path sin pool
- LINQ .ToList()/.Where() en Update
- String concat en logs Update
- Public fields everywhere (usar [SerializeField] private)
- Escenas monolíticas
- Ignorar Profiler
- ECS/DOTS sin necesidad
- Save binario sin versión
- Resources/ para todo
