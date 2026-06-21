---
paths:
  - "**/*.cs"
  - "**/*.csproj"
  - "**/Program.cs"
  - "**/*.Tests.cs"
  - "src/**"
  - "tests/**"
---

# .NET / C# Code Rules

Reglas production-ready para ASP.NET Core (.NET 10), ordenadas por impacto. Catálogo completo (40 reglas, 10 categorías) + ejemplos incorrecto/correcto: skill `dotnet-best-practices`. Estructura de proyecto: skill `dotnet-architecture`.

## CRITICAL — Arquitectura & DI

- **Organizar por feature (Vertical Slice)** o por capas con dependencias hacia adentro (Clean) — nunca un `Services/` + `Controllers/` global gigante.
- **Endpoints/controllers finos** — traducen HTTP ↔ request, llaman al handler y dan shape a la respuesta. Cero lógica de negocio.
- **`DbContext` es Unit of Work + Repository** — no envolverlo en `IRepository<T>` / `IUnitOfWork` genérico (indirección sin valor que tapa `Include`/proyecciones).
- **Constructor injection (primary constructors) siempre.** Nunca service locator ni `BuildServiceProvider()` manual en `Program.cs`.
- **Lifetimes correctos** — `Scoped` para `DbContext`/handlers, `Singleton` solo si es stateless; nunca inyectar `Scoped` en `Singleton` (captured dependency).
- **`<Nullable>enable</Nullable>`** + warnings as errors; cero `#nullable disable` para silenciar.

## HIGH — Async, Error handling & Security

- **Async end-to-end.** Nunca `.Result`/`.Wait()`/`.GetAwaiter().GetResult()` (deadlocks / thread-pool starvation). Sin `async void` salvo event handlers.
- **Propagar `CancellationToken`** desde el endpoint hasta EF Core y llamadas HTTP. Sin fire-and-forget sin manejo de error.
- **Errores vía `ProblemDetails` (RFC 7807)** — `AddProblemDetails()` + `IExceptionHandler` global. Nunca filtrar stack traces. Validación → `ValidationProblemDetails`.
- **Result pattern para fallos esperados**, excepciones solo para lo excepcional. Sin `catch` vacíos.
- **JWT de vida corta + refresh**, secretos en user-secrets/Key Vault (no en `appsettings.json`). Authorization por **policies declarativas**, no checks manuales de roles.
- **Rate limiting** con el middleware built-in (`AddRateLimiter`). HTTPS/HSTS. No loguear data sensible.

## HIGH — Performance & Data (EF Core)

- **Evitar N+1** — `Include` o proyección a DTO con `Select`. Nunca acceder a relaciones en un loop.
- **`AsNoTracking()`** en lecturas read-only. `AsSplitQuery()` para `Include` grandes (evita explosión cartesiana).
- **Migraciones versionadas** (`dotnet ef migrations add` / `MigrateAsync()`); nunca `EnsureCreated()` en prod.
- **Transacciones para operaciones multi-step**; `EnableRetryOnFailure` para resiliencia de conexión (Npgsql).
- **Caching estratégico** (`HybridCache`/output caching) con TTL e invalidación apropiada.

## MEDIUM — API, Testing & DevOps

- **DTOs en el borde** (records) — nunca exponer entidades EF como respuestas HTTP.
- **API versioning** (`Asp.Versioning`) para cambios breaking; OpenAPI con `Microsoft.AspNetCore.OpenApi`.
- **`TypedResults`** en minimal APIs para status codes correctos y testeables.
- **Tests con xUnit**; integración con `WebApplicationFactory` + Postgres real (Testcontainers). No mockear `DbContext` ni usar el in-memory provider (miente sobre comportamiento relacional).
- **Structured logging (Serilog JSON)** + health checks (liveness/readiness). Graceful shutdown vía `IHostApplicationLifetime`.
- **Config por entorno** (`IOptions<T>`, `appsettings.{Environment}.json`) — nada hardcodeado.

## Anti-Patterns

- `IRepository<T>` / `IUnitOfWork` genérico sobre EF Core
- Lógica de negocio en controllers/endpoints
- `.Result` / `.Wait()` (sync-over-async) → deadlocks
- `EnsureCreated()` contra una DB de producción
- Service locator / `BuildServiceProvider()` en runtime
- Devolver entidades EF crudas como respuesta HTTP
- N+1 queries por falta de `Include`/proyección
- `Domain` referenciando `Infrastructure` / EF Core (dependencia hacia afuera)
- Forzar Clean Architecture en un CRUD simple (sobre-ingeniería)

---

_Derivado de [github/awesome-copilot](https://github.com/github/awesome-copilot) (dotnet-best-practices), [dotnet/skills](https://github.com/dotnet/skills) y [ardalis/CleanArchitecture](https://github.com/ardalis/CleanArchitecture). Condensado al formato Arcane._
