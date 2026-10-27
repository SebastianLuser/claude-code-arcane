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

Production-ready rules for ASP.NET Core (.NET 10), ordered by impact. Full catalog (40 rules, 10 categories) + incorrect/correct examples: skill `dotnet-best-practices`. Project structure: skill `dotnet-architecture`.

## CRITICAL — Architecture & DI

- **Organize by feature (Vertical Slice)** or by layers with inward-pointing dependencies (Clean) — never one giant global `Services/` + `Controllers/`.
- **Thin endpoints/controllers** — they translate HTTP ↔ request, call the handler and shape the response. Zero business logic.
- **`DbContext` is Unit of Work + Repository** — do not wrap it in a generic `IRepository<T>` / `IUnitOfWork` (valueless indirection that hides `Include`/projections).
- **Constructor injection (primary constructors) always.** Never a service locator or a manual `BuildServiceProvider()` in `Program.cs`.
- **Correct lifetimes** — `Scoped` for `DbContext`/handlers, `Singleton` only if stateless; never inject `Scoped` into `Singleton` (captured dependency).
- **`<Nullable>enable</Nullable>`** + warnings as errors; zero `#nullable disable` to silence warnings.

## HIGH — Async, Error handling & Security

- **Async end-to-end.** Never `.Result`/`.Wait()`/`.GetAwaiter().GetResult()` (deadlocks / thread-pool starvation). No `async void` except event handlers.
- **Propagate `CancellationToken`** from the endpoint down to EF Core and HTTP calls. No fire-and-forget without error handling.
- **Errors via `ProblemDetails` (RFC 7807)** — `AddProblemDetails()` + a global `IExceptionHandler`. Never leak stack traces. Validation → `ValidationProblemDetails`.
- **Result pattern for expected failures**, exceptions only for the exceptional. No empty `catch` blocks.
- **Short-lived JWT + refresh**, secrets in user-secrets/Key Vault (not in `appsettings.json`). Authorization through **declarative policies**, not manual role checks.
- **Rate limiting** with the built-in middleware (`AddRateLimiter`). HTTPS/HSTS. Do not log sensitive data.

## HIGH — Performance & Data (EF Core)

- **Avoid N+1** — `Include` or a DTO projection with `Select`. Never access relationships inside a loop.
- **`AsNoTracking()`** on read-only queries. `AsSplitQuery()` for large `Include`s (avoids cartesian explosion).
- **Versioned migrations** (`dotnet ef migrations add` / `MigrateAsync()`); never `EnsureCreated()` in prod.
- **Transactions for multi-step operations**; `EnableRetryOnFailure` for connection resilience (Npgsql).
- **Strategic caching** (`HybridCache`/output caching) with an appropriate TTL and invalidation.

## MEDIUM — API, Testing & DevOps

- **DTOs at the edge** (records) — never expose EF entities as HTTP responses.
- **API versioning** (`Asp.Versioning`) for breaking changes; OpenAPI with `Microsoft.AspNetCore.OpenApi`.
- **`TypedResults`** in minimal APIs for correct, testable status codes.
- **Tests with xUnit**; integration with `WebApplicationFactory` + real Postgres (Testcontainers). Do not mock `DbContext` or use the in-memory provider (it lies about relational behavior).
- **Structured logging (Serilog JSON)** + health checks (liveness/readiness). Graceful shutdown via `IHostApplicationLifetime`.
- **Per-environment config** (`IOptions<T>`, `appsettings.{Environment}.json`) — nothing hardcoded.

## Anti-Patterns

- Generic `IRepository<T>` / `IUnitOfWork` over EF Core
- Business logic in controllers/endpoints
- `.Result` / `.Wait()` (sync-over-async) → deadlocks
- `EnsureCreated()` against a production DB
- Service locator / `BuildServiceProvider()` at runtime
- Returning raw EF entities as an HTTP response
- N+1 queries from a missing `Include`/projection
- `Domain` referencing `Infrastructure` / EF Core (outward dependency)
- Forcing Clean Architecture on a simple CRUD (over-engineering)

## How to verify

- `dotnet build` with no new warnings, and `dotnet test` for the projects the change touches.
- Run the API locally and call the changed endpoint with `curl`: show the status code and the body, plus one failure case (invalid input, missing auth).
- Read the log for those requests: no exception, no unexpected warning.

---

_Derived from [github/awesome-copilot](https://github.com/github/awesome-copilot) (dotnet-best-practices), [dotnet/skills](https://github.com/dotnet/skills) and [ardalis/CleanArchitecture](https://github.com/ardalis/CleanArchitecture). Condensed into the Arcane format._
