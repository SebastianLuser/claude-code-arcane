# Anti-Patterns

- Usecase importando gorm/net/http, business logic en handler/repo
- Entity con tags GORM, Execute sin Validate(), OrgID sin validar
- wire/fx cuando DI manual alcanza, god usecase con multiples responsabilidades
- Return struct GORM al handler, panic en usecase, interfaces en lado implementador
- Un unico `usecases.go` con 15 funciones, hardcodear secrets
