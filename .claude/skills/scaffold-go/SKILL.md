---
name: scaffold-go
description: "Scaffolding de proyectos Go siguiendo la arquitectura de Alizia-BE: Clean Architecture, GORM, Gin (via team-ai-toolkit), PostgreSQL, DI manual, migrations. Usar cuando se mencione: nuevo proyecto Go, scaffold Go, crear proyecto Go, boilerplate Go."
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Go Project Scaffold — Estilo Alizia-BE

Genera la estructura completa de un nuevo proyecto Go siguiendo la arquitectura de Alizia-BE (Clean Architecture con team-ai-toolkit).

## Input

Preguntar al usuario:
1. **Nombre del proyecto** (e.g., "vigia-be", "tich-be")
2. **Módulo Go** (e.g., "github.com/educabot/vigia-be")
3. **Descripción** (1 línea)
4. **Primer dominio/feature** (e.g., "alerts", "students", "courses")
5. **Puerto default** (default: 8080)
6. **Puerto de PostgreSQL local** (default: 5432)

## Arquitectura de referencia (Alizia-BE)

```
Dependency flow (estricto — nunca invertir):
  entrypoints → usecases → providers (interfaces) ← repositories
```

### Capas

| Capa | Ubicación | Responsabilidad | Importa |
|------|-----------|-----------------|---------|
| **Entities** | `src/core/entities/` | Structs de dominio, enums, value objects | Nada |
| **Providers** | `src/core/providers/` | Interfaces (contratos) + errores sentinel | entities |
| **Usecases** | `src/core/usecases/{feature}/` | Lógica de negocio. 1 archivo = 1 operación | providers, entities |
| **Entrypoints** | `src/entrypoints/` | HTTP handlers, containers, middleware | usecases, entities |
| **Repositories** | `src/repositories/{feature}/` | Implementación GORM de providers | providers, entities |
| **Mocks** | `src/mocks/` | Mocks de testify para testing | providers |

## Estructura a generar

```
{project}/
├── cmd/
│   ├── main.go              # config.Load() → NewApp() → Run()
│   ├── app.go               # App struct, NewApp(), Run(), Close()
│   ├── repositories.go      # DI: NewRepositories(db)
│   ├── usecases.go          # DI: NewUseCases(repos)
│   └── handlers.go          # DI: NewHandlers(usecases, cfg)
│
├── config/
│   └── config.go            # Config struct extends bcfg.BaseConfig
│
├── src/
│   ├── core/
│   │   ├── entities/
│   │   │   └── {feature}.go     # Structs + TimeTrackedEntity
│   │   ├── providers/
│   │   │   ├── {feature}.go     # Interface {Feature}Provider
│   │   │   └── errors.go        # Re-export bcerrors + custom errors
│   │   └── usecases/
│   │       └── {feature}/
│   │           ├── list.go          # Interface + Request + Impl
│   │           └── list_test.go     # Unit test con mocks
│   │
│   ├── entrypoints/
│   │   ├── containers.go           # WebHandlerContainer
│   │   ├── {feature}.go            # {Feature}Container con handlers
│   │   ├── middleware/
│   │   │   └── tenant.go           # Multi-tenant (org_id from JWT)
│   │   └── rest/
│   │       └── rest.go             # HandleError() — error mapping
│   │
│   ├── repositories/
│   │   └── {feature}/
│   │       └── repository.go       # GORM implementation
│   │
│   ├── mocks/
│   │   └── providers/
│   │       └── {feature}.go        # MockProvider con testify/mock
│   │
│   ├── app/
│   │   └── web/
│   │       └── mapping.go          # ConfigureMappings(engine, handlers, cfg)
│   │
│   └── utils/
│
├── db/
│   └── migrations/
│       ├── 000001_create_{feature}_tables.up.sql
│       └── 000001_create_{feature}_tables.down.sql
│
├── docs/
│   └── rfc-{project}/
│       ├── decisiones/
│       ├── epicas/
│       └── operaciones/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── go.mod
├── Dockerfile                  # Multi-stage: golang:1.26-alpine → alpine:3.19
├── docker-compose.yml          # PostgreSQL 16
├── Makefile                    # build, test, test-cover, vet, lint, docker, migrate, run
├── .air.toml                   # Hot reload
├── .golangci.yml               # Linter config
├── .env.example
├── .gitignore
├── .pre-commit-config.yaml
├── README.md
├── TESTING.md
└── CLAUDE.md
```

## Patrones a replicar

