# Anti-Patterns

- **Generic `IRepository<T>` / `IUnitOfWork` over EF Core** — `DbContext` already is a repository (`DbSet<>`) and a Unit of Work (`SaveChangesAsync`); wrapping it adds valueless indirection and hides LINQ/Include/projections from you.
- **Fat controllers / endpoints with business logic** — the endpoint only translates HTTP ↔ request and maps the result; the rules belong in the handler/domain, not in the controller.
- **Outward-pointing dependencies** — `Domain` referencing `Infrastructure` or EF Core breaks the dependency rule: the domain stops being testable and replaceable.
- **Anemic Application that only forwards to repos** — if the handler does nothing but `return repo.Get(id)`, the layer adds nothing; move real business logic into the domain/handler or remove the indirection.
- **Leaking EF entities as API responses** — exposing persistence entities couples the HTTP contract to the DB schema and drags in lazy-loading/cycles; return DTOs at the edge.
- **Forcing Clean Architecture on a simple CRUD** — four projects and pipeline behaviors to list and save records is over-engineering; start with Vertical Slice or a single project.
- **Static service locator / `BuildServiceProvider()` in `Program.cs`** — building the provider by hand creates duplicate graphs and hidden dependencies; register everything in the container and let it resolve through constructors.
- **One giant `Services/` and `Controllers/`** — organizing by technical type scatters each feature across five folders; organize by feature/slice so a use case lives together.

_Ref: https://www.milanjovanovic.tech/blog/vertical-slice-architecture-dotnet · https://github.com/ardalis/CleanArchitecture · https://learn.microsoft.com/en-us/ef/core/dbcontext-configuration/_
