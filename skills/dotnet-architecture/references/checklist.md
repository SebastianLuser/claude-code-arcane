# Checklist

Verify before accepting the structure.

- [ ] Dependencies point inward: `Api → Infrastructure → Application → Domain`
- [ ] `Domain` has no `<ProjectReference>` or framework packages (no EF, no ASP.NET)
- [ ] There is no generic `IRepository<T>` / `IUnitOfWork` wrapping EF Core
- [ ] EF Core is exposed via `IApplicationDbContext` in Application, implemented in Infrastructure
- [ ] In Vertical Slice, each slice is self-contained (request + handler + validator + endpoint)
- [ ] Slices do not depend on each other (coupling only via `Common`/`Infrastructure`)
- [ ] DTOs at the edge: no EF entity is returned as an API response
- [ ] Each handler has a single responsibility (one use case per file)
- [ ] `Program.cs` is only the composition root (DI + pipeline + map endpoints), with no business logic
- [ ] Validation runs in a pipeline behavior, not repeated in every endpoint
- [ ] Expected failures are modeled with `Result<T>`/`ErrorOr`, not with flow-control exceptions
- [ ] EF Core migrations are versioned in git
- [ ] The chosen approach (VSA vs Clean) matches the real complexity of the domain

_Ref: https://github.com/ardalis/CleanArchitecture · https://github.com/nadirbad/VerticalSliceArchitecture · https://www.milanjovanovic.tech/blog/clean-architecture-folder-structure_
