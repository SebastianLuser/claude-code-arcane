# Estructura de Directorios

Dos formas válidas de estructurar un backend .NET 10 / ASP.NET Core. Elegí según
complejidad del dominio (ver `when-to-use` en la SKILL).

## Vertical Slice Architecture (un proyecto)

Cada feature es un folder autocontenido: request, handler, validator y endpoint
viven juntos. Tocás un caso de uso → tocás un solo archivo/carpeta.

```
src/
  Features/
    Orders/
      CreateOrder.cs          ← record Command + Handler + Validator juntos
      GetOrders.cs            ← record Query + Handler (paginación/proyección)
      OrderEndpoints.cs       ← MapGroup("/orders") + TypedResults
    Customers/
      RegisterCustomer.cs
      CustomerEndpoints.cs
  Common/
    Behaviors/                ← ValidationBehavior, LoggingBehavior, TxBehavior
    Result.cs                 ← Result<T> / Error compartido
  Infrastructure/
    AppDbContext.cs           ← EF Core DbContext (DbSet<> por entidad)
    Migrations/               ← migraciones versionadas en git
  Program.cs                  ← composition root: DI, pipeline, MapEndpoints
appsettings.json
```

- Cada slice depende de `Common` e `Infrastructure`, no de otros slices.
- Un slice nuevo = un archivo nuevo; borrarlo no rompe a los demás (bajo acoplamiento).
- El `DbContext` es compartido; cada handler usa solo los `DbSet<>` que necesita.

## Clean Architecture (cuatro proyectos)

Separación por capa técnica. Las dependencias apuntan **hacia adentro**: el dominio
no conoce a nadie; la infraestructura y la API dependen de las capas internas.

```
src/
  MyApp.Domain/             ← Entidades, value objects, domain events, reglas
    Entities/Order.cs       ← cero deps externas (ni EF, ni ASP.NET)
    ValueObjects/Money.cs
    Common/Entity.cs
  MyApp.Application/        ← Casos de uso (handlers), DTOs, interfaces
    Orders/CreateOrder.cs
    Common/IApplicationDbContext.cs   ← expone DbSet<> + SaveChangesAsync
    Common/Behaviors/
  MyApp.Infrastructure/     ← EF Core, Identity, servicios externos
    Persistence/AppDbContext.cs       ← : DbContext, IApplicationDbContext
    Persistence/Migrations/
    Services/EmailSender.cs
    DependencyInjection.cs
  MyApp.Api/                ← Endpoints, Program.cs, wiring de DI
    Endpoints/OrderEndpoints.cs
    Program.cs
```

### Dirección de las referencias (`.csproj`)

```
MyApp.Api            → referencia → MyApp.Infrastructure, MyApp.Application
MyApp.Infrastructure → referencia → MyApp.Application
MyApp.Application    → referencia → MyApp.Domain
MyApp.Domain         → referencia → (NADA)
```

- `Domain.csproj` no tiene ningún `<ProjectReference>` ni paquete de framework.
- `Application` define `IApplicationDbContext`; `Infrastructure` lo implementa.
  Así la lógica de negocio depende de una abstracción, no de EF Core directamente.
- La inversión de dependencias se logra en `Api/Program.cs`, que es el único lugar
  que conoce a las cuatro capas y arma el grafo de DI.

> Regla de oro: si una flecha de dependencia apunta hacia afuera del dominio, la
> arquitectura está rota. El dominio es el centro estable.

_Ref: https://github.com/ardalis/CleanArchitecture · https://github.com/nadirbad/VerticalSliceArchitecture · https://www.milanjovanovic.tech/blog/vertical-slice-architecture-dotnet_
