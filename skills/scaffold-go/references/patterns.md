# Implementation Patterns

## UseCase
Interface + Request struct with Validate() + impl struct with a provider dependency. `NewList{Feature}(provider) -> Execute(ctx, request)`. The Request validates and returns a sentinel error.

## Handler Container
`{Feature}Container` with a usecase dependency. The handler extracts orgID from middleware, calls Execute, returns web.OK or rest.HandleError.

## Repository (GORM)
Struct with `*gorm.DB`. Methods implement the provider interface. Filter by `organization_id`, order `created_at DESC`.

## Entity
Struct with ID (int64 autoIncrement), OrganizationID (uuid, indexed), business fields, TimeTrackedEntity (CreatedAt/UpdatedAt).

## Errors
Re-export of bcerrors: ErrNotFound, ErrValidation, ErrUnauthorized, ErrForbidden, ErrDuplicate.

## DI Manual
Repositories struct groups providers -> NewRepositories(db). UseCases struct groups usecases -> NewUseCases(repos). Handlers struct -> NewHandlers(usecases, cfg).

## Tests (AAA + testify)
Arrange: mock provider, create usecase, expected data. Act: Execute. Assert: require.NoError, assert.Len, AssertExpectations.
