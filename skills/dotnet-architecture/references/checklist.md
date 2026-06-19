# Checklist

Verificá antes de dar la estructura por buena.

- [ ] Las dependencias apuntan hacia adentro: `Api → Infrastructure → Application → Domain`
- [ ] `Domain` no tiene `<ProjectReference>` ni paquetes de framework (sin EF, sin ASP.NET)
- [ ] No hay `IRepository<T>` / `IUnitOfWork` genérico envolviendo EF Core
- [ ] EF Core se expone vía `IApplicationDbContext` en Application, implementado en Infrastructure
- [ ] En Vertical Slice, cada slice es autocontenido (request + handler + validator + endpoint)
- [ ] Los slices no dependen entre sí (acoplamiento solo vía `Common`/`Infrastructure`)
- [ ] DTOs en el borde: ninguna entidad EF se devuelve como respuesta de API
- [ ] Cada handler tiene una sola responsabilidad (un caso de uso por archivo)
- [ ] `Program.cs` es solo composition root (DI + pipeline + map endpoints), sin lógica de negocio
- [ ] La validación corre en un pipeline behavior, no repetida en cada endpoint
- [ ] Fallos esperados se modelan con `Result<T>`/`ErrorOr`, no con excepciones de flujo
- [ ] Las migraciones EF Core están versionadas en git
- [ ] El enfoque elegido (VSA vs Clean) corresponde a la complejidad real del dominio

_Ref: https://github.com/ardalis/CleanArchitecture · https://github.com/nadirbad/VerticalSliceArchitecture · https://www.milanjovanovic.tech/blog/clean-architecture-folder-structure_