### UseCase Pattern
```go
// src/core/usecases/{feature}/list.go
type List{Feature} interface {
    Execute(ctx context.Context, req List{Feature}Request) ([]*entities.{Feature}, error)
}

type list{Feature}Impl struct {
    {feature}s providers.{Feature}Provider
}

func NewList{Feature}({feature}s providers.{Feature}Provider) List{Feature} {
    return &list{Feature}Impl{{feature}s: {feature}s}
}

type List{Feature}Request struct {
    OrgID uuid.UUID
}

func (r List{Feature}Request) Validate() error {
    if r.OrgID == uuid.Nil {
        return fmt.Errorf("%w: org_id is required", providers.ErrValidation)
    }
    return nil
}

func (uc *list{Feature}Impl) Execute(ctx context.Context, req List{Feature}Request) ([]*entities.{Feature}, error) {
    if err := req.Validate(); err != nil {
        return nil, err
    }
    return uc.{feature}s.List(ctx, req.OrgID)
}
```

### Handler Container Pattern
```go
// src/entrypoints/{feature}.go
type {Feature}Container struct {
    List{Feature} {feature}uc.List{Feature}
}

func (c *{Feature}Container) HandleList(req web.Request) web.Response {
    orgID := middleware.OrgID(req)
    result, err := c.List{Feature}.Execute(req.Context(), {feature}uc.List{Feature}Request{
        OrgID: orgID,
    })
    if err != nil {
        return rest.HandleError(err)
    }
    return web.OK(result)
}
```

### Repository Pattern (GORM)
```go
// src/repositories/{feature}/repository.go
type Repository struct {
    db *gorm.DB
}

func New(db *gorm.DB) *Repository {
    return &Repository{db: db}
}

func (r *Repository) List(ctx context.Context, orgID uuid.UUID) ([]*entities.{Feature}, error) {
    var items []*entities.{Feature}
    err := r.db.WithContext(ctx).
        Where("organization_id = ?", orgID).
        Order("created_at DESC").
        Find(&items).Error
    return items, err
}
```

### Entity Pattern
```go
// src/core/entities/{feature}.go
type {Feature} struct {
    ID             int64     `json:"id" gorm:"primaryKey;autoIncrement"`
    OrganizationID uuid.UUID `json:"organization_id" gorm:"type:uuid;not null;index"`
    Name           string    `json:"name" gorm:"not null"`
    TimeTrackedEntity
}

type TimeTrackedEntity struct {
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
```

### Error Pattern
```go
// src/core/providers/errors.go
var (
    ErrNotFound     = bcerrors.ErrNotFound
    ErrValidation   = bcerrors.ErrValidation
    ErrUnauthorized = bcerrors.ErrUnauthorized
    ErrForbidden    = bcerrors.ErrForbidden
    ErrDuplicate    = bcerrors.ErrDuplicate
)
```

### DI Manual Pattern
```go
// cmd/repositories.go
type Repositories struct {
    {Feature} providers.{Feature}Provider
}

func NewRepositories(db *gorm.DB) *Repositories {
    repo := {feature}r.New(db)
    return &Repositories{
        {Feature}: repo,
    }
}
```

### Test Pattern (AAA + testify)
```go
func TestList{Feature}_Execute_Success(t *testing.T) {
    // Arrange
    mock{Feature} := new(mockproviders.Mock{Feature}Provider)
    uc := {feature}uc.NewList{Feature}(mock{Feature})
    orgID := uuid.New()
    ctx := context.Background()

    expected := []*entities.{Feature}{{ID: 1, Name: "test"}}
    mock{Feature}.On("List", ctx, orgID).Return(expected, nil)

    // Act
    result, err := uc.Execute(ctx, {feature}uc.List{Feature}Request{OrgID: orgID})

    // Assert
    require.NoError(t, err)
    assert.Len(t, result, 1)
    mock{Feature}.AssertExpectations(t)
}
```

## Dependencias core (go.mod)

```
github.com/educabot/team-ai-toolkit v1.7.7
github.com/gin-gonic/gin v1.12.0
github.com/golang-jwt/jwt/v5 v5.3.1
github.com/google/uuid v1.6.0
github.com/stretchr/testify v1.11.1
gorm.io/gorm v1.31.1
gorm.io/datatypes v1.2.7
```

## Rules
- Generar TODOS los archivos con código funcional (no placeholders)
- Cada archivo debe compilar
- Incluir al menos 1 usecase + 1 handler + 1 repo + 1 test funcional
- El primer `go test ./...` debe pasar
- Usar `GOPRIVATE=github.com/educabot/*` en Dockerfile
- Migrations con up + down
- .env.example con test tokens pre-generados
- CLAUDE.md con las convenciones del proyecto
- En español para docs, en inglés para código
