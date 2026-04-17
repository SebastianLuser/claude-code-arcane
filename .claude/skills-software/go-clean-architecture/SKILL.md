---
name: go-clean-architecture
description: Arquitectura Go estilo Alizia-BE (Educabot). Clean Architecture híbrida con principios KISS, DI manual (no wire/fx), separación estricta entities/providers/usecases/entrypoints/repositories. Multi-tenant con OrgID scope. Patrón canónico Request.Validate() + UseCase.Execute(). Usar cuando se mencione arquitectura Go, clean architecture, estructura de backend Go, nuevo servicio Go, o cómo organizar código Go en Educabot.
argument-hint: "[module-name or feature]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Go Clean Architecture (estilo Alizia-BE)

Arquitectura canónica para backends Go en Educabot. Basada en el proyecto real **Alizia-BE**. Combina Clean Architecture por capas con una filosofía estricta de **KISS**: separación clara sin sobre-ingeniería.

## Cuándo usar

- ✅ API backend nueva de Educabot (servicio con lógica de negocio no trivial)
- ✅ Multi-tenant con `OrgID` scope
- ✅ Necesitás testabilidad (mocks por capa)
- ✅ El servicio va a crecer — querés onboarding claro

## Cuándo NO usar

- ❌ Tool interno / CLI simple (overkill, usar flat structure)
- ❌ Prototipo throwaway
- ❌ Script de migración one-shot
- ❌ Worker con una sola responsabilidad y sin dominio

---

## 1. Filosofía: KISS + Clean by layers

- **Simpleza primero.** No DDD pesado, no event sourcing, no microservicios prematuros, no CQRS a menos que lo pida el dominio.
- **Separación estricta por capas**, pero sin abstracciones innecesarias.
- **DI manual** en `cmd/`. Nada de `wire`, `fx`, `dig` — la verbosidad es una feature, no un bug. Uno abre `cmd/usecases.go` y lee todo el grafo de dependencias.
- **One file = one responsibility** (especialmente en usecases).
- Código, schema, nombres: **en inglés**. Comunicación: español.

---

## 2. Estructura de directorios canónica

```
cmd/                         <- Entry point + DI manual
  main.go                    <- arranque (carga config, llama app)
  app.go                     <- wiring top-level (db, router, shutdown)
  repositories.go            <- instancia repos
  usecases.go                <- instancia usecases con sus deps
  handlers.go                <- instancia handlers
  routes.go                  <- registra rutas en router

src/
  core/                      <- DOMINIO PURO (sin imports de infra)
    entities/                <- data structs planos (sin tags GORM)
    providers/               <- interfaces (contratos) + errors.go
    usecases/                <- business logic, agrupada por dominio
      admin/
      coordination/
      teaching/
  entrypoints/               <- HTTP handlers (REST/gRPC)
    rest/
  repositories/              <- GORM + raw SQL (implementan providers)
    admin/
    coordination/
  mocks/                     <- mocks por cada provider
  app/web/                   <- route mapping + middleware
  utils/

config/                      <- env vars (viper o stdlib)
db/migrations/               <- SQL up/down (golang-migrate)
scripts/
```

---

## 3. Regla de dependencias (inversión)

```
entrypoints  ─▶  usecases  ─▶  providers (interfaces)
                                   ▲
                                   │
                              repositories
```

**Regla inquebrantable:** los usecases **NUNCA** importan infraestructura (gorm, http, redis, openai). Solo importan `entities` y `providers`.

Si un usecase necesita persistencia → depende de la **interface** `providers.XxxRepo`. El repo concreto la implementa.

**Interfaces viven en el consumer** (Go idiom): en `src/core/providers/`, no en `src/repositories/`.

---

## 4. Entities — data structs puros

Sin tags GORM, sin lógica de persistencia, sin `json:` tags de HTTP. Son el modelo del dominio.

```go
// src/core/entities/coordination.go
package entities

import "github.com/google/uuid"

type DocStatus string

const (
    DocStatusPending    DocStatus = "pending"
    DocStatusInProgress DocStatus = "in_progress"
    DocStatusPublished  DocStatus = "published"
)

type CoordinationDocument struct {
    ID             int64
    OrganizationID uuid.UUID
    Name           string
    AreaID         int64
    Status         DocStatus
    CreatedByID    int64
}
```

Los tags de ORM y de JSON viven en DTOs de las capas externas (repo / handler).

---

## 5. Providers — interfaces y errores

`src/core/providers/` define contratos que los usecases consumen.

