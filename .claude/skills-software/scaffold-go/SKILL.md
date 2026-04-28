---
name: scaffold-go
description: "Scaffolding de proyectos Go siguiendo la arquitectura de Alizia-BE: Clean Architecture, GORM, Gin (via team-ai-toolkit), PostgreSQL, DI manual, migrations. Usar cuando se mencione: nuevo proyecto Go, scaffold Go, crear proyecto Go, boilerplate Go."
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Go Project Scaffold — Estilo Alizia-BE

Genera estructura completa de proyecto Go con Clean Architecture + team-ai-toolkit.

## MANDATORY WORKFLOW

**Antes de generar cualquier código, completar estos pasos en orden.**

### Step 0: Gather Requirements

Clarificar (o inferir del contexto si ya fue especificado):

1. **Nombre del proyecto** (e.g., "vigia-be", "tich-be")
2. **Módulo Go** (e.g., "github.com/educabot/vigia-be")
3. **Descripción** (1 línea)
4. **Primer dominio/feature** (e.g., "alerts", "students")
5. **Puerto default** (default: 8080)
6. **Puerto PostgreSQL local** (default: 5432)

Si el usuario ya especificó estos valores, saltar directamente al Step 1.

### Step 1: Implementar

Seguir: Arquitectura → Estructura a generar → Patrones → Dependencias → Rules.

### Step 2: Verificar

```bash
GOPRIVATE=github.com/educabot/* go mod download
go build ./...
go test ./...          # todos los tests deben pasar
```

## Arquitectura

Dependency flow (estricto): `entrypoints → usecases → providers (interfaces) ← repositories`

| Capa | Ubicación | Responsabilidad | Importa |
|------|-----------|-----------------|---------|
| **Entities** | `src/core/entities/` | Structs dominio, enums, value objects | Nada |
| **Providers** | `src/core/providers/` | Interfaces (contratos) + errores sentinel | entities |
| **Usecases** | `src/core/usecases/{feature}/` | Lógica negocio. 1 archivo = 1 operación | providers, entities |
| **Entrypoints** | `src/entrypoints/` | HTTP handlers, containers, middleware | usecases, entities |
| **Repositories** | `src/repositories/{feature}/` | Implementación GORM de providers | providers, entities |
| **Mocks** | `src/mocks/` | Mocks testify para testing | providers |

## Estructura a generar

- `cmd/` — main.go (config→NewApp→Run), app.go (App struct), repositories.go (DI), usecases.go (DI), handlers.go (DI)
- `config/` — config.go (extends bcfg.BaseConfig)
- `src/core/entities/` — {feature}.go (structs + TimeTrackedEntity)
- `src/core/providers/` — {feature}.go (interface), errors.go (re-export bcerrors)
- `src/core/usecases/{feature}/` — list.go (interface + request + impl), list_test.go
- `src/entrypoints/` — containers.go, {feature}.go (handlers), middleware/tenant.go, rest/rest.go (HandleError)
- `src/repositories/{feature}/` — repository.go (GORM implementation)
- `src/mocks/providers/` — {feature}.go (MockProvider testify)
- `src/app/web/` — mapping.go (ConfigureMappings)
- `db/migrations/` — 000001_create_{feature}_tables up+down SQL
- `docs/rfc-{project}/` — decisiones/, epicas/, operaciones/
- `.github/workflows/ci.yml`
- Root: go.mod, Dockerfile (multi-stage golang:1.26-alpine→alpine:3.19), docker-compose.yml (PG 16), Makefile, .air.toml, .golangci.yml, .env.example, .gitignore, .pre-commit-config.yaml, README.md, TESTING.md, CLAUDE.md

## Patrones

### UseCase
Interface + Request struct con Validate() + impl struct con provider dependency. `NewList{Feature}(provider) → Execute(ctx, request)`. Request valida y retorna sentinel error.

### Handler Container
`{Feature}Container` con usecase dependency. Handler extrae orgID de middleware, llama Execute, retorna web.OK o rest.HandleError.

### Repository (GORM)
Struct con `*gorm.DB`. Métodos implementan provider interface. Filtro por `organization_id`, order `created_at DESC`.

### Entity
Struct con ID (int64 autoIncrement), OrganizationID (uuid, indexed), campos de negocio, TimeTrackedEntity (CreatedAt/UpdatedAt).

### Errors
Re-export de bcerrors: ErrNotFound, ErrValidation, ErrUnauthorized, ErrForbidden, ErrDuplicate.

### DI Manual
Repositories struct agrupa providers → NewRepositories(db). UseCases struct agrupa usecases → NewUseCases(repos). Handlers struct → NewHandlers(usecases, cfg).

### Tests (AAA + testify)
Arrange: mock provider, crear usecase, datos esperados. Act: Execute. Assert: require.NoError, assert.Len, AssertExpectations.

## Dependencias core

team-ai-toolkit v1.7.7, gin v1.12.0, golang-jwt/jwt v5.3.1, google/uuid v1.6.0, testify v1.11.1, gorm v1.31.1, gorm/datatypes v1.2.7.

## Rules

- Generar TODOS los archivos con código funcional (no placeholders)
- Cada archivo debe compilar
- Incluir ≥1 usecase + handler + repo + test funcional
- Primer `go test ./...` debe pasar
- Usar `GOPRIVATE=github.com/educabot/*` en Dockerfile
- Migrations con up + down
- .env.example con test tokens pre-generados
- CLAUDE.md con convenciones del proyecto
- Español para docs, inglés para código
