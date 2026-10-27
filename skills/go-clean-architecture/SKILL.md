---
name: go-clean-architecture
description: "Alizia-BE style Go architecture (Educabot). Hybrid KISS Clean Architecture, manual DI, entities/providers/usecases/entrypoints/repositories. Multi-tenant OrgID scope."
category: "backend"
argument-hint: "[module-name or feature]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Go Clean Architecture (Alizia-BE style)

Canonical architecture for Educabot Go backends. KISS + Clean by layers, manual DI, strict separation.

## When to use / NOT use

| Use | Do NOT use |
|------|---------|
| New backend API with non-trivial logic | Simple CLI / internal tool |
| Multi-tenant with OrgID scope | Throwaway prototype |
| You need per-layer testability | Single-function worker |

## Philosophy

- Simplicity first — no heavy DDD, no event sourcing, no premature CQRS
- Manual DI in `cmd/` — no wire/fx/dig. Verbosity is a feature
- One file = one responsibility (especially usecases)
- Code in English, communication in the user's language

## Directory Structure

```
cmd/                         ← Entry point + manual DI
  main.go, app.go, repositories.go, usecases.go, handlers.go, routes.go
src/core/                    ← PURE DOMAIN (no infra imports)
  entities/                  ← Plain structs (no GORM/JSON tags)
  providers/                 ← Interfaces (contracts) + errors.go
  usecases/{domain}/         ← Business logic, one file per usecase
src/entrypoints/rest/        ← HTTP handlers (no business logic)
src/repositories/{domain}/   ← GORM impl (GORM tags here, not in entities)
src/mocks/                   ← One mock per provider
config/                      ← Env vars
db/migrations/               ← SQL up/down (golang-migrate)
```

## Dependency Rule

`entrypoints → usecases → providers (interfaces) ← repositories`

- Usecases **NEVER** import gorm/http/redis/openai — only entities + providers
- Interfaces in `core/providers/` (consumer side, Go idiom)

## Layers

| Layer | Responsibility | Rules |
|------|----------------|--------|
| **Entities** | Domain structs | No GORM/JSON tags, no persistence logic |
| **Providers** | Interfaces + sentinel errors | `ErrValidation`, `ErrNotFound`, `ErrForbidden`, etc. |
| **Usecases** | Request.Validate() + Execute() | Validate is always the first line. Always validate OrgID |
| **Entrypoints** | HTTP ↔ Request translation | No business logic. Maps sentinel → HTTP code |
| **Repositories** | GORM impl of providers | Row structs with GORM tags here. They translate row ↔ entity |

## Canonical Usecase Pattern

- Struct `CreateXxxRequest` with `Validate() error` — wraps with `providers.ErrValidation`
- Interface `CreateXxx` with `Execute(ctx, req) (result, error)`
- Impl `createXxxImpl` with deps as providers
- Constructor `NewCreateXxx(deps) CreateXxx`

## Multi-tenant (OrgID)

- `OrgID` in every usecase Request, `Validate()` checks `OrgID != uuid.Nil`
- Every query filters by `organization_id`. RLS in Postgres as the last barrier
- JWT middleware extracts OrgID from the token → context

## Manual DI in cmd/

- `cmd/repositories.go`: `buildRepositories(db)` → struct with all the repos
- `cmd/usecases.go`: `buildUseCases(repos)` → struct with all the usecases
- `cmd/handlers.go`: `buildHandlers(ucs)` → struct with all the handlers
- The whole dependency graph readable at a glance

## Testing

| Layer | Type | Tools |
|------|------|-------------|
| Usecases | Unit with mocks | testify + mocks per provider |
| Repositories | Integration | Real Postgres (testcontainers) |
| Handlers | HTTP with a mocked usecase | httptest + testify |

## Anti-patterns

> → Read references/anti-patterns.md for common architecture violations

## Checklist

> → Read references/checklist.md for 11-item architecture compliance checklist