```go
// src/core/providers/coordination.go
package providers

import (
    "context"
    "github.com/google/uuid"
    "github.com/educabot/alizia-be/src/core/entities"
)

type CoordinationProvider interface {
    CreateDocument(ctx context.Context, doc *entities.CoordinationDocument) (int64, error)
    FindByID(ctx context.Context, orgID uuid.UUID, id int64) (*entities.CoordinationDocument, error)
    SetTopics(ctx context.Context, docID int64, topicIDs []int64) error
}
```

### Errores de dominio

```go
// src/core/providers/errors.go
package providers

import (
    "errors"
)

var (
    ErrValidation   = errors.New("validation error")
    ErrNotFound     = errors.New("not found")
    ErrUnauthorized = errors.New("unauthorized")
    ErrForbidden    = errors.New("forbidden")
    ErrDuplicate    = errors.New("duplicate")
    ErrConflict     = errors.New("conflict")
)
```

Los usecases wrappean: `fmt.Errorf("%w: org_id required", providers.ErrValidation)`. El entrypoint mapea sentinel → HTTP code.

---

## 6. Usecases — patrón canónico (Request.Validate + Execute)

**Regla dura:** cada Request tiene `Validate() error`, y `Execute` lo llama en la **primera línea**. Siempre validar `OrgID` (tenant scope) + campos requeridos.

```go
// src/core/usecases/coordination/create_document.go
package coordination

import (
    "context"
    "fmt"

    "github.com/google/uuid"
    "github.com/educabot/alizia-be/src/core/entities"
    "github.com/educabot/alizia-be/src/core/providers"
)

type CreateDocumentRequest struct {
    OrgID    uuid.UUID
    UserID   int64
    Name     string
    AreaID   int64
    TopicIDs []int64
}

func (r CreateDocumentRequest) Validate() error {
    if r.OrgID == uuid.Nil {
        return fmt.Errorf("%w: org_id is required", providers.ErrValidation)
    }
    if r.Name == "" {
        return fmt.Errorf("%w: name is required", providers.ErrValidation)
    }
    if r.AreaID == 0 {
        return fmt.Errorf("%w: area_id is required", providers.ErrValidation)
    }
    return nil
}

type CreateDocument interface {
    Execute(ctx context.Context, req CreateDocumentRequest) (int64, error)
}

type createDocumentImpl struct {
    repo providers.CoordinationProvider
}

func NewCreateDocument(repo providers.CoordinationProvider) CreateDocument {
    return &createDocumentImpl{repo: repo}
}

func (uc *createDocumentImpl) Execute(ctx context.Context, req CreateDocumentRequest) (int64, error) {
    if err := req.Validate(); err != nil {
        return 0, err
    }

    doc := &entities.CoordinationDocument{
        OrganizationID: req.OrgID,
        Name:           req.Name,
        AreaID:         req.AreaID,
        Status:         entities.DocStatusPending,
        CreatedByID:    req.UserID,
    }

    id, err := uc.repo.CreateDocument(ctx, doc)
    if err != nil {
        return 0, fmt.Errorf("create document: %w", err)
    }

    if len(req.TopicIDs) > 0 {
        if err := uc.repo.SetTopics(ctx, id, req.TopicIDs); err != nil {
            return 0, fmt.Errorf("set topics: %w", err)
        }
    }

    return id, nil
}
```

## 7. One file = one responsibility

En `src/core/usecases/coordination/` hay un archivo por caso de uso: `create_document.go`, `get_document.go`, `publish_document.go`. **No** un `coordination_usecases.go` con 12 funciones.

---

## 8. Error handling

- Errores sentinel en `providers/errors.go`.
- Usecases wrapean con `fmt.Errorf("%w: ...", providers.ErrXxx)`.
- Handler usa `errors.Is(err, providers.ErrValidation)` → 400, `ErrNotFound` → 404, `ErrForbidden` → 403, default → 500.
- Nunca `panic` en usecase. Siempre retornar error.

---

## 9. Entrypoints (REST handlers)

Traducen HTTP ↔ Request. **Sin lógica de negocio.**

```go
// src/entrypoints/rest/coordination_handler.go
func (h *CoordinationHandler) Create(c *gin.Context) {
    var body createDocumentBody
    if err := c.ShouldBindJSON(&body); err != nil {
        c.JSON(400, gin.H{"error": err.Error()}); return
    }

    orgID := auth.OrgIDFromContext(c)   // sale del JWT middleware
    userID := auth.UserIDFromContext(c)

    req := coordination.CreateDocumentRequest{
        OrgID: orgID, UserID: userID,
        Name: body.Name, AreaID: body.AreaID, TopicIDs: body.TopicIDs,
    }

    id, err := h.createDocument.Execute(c.Request.Context(), req)
    if err != nil {
        mapError(c, err); return
    }
    c.JSON(201, gin.H{"id": id})
}
```

