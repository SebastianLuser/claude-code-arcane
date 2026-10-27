---
paths:
  - "src/**/*.ts"
  - "**/*.module.ts"
  - "**/*.controller.ts"
  - "**/*.service.ts"
  - "**/*.guard.ts"
  - "**/*.pipe.ts"
  - "**/*.interceptor.ts"
  - "**/*.dto.ts"
  - "apps/**"
  - "libs/**"
---

# NestJS Code Rules

Production-ready rules for NestJS, ordered by impact. Full catalog (40 rules, 10 categories) + incorrect/correct examples: skill `nestjs-best-practices`.

## CRITICAL — Architecture & DI

- **Zero circular dependencies between modules** — the #1 cause of runtime crashes. If `forwardRef()` shows up, it signals bad design: refactor.
- **Organize by feature modules**, not by technical layers (`users/`, not global `controllers/` + `services/`).
- **Export services from dedicated modules** to guarantee singleton instances and avoid inconsistent state.
- **Single Responsibility per service** — one service = one domain concept.
- **Always constructor injection.** Never `ModuleRef.get()` at runtime (service locator anti-pattern). Explicit, typed, testable dependencies.
- **Provider scopes**: `DEFAULT` (singleton) by default; `REQUEST` scope only when request context is needed (it has a performance cost).
- **Injection tokens (symbols or abstract classes) for interfaces** — TS interfaces do not exist at runtime.

## HIGH — Error handling & Security

- **Services throw `HttpException` subclasses**, they do not return error objects.
- **Handle async errors explicitly** — fire-and-forget and background tasks must catch errors (no unhandled rejections).
- **Exception filters** for a centralized, consistent error response format.
- **Global `ValidationPipe` + decorated DTOs** — reject malformed input before processing it. `whitelist: true`, `forbidNonWhitelisted: true`.
- **Declarative guards for auth/authz**, not manual checks in every handler.
- **Secure JWT**: short-lived tokens + refresh tokens, secrets in env/secret manager, never sensitive data in the payload.
- **Rate limiting with `@nestjs/throttler`**, per-endpoint limits.
- **Sanitize output** (XSS) and set the correct `Content-Type`.

## HIGH — Performance & Data

- **Avoid N+1**: eager loading with relations or QueryBuilder joins.
- **Optimize queries**: select only the columns you need, appropriate indexes, no over-fetching of relations.
- **Strategic caching** with an appropriate TTL and event-based invalidation.
- **Transactions for dependent multi-step operations** (consistency on failure).
- **Versioned migrations** — never `synchronize: true` in production.
- **Async lifecycle hooks** return promises; constructors stay synchronous (do not block startup).

## MEDIUM — API, Microservices, DevOps

- **DTOs + serialization** (`ClassSerializerInterceptor`) for responses — control exposure, avoid circular references.
- **Interceptors for cross-cutting concerns** (logging, transformation, response format).
- **Pipes for input transformation/validation**.
- **API versioning** for breaking changes.
- **Health checks** (readiness/liveness) for orchestrators.
- **Message queues for long jobs** — do not block request handlers.
- **Graceful shutdown**: listen for SIGTERM, drain in-flight requests before exiting.
- **`ConfigModule` for per-environment configuration** — nothing hardcoded.
- **Structured logging (JSON)** for parsing/filtering in production.

## Anti-Patterns

- `forwardRef()` to patch circular dependencies instead of redesigning
- Business logic in controllers (they only parse input, call the service, shape the response)
- `synchronize: true` against a production DB
- `ModuleRef.get()` / service locator at runtime
- Manual input validation in every handler instead of `ValidationPipe` + DTO
- Returning raw ORM entities as the HTTP response
- `REQUEST` scope without a real need (hurts performance)

---

_Derived from [kadajett/agent-nestjs-skills](https://github.com/kadajett/agent-nestjs-skills) (nestjs-best-practices). Condensed to the Arcane format._

## How to verify

- Run the tests that cover the change (`npm test`, or the project's script) and the type check.
- Start the app locally and call the changed endpoint with `curl`: show the status code and the body, plus one failure case (invalid DTO, missing auth).
- Read the app log for those requests: no stack trace, no unexpected warning.
