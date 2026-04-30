# Implementation Patterns

## UseCase
Interface + Request struct con Validate() + impl struct con provider dependency. `NewList{Feature}(provider) -> Execute(ctx, request)`. Request valida y retorna sentinel error.

## Handler Container
`{Feature}Container` con usecase dependency. Handler extrae orgID de middleware, llama Execute, retorna web.OK o rest.HandleError.

## Repository (GORM)
Struct con `*gorm.DB`. Metodos implementan provider interface. Filtro por `organization_id`, order `created_at DESC`.

## Entity
Struct con ID (int64 autoIncrement), OrganizationID (uuid, indexed), campos de negocio, TimeTrackedEntity (CreatedAt/UpdatedAt).

## Errors
Re-export de bcerrors: ErrNotFound, ErrValidation, ErrUnauthorized, ErrForbidden, ErrDuplicate.

## DI Manual
Repositories struct agrupa providers -> NewRepositories(db). UseCases struct agrupa usecases -> NewUseCases(repos). Handlers struct -> NewHandlers(usecases, cfg).

## Tests (AAA + testify)
Arrange: mock provider, crear usecase, datos esperados. Act: Execute. Assert: require.NoError, assert.Len, AssertExpectations.