---

## 10. Repositories (GORM)

Implementan providers. Structs con tags GORM viven acá, **no** en entities. Traducen row ↔ entity.

```go
// src/repositories/coordination/coordination_repo.go
package coordination

type documentRow struct {
    ID             int64     `gorm:"primaryKey"`
    OrganizationID uuid.UUID `gorm:"column:organization_id;type:uuid"`
    Name           string
    AreaID         int64
    Status         string
    CreatedByID    int64
    CreatedAt      time.Time
}

func (documentRow) TableName() string { return "coordination_documents" }

type Repo struct{ db *gorm.DB }

func New(db *gorm.DB) *Repo { return &Repo{db: db} }

func (r *Repo) CreateDocument(ctx context.Context, d *entities.CoordinationDocument) (int64, error) {
    row := documentRow{
        OrganizationID: d.OrganizationID, Name: d.Name,
        AreaID: d.AreaID, Status: string(d.Status), CreatedByID: d.CreatedByID,
    }
    if err := r.db.WithContext(ctx).Create(&row).Error; err != nil {
        return 0, err
    }
    return row.ID, nil
}
```

Raw SQL cuando GORM queda corto (queries complejas, performance).

---

## 11. DI manual en cmd/

Explícito, verboso, legible.

```go
// cmd/main.go
func main() {
    cfg := config.Load()
    if err := app.Run(cfg); err != nil { log.Fatal(err) }
}

// cmd/app.go
func Run(cfg *config.Config) error {
    db := db.Connect(cfg.DatabaseURL)
    repos := buildRepositories(db)
    ucs := buildUseCases(repos)
    handlers := buildHandlers(ucs)
    router := web.NewRouter(handlers)
    return http.ListenAndServe(cfg.Addr, router)
}

// cmd/repositories.go
type repositories struct {
    coordination providers.CoordinationProvider
    teaching     providers.TeachingProvider
}
func buildRepositories(db *gorm.DB) repositories {
    return repositories{
        coordination: coordrepo.New(db),
        teaching:     teachrepo.New(db),
    }
}

// cmd/usecases.go
type useCases struct {
    createDocument coordination.CreateDocument
    getDocument    coordination.GetDocument
}
func buildUseCases(r repositories) useCases {
    return useCases{
        createDocument: coordination.NewCreateDocument(r.coordination),
        getDocument:    coordination.NewGetDocument(r.coordination),
    }
}
```

Mirás `cmd/usecases.go` y entendés **todo** el grafo de dependencias. Nada de código generado mágico.

---

## 12. Multi-tenant (OrgID scope)

- `OrgID` **en cada Request** de usecase.
- `Validate()` siempre chequea `OrgID != uuid.Nil`.
- Cada query de repo filtra por `organization_id = ?`.
- Defensa en profundidad: **RLS en Postgres** como última barrera contra leaks cross-tenant.
- El middleware JWT extrae `OrgID` del token y lo inyecta en `context`.

Skills relacionadas: `/database-indexing`, `/data-migrations`, `/rbac-abac`.

---

## 13. Testing

- **Mocks** en `src/mocks/` por cada provider (mockery o a mano).
- **Usecases** → tests unitarios puros con mocks. Rápidos, deterministas.
- **Repositories** → integration con Postgres real (testcontainers) o DB de test.
- **Handlers** → tests de HTTP con usecase mockeado.
- **testify** para assertions (`require`, `assert`).

```go
func TestCreateDocument_MissingOrgID(t *testing.T) {
    uc := coordination.NewCreateDocument(&mocks.CoordinationProvider{})
    _, err := uc.Execute(ctx, coordination.CreateDocumentRequest{Name: "x", AreaID: 1})
    require.ErrorIs(t, err, providers.ErrValidation)
}
```

---

## 14. Migrations

- `golang-migrate` con SQL up/down versionado.
- Una migration por cambio de schema.
- Nunca editar migrations ya aplicadas en prod → agregar una nueva.
- Link: `/data-migrations`.

---

## 15. Config

Env vars cargadas en `config/`. Nunca hardcodear. Usar `.env.example` actualizado.

Link: `/secret-management`, `/env-sync`.

---

## 16. Cuándo aplicar esta arquitectura

| Escenario | Aplica |
|---|---|
| API backend nueva Educabot | ✅ |
| Servicio con lógica de negocio no trivial | ✅ |
| Multi-tenant | ✅ |
| Necesito tests aislados por capa | ✅ |
| Tool interno / CLI simple | ❌ |
| Prototipo scratch | ❌ |
| Worker de una sola función | ❌ |

