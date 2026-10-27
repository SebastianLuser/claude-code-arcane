---
name: dotnet-scaffold
description: "Production-ready ASP.NET Core (.NET 10) API scaffold: Vertical Slice or Clean Architecture, Minimal APIs, EF Core + PostgreSQL, JWT + Identity, ProblemDetails, health checks and testing. Use to start a new .NET backend."
category: "backend"
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# dotnet-scaffold — ASP.NET Core API Scaffolder

## MANDATORY WORKFLOW

**Before generating any code, complete these steps in order.** Confirm the Step 0 decisions with the user before writing files (Question → Decision → Approval).

### Step 0: Gather Requirements
1. **Service name** (PascalCase for the solution, e.g. `OrdersApi`)
2. **Architecture:** Vertical Slice (default) / Clean Architecture — see the `dotnet-architecture` skill to choose
3. **Transport:** REST Web API with Minimal APIs (default) / Controllers / gRPC
4. **ORM:** EF Core (default) / Dapper
5. **DB:** PostgreSQL (default) / SQL Server
6. **Auth:** JWT + ASP.NET Identity (default) / OAuth / none
7. **Deploy:** Docker (default) / Azure App Service

> If the domain is CRUD/simple → **Vertical Slice**. If it is complex and long-lived with several devs → **Clean Architecture**.

### Step 1: Create the base
```bash
dotnet new sln -n <Name>
dotnet new webapi -n <Name>.Api                       # Minimal APIs (default in .NET 8+); for Controllers: --use-controllers
dotnet sln add <Name>.Api
dotnet new xunit -n <Name>.Tests && dotnet sln add <Name>.Tests
cd <Name>.Api
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
dotnet add package FluentValidation.DependencyInjectionExtensions    # core + DI; FluentValidation.AspNetCore (auto-validation) is deprecated
dotnet add package Serilog.AspNetCore
```

### Step 2: Structure

**Vertical Slice (default)** — one folder per feature/use case:
```
src/
  Features/
    Orders/   { CreateOrder.cs, GetOrder.cs, OrderEndpoints.cs }  # request+handler+validator+endpoint per slice
    Users/    { ... }
  Infrastructure/  { AppDbContext.cs, Migrations/ }
  Common/    { Behaviors/, Results/, ProblemDetails/ }
  Program.cs
```

**Clean Architecture** — one project per layer (dependencies point inward):
```
<Name>.Domain/          # entities, value objects — zero external deps
<Name>.Application/      # use cases, interfaces (IAppDbContext), DTOs
<Name>.Infrastructure/   # EF Core, Identity, implementations
<Name>.Api/             # endpoints/controllers, DI, Program.cs
```

### Step 3: Non-negotiable defaults (`Program.cs` / `.csproj`)
- `<Nullable>enable</Nullable>` + `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` in the `.csproj`
- **Async end-to-end**: `async Task<>` handlers, `CancellationToken` propagated to EF Core and HTTP; never `.Result`/`.Wait()`
- **Constructor DI** (primary constructors); register services with the correct scope (`AddScoped` for DbContext/handlers)
- **Validation**: FluentValidation per slice, invoked manually (MediatR pipeline behavior or endpoint filter — no auto-validation) → respond with `ValidationProblemDetails` (RFC 7807)
- **Errors**: `AddProblemDetails()` + a global exception handler → consistent `ProblemDetails`, without leaking stack traces
- **EF Core**: versioned migrations (`dotnet ef migrations add`), **never** `EnsureCreated()` in prod; `DbContext` as the Unit of Work (no generic repos unless needed)
- **Auth**: short-lived JWT + refresh, secrets in `user-secrets`/secret manager, authorization through declarative policies
- **Observability**: Serilog structured logging (JSON) + health checks (`AddHealthChecks`) + optional OpenTelemetry
- **Graceful shutdown**: honor the host's `IHostApplicationLifetime` / `CancellationToken`

### Step 4: Add pieces (invoke related skills)
- `dotnet-architecture` — slice/layer structure in detail
- `database` / `data-migrations` — EF Core modeling + migrations
- `jwt-strategy` / `auth-strategy` / `rbac-abac` — auth and authorization
- `api-design` / `api-versioning` / `api-docs` — REST contract + OpenAPI
- `testing` / `contract-testing` — xUnit + Testcontainers (real Postgres in tests)

### Step 5: Verify
`dotnet build` + `dotnet test`. Review against the `dotnet-code` rule and the `dotnet-best-practices` skill. Green build + tests → scaffold **READY**.

## Stack Defaults

| Component | Default |
|------------|---------|
| Runtime | .NET 10 LTS (C# 14) |
| Framework | ASP.NET Core — Minimal APIs |
| Architecture | Vertical Slice (Clean optional) |
| ORM | EF Core 10 |
| DB | PostgreSQL (Npgsql) |
| Auth | JWT + ASP.NET Identity |
| Validation | FluentValidation → ProblemDetails |
| Logging | Serilog (JSON) |
| Testing | xUnit + Testcontainers |
| Deploy | Docker |

---

_Inspired by [dotnet/skills](https://github.com/dotnet/skills) (official Microsoft), [github/awesome-copilot](https://github.com/github/awesome-copilot) (dotnet-best-practices) and the [ardalis/CleanArchitecture](https://github.com/ardalis/CleanArchitecture) and [nadirbad/VerticalSliceArchitecture](https://github.com/nadirbad/VerticalSliceArchitecture) templates. Adapted to the Arcane format._
