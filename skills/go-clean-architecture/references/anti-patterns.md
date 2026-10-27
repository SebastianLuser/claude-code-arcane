# Anti-Patterns

- Usecase importing gorm/net/http, business logic in the handler/repo
- Entity with GORM tags, Execute without Validate(), unvalidated OrgID
- wire/fx when manual DI is enough, god usecase with multiple responsibilities
- Returning a GORM struct to the handler, panic in a usecase, interfaces on the implementer side
- A single `usecases.go` with 15 functions, hardcoded secrets
