---
name: dotnet-scaffold
description: "Scaffold de API ASP.NET Core (.NET 10) production-ready: Vertical Slice o Clean Architecture, Minimal APIs, EF Core + PostgreSQL, JWT + Identity, ProblemDetails, health checks y testing. Usar para iniciar un backend .NET nuevo."
category: "backend"
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# dotnet-scaffold — ASP.NET Core API Scaffolder

## MANDATORY WORKFLOW

**Antes de generar cualquier código, completar estos pasos en orden.** Confirmar las decisiones del Step 0 con el usuario antes de escribir archivos (Question → Decision → Approval).

### Step 0: Gather Requirements
1. **Nombre del servicio** (PascalCase para la solución, ej. `OrdersApi`)
2. **Arquitectura:** Vertical Slice (default) / Clean Architecture — ver skill `dotnet-architecture` para elegir
3. **Transport:** Web API REST con Minimal APIs (default) / Controllers / gRPC
4. **ORM:** EF Core (default) / Dapper
5. **DB:** PostgreSQL (default) / SQL Server
6. **Auth:** JWT + ASP.NET Identity (default) / OAuth / ninguna
7. **Deploy:** Docker (default) / Azure App Service

> Si el dominio es CRUD/simple → **Vertical Slice**. Si es complejo y long-lived con varios devs → **Clean Architecture**.

### Step 1: Crear base
```bash
dotnet new sln -n <Name>
dotnet new webapi -n <Name>.Api --use-minimal-apis    # o sin flag para Controllers
dotnet sln add <Name>.Api
dotnet new xunit -n <Name>.Tests && dotnet sln add <Name>.Tests
cd <Name>.Api
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
dotnet add package FluentValidation.AspNetCore
dotnet add package Serilog.AspNetCore
```

### Step 2: Estructura

**Vertical Slice (default)** — un folder por feature/use-case:
```
src/
  Features/
    Orders/   { CreateOrder.cs, GetOrder.cs, OrderEndpoints.cs }  # request+handler+validator+endpoint por slice
    Users/    { ... }
  Infrastructure/  { AppDbContext.cs, Migrations/ }
  Common/    { Behaviors/, Results/, ProblemDetails/ }
  Program.cs
```

**Clean Architecture** — proyectos por capa (deps apuntan hacia adentro):
```
<Name>.Domain/          # entities, value objects — cero deps externas
<Name>.Application/      # use cases, interfaces (IAppDbContext), DTOs
<Name>.Infrastructure/   # EF Core, Identity, implementaciones
<Name>.Api/             # endpoints/controllers, DI, Program.cs
```

### Step 3: Defaults no negociables (`Program.cs` / `.csproj`)
- `<Nullable>enable</Nullable>` + `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` en el `.csproj`
- **Async end-to-end**: handlers `async Task<>`, `CancellationToken` propagado a EF Core y HTTP; nunca `.Result`/`.Wait()`
- **DI por constructor** (primary constructors); registrar servicios con scope correcto (`AddScoped` para DbContext/handlers)
- **Validación**: FluentValidation por slice → responder `ValidationProblemDetails` (RFC 7807)
- **Errores**: `AddProblemDetails()` + exception handler global → `ProblemDetails` consistente, sin filtrar stack traces
- **EF Core**: migraciones versionadas (`dotnet ef migrations add`), **nunca** `EnsureCreated()` en prod; `DbContext` como Unit of Work (sin repos genéricos salvo necesidad)
- **Auth**: JWT de vida corta + refresh, secretos en `user-secrets`/secret manager, authorization por policies declarativas
- **Observabilidad**: Serilog structured logging (JSON) + health checks (`AddHealthChecks`) + OpenTelemetry opcional
- **Graceful shutdown**: respetar `IHostApplicationLifetime` / `CancellationToken` del host

### Step 4: Agregar piezas (invocar skills relacionadas)
- `dotnet-architecture` — estructura de slices/capas en detalle
- `database` / `data-migrations` — modelado EF Core + migraciones
- `jwt-strategy` / `auth-strategy` / `rbac-abac` — auth y authorization
- `api-design` / `api-versioning` / `api-docs` — contrato REST + OpenAPI
- `testing` / `contract-testing` — xUnit + Testcontainers (Postgres real en tests)

### Step 5: Verificar
`dotnet build` + `dotnet test`. Revisar contra la rule `dotnet-code` y el skill `dotnet-best-practices`. Build + tests verdes → scaffold **READY**.

## Stack Defaults

| Componente | Default |
|------------|---------|
| Runtime | .NET 10 LTS (C# 14) |
| Framework | ASP.NET Core — Minimal APIs |
| Arquitectura | Vertical Slice (Clean opcional) |
| ORM | EF Core 10 |
| DB | PostgreSQL (Npgsql) |
| Auth | JWT + ASP.NET Identity |
| Validación | FluentValidation → ProblemDetails |
| Logging | Serilog (JSON) |
| Testing | xUnit + Testcontainers |
| Deploy | Docker |

---

_Inspirado en [dotnet/skills](https://github.com/dotnet/skills) (oficial Microsoft), [github/awesome-copilot](https://github.com/github/awesome-copilot) (dotnet-best-practices) y los templates [ardalis/CleanArchitecture](https://github.com/ardalis/CleanArchitecture) y [nadirbad/VerticalSliceArchitecture](https://github.com/nadirbad/VerticalSliceArchitecture). Adaptado al formato Arcane._
