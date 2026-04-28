---
name: go-clean-architecture
description: "Arquitectura Go estilo Alizia-BE (Educabot). Clean Architecture híbrida KISS, DI manual, entities/providers/usecases/entrypoints/repositories. Multi-tenant OrgID scope."
argument-hint: "[module-name or feature]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Go Clean Architecture (estilo Alizia-BE)

Arquitectura canónica backends Go Educabot. KISS + Clean by layers, DI manual, separación estricta.

## Cuándo usar / NO usar

| Usar | NO usar |
|------|---------|
| API backend nueva con lógica no trivial | CLI simple / tool interno |
| Multi-tenant con OrgID scope | Prototipo throwaway |
| Necesitás testabilidad por capa | Worker de una sola función |

## Filosofía

- Simpleza primero — no DDD pesado, no event sourcing, no CQRS prematuro
- DI manual en `cmd/` — no wire/fx/dig. Verbosidad es feature
- One file = one responsibility (especialmente usecases)
- Código en inglés, comunicación en español

## Estructura de Directorios

```
cmd/                         ← Entry point + DI manual
  main.go, app.go, repositories.go, usecases.go, handlers.go, routes.go
src/core/                    ← DOMINIO PURO (sin imports infra)
  entities/                  ← Structs planos (sin tags GORM/JSON)
  providers/                 ← Interfaces (contratos) + errors.go
  usecases/{domain}/         ← Business logic, un archivo por usecase
src/entrypoints/rest/        ← HTTP handlers (sin lógica de negocio)
src/repositories/{domain}/   ← GORM impl (tags GORM acá, no en entities)
src/mocks/                   ← Un mock por provider
config/                      ← Env vars
db/migrations/               ← SQL up/down (golang-migrate)
```

## Regla de Dependencias

`entrypoints → usecases → providers (interfaces) ← repositories`

- Usecases **NUNCA** importan gorm/http/redis/openai — solo entities + providers
- Interfaces en `core/providers/` (consumer side, Go idiom)

## Capas

| Capa | Responsabilidad | Reglas |
|------|----------------|--------|
| **Entities** | Structs del dominio | Sin tags GORM/JSON, sin lógica de persistencia |
| **Providers** | Interfaces + errores sentinel | `ErrValidation`, `ErrNotFound`, `ErrForbidden`, etc. |
| **Usecases** | Request.Validate() + Execute() | Validate siempre primera línea. Validar OrgID siempre |
| **Entrypoints** | HTTP ↔ Request translation | Sin lógica de negocio. Mapea sentinel → HTTP code |
| **Repositories** | GORM impl de providers | Row structs con tags GORM acá. Traducen row ↔ entity |

## Patrón Canónico Usecase

- Struct `CreateXxxRequest` con `Validate() error` — wrappea con `providers.ErrValidation`
- Interface `CreateXxx` con `Execute(ctx, req) (result, error)`
- Impl `createXxxImpl` con deps como providers
- Constructor `NewCreateXxx(deps) CreateXxx`

## Multi-tenant (OrgID)

- `OrgID` en cada Request de usecase, `Validate()` chequea `OrgID != uuid.Nil`
- Cada query filtra por `organization_id`. RLS en Postgres como última barrera
- Middleware JWT extrae OrgID del token → context

## DI Manual en cmd/

- `cmd/repositories.go`: `buildRepositories(db)` → struct con todos los repos
- `cmd/usecases.go`: `buildUseCases(repos)` → struct con todos los usecases
- `cmd/handlers.go`: `buildHandlers(ucs)` → struct con todos los handlers
- Lectura completa del grafo de deps en un vistazo

## Testing

| Capa | Tipo | Herramientas |
|------|------|-------------|
| Usecases | Unit con mocks | testify + mocks por provider |
| Repositories | Integration | Postgres real (testcontainers) |
| Handlers | HTTP con usecase mockeado | httptest + testify |

## Anti-patterns

- Usecase importando gorm/net/http, business logic en handler/repo
- Entity con tags GORM, Execute sin Validate(), OrgID sin validar
- wire/fx cuando DI manual alcanza, god usecase con múltiples responsabilidades
- Return struct GORM al handler, panic en usecase, interfaces en lado implementador
- Un único `usecases.go` con 15 funciones, hardcodear secrets

## Checklist

- [ ] Estructura `cmd/`, `src/core/{entities,providers,usecases}`, `src/entrypoints`, `src/repositories`
- [ ] Entities sin tags de infraestructura
- [ ] Providers en `core/providers/`, no en repositories
- [ ] Cada usecase: Request con Validate() + Execute()
- [ ] OrgID validado siempre (multi-tenant)
- [ ] Handler sin lógica de negocio
- [ ] DI manual en cmd/ legible y completa
- [ ] Mocks por cada provider
- [ ] Migration SQL up/down por cambio de schema
- [ ] Errores mapeados a HTTP codes en handler
- [ ] Un archivo = un usecase
