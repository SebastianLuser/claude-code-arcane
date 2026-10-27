# Directory Structure

Two valid ways to structure a .NET 10 / ASP.NET Core backend. Choose by
domain complexity (see `when-to-use` in the SKILL).

## Vertical Slice Architecture (one project)

Each feature is a self-contained folder: request, handler, validator and endpoint
live together. You touch a use case → you touch a single file/folder.

```
src/
  Features/
    Orders/
      CreateOrder.cs          ← record Command + Handler + Validator together
      GetOrders.cs            ← record Query + Handler (pagination/projection)
      OrderEndpoints.cs       ← MapGroup("/orders") + TypedResults
    Customers/
      RegisterCustomer.cs
      CustomerEndpoints.cs
  Common/
    Behaviors/                ← ValidationBehavior, LoggingBehavior, TxBehavior
    Result.cs                 ← shared Result<T> / Error
  Infrastructure/
    AppDbContext.cs           ← EF Core DbContext (DbSet<> per entity)
    Migrations/               ← migrations versioned in git
  Program.cs                  ← composition root: DI, pipeline, MapEndpoints
appsettings.json
```

- Each slice depends on `Common` and `Infrastructure`, not on other slices.
- A new slice = a new file; deleting it does not break the others (low coupling).
- The `DbContext` is shared; each handler uses only the `DbSet<>`s it needs.

## Clean Architecture (four projects)

Separation by technical layer. Dependencies point **inward**: the domain
knows nobody; infrastructure and the API depend on the inner layers.

```
src/
  MyApp.Domain/             ← Entities, value objects, domain events, rules
    Entities/Order.cs       ← zero external deps (no EF, no ASP.NET)
    ValueObjects/Money.cs
    Common/Entity.cs
  MyApp.Application/        ← Use cases (handlers), DTOs, interfaces
    Orders/CreateOrder.cs
    Common/IApplicationDbContext.cs   ← exposes DbSet<> + SaveChangesAsync
    Common/Behaviors/
  MyApp.Infrastructure/     ← EF Core, Identity, external services
    Persistence/AppDbContext.cs       ← : DbContext, IApplicationDbContext
    Persistence/Migrations/
    Services/EmailSender.cs
    DependencyInjection.cs
  MyApp.Api/                ← Endpoints, Program.cs, DI wiring
    Endpoints/OrderEndpoints.cs
    Program.cs
```

### Reference direction (`.csproj`)

```
MyApp.Api            → references → MyApp.Infrastructure, MyApp.Application
MyApp.Infrastructure → references → MyApp.Application
MyApp.Application    → references → MyApp.Domain
MyApp.Domain         → references → (NOTHING)
```

- `Domain.csproj` has no `<ProjectReference>` or framework package at all.
- `Application` defines `IApplicationDbContext`; `Infrastructure` implements it.
  That way business logic depends on an abstraction, not on EF Core directly.
- Dependency inversion happens in `Api/Program.cs`, the only place
  that knows all four layers and builds the DI graph.

> Golden rule: if a dependency arrow points out of the domain, the
> architecture is broken. The domain is the stable center.

_Ref: https://github.com/ardalis/CleanArchitecture · https://github.com/nadirbad/VerticalSliceArchitecture · https://www.milanjovanovic.tech/blog/vertical-slice-architecture-dotnet_