---

## 17. Ejemplo end-to-end: POST /coordinations

1. **Entity** `src/core/entities/coordination.go`
2. **Provider** `src/core/providers/coordination.go` — `CreateDocument(ctx, *Doc) (int64, error)`
3. **Usecase** `src/core/usecases/coordination/create_document.go` — Request+Validate+Execute
4. **Repo** `src/repositories/coordination/coordination_repo.go` — GORM impl
5. **Handler** `src/entrypoints/rest/coordination_handler.go` — bind → Execute → respond
6. **Route** `src/app/web/routes.go` — `r.POST("/coordinations", h.Create)`
7. **Wire** `cmd/repositories.go`, `cmd/usecases.go`, `cmd/handlers.go`
8. **Migration** `db/migrations/NNN_create_coordination_documents.up.sql` + `.down.sql`
9. **Tests** `src/core/usecases/coordination/create_document_test.go` con mock del provider

---

## Anti-patterns ❌

- ❌ Usecase importando `gorm.io/gorm` o `net/http` (rompe inversión)
- ❌ Business logic en handler o en repo
- ❌ Entity con tags GORM (acopla dominio al ORM)
- ❌ `Execute` sin llamar `Validate()` primero
- ❌ Olvidar validar `OrgID` (cross-tenant leak)
- ❌ Usar `wire` / `fx` cuando DI manual alcanza
- ❌ God usecase con múltiples responsabilidades
- ❌ Return de struct crudo de GORM al handler (filtra internals de la DB)
- ❌ `panic` en usecase (devolver error siempre)
- ❌ Definir interfaces en el lado que las implementa (deben vivir en `core/providers`)
- ❌ Skipping tests de usecase porque "es lógica trivial"
- ❌ Un único archivo `usecases.go` con 15 funciones
- ❌ Hardcodear secrets o connection strings

---

## Checklist review

- [ ] Estructura de carpetas correcta (`cmd/`, `src/core/{entities,providers,usecases}`, `src/entrypoints`, `src/repositories`, `src/mocks`)
- [ ] Entities sin tags de infraestructura
- [ ] Providers (interfaces) viven en `core/providers`, no en repositories
- [ ] Cada usecase tiene Request con `Validate()` + `Execute()`
- [ ] `Validate()` wrapea con `ErrValidation`
- [ ] `OrgID` validado siempre (multi-tenant)
- [ ] Handler NO contiene lógica de negocio
- [ ] Repo implementa provider (no al revés)
- [ ] DI manual en `cmd/` es legible y completa
- [ ] Mocks generados/escritos por cada provider
- [ ] Migration SQL up/down por cada cambio de schema
- [ ] Errores mapeados correctamente a HTTP codes en handler
- [ ] Config sale de env vars, no hardcodeada
- [ ] Un archivo = un usecase

---

## Output ✅

Proyecto recién scaffoldeado siguiendo esta arquitectura se ve así:

```
myservice/
├── cmd/
│   ├── main.go          # 10 líneas: config.Load + app.Run
│   ├── app.go           # wiring top-level
│   ├── repositories.go  # buildRepositories(db)
│   ├── usecases.go      # buildUseCases(repos)
│   ├── handlers.go      # buildHandlers(ucs)
│   └── routes.go
├── src/
│   ├── core/
│   │   ├── entities/     ✅ structs puros
│   │   ├── providers/    ✅ interfaces + errors.go
│   │   └── usecases/     ✅ one file = one usecase
│   ├── entrypoints/rest/ ✅ handlers thin
│   ├── repositories/     ✅ GORM impls
│   └── mocks/            ✅ un mock por provider
├── config/
├── db/migrations/
├── Makefile
├── docker-compose.yml
└── .env.example
```

Comandos esperados: `make run`, `make test`, `make lint`, `make migrate`, `make build`.

---

## Delegación

- **`backend-architect`** — decisiones de alto nivel (contextos, límites de servicio, eventos)
- **`go-engineer`** — implementación idiomática Go, concurrency, perf

## Skills relacionadas

- `/scaffold-go` — scaffolding inicial del proyecto con esta arquitectura
- `/data-migrations` — diseño y ejecución de migrations
- `/database-indexing` — estrategia de índices para queries multi-tenant
- `/query-optimization` — optimización de queries GORM/SQL
- `/rbac-abac` — autorización por rol y atributos
- `/jwt-strategy` — estrategia JWT (claims, refresh, OrgID)
- `/secret-management` — manejo de secrets
- `/logging-setup` — logging estructurado
- `/api-versioning` — estrategia de versionado de API
