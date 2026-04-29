# Project Structure to Generate

- `cmd/` — main.go (config->NewApp->Run), app.go (App struct), repositories.go (DI), usecases.go (DI), handlers.go (DI)
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
- Root: go.mod, Dockerfile (multi-stage golang:1.26-alpine->alpine:3.19), docker-compose.yml (PG 16), Makefile, .air.toml, .golangci.yml, .env.example, .gitignore, .pre-commit-config.yaml, README.md, TESTING.md, CLAUDE.md
