# Checklist

- [ ] Estructura `cmd/`, `src/core/{entities,providers,usecases}`, `src/entrypoints`, `src/repositories`
- [ ] Entities sin tags de infraestructura
- [ ] Providers en `core/providers/`, no en repositories
- [ ] Cada usecase: Request con Validate() + Execute()
- [ ] OrgID validado siempre (multi-tenant)
- [ ] Handler sin logica de negocio
- [ ] DI manual en cmd/ legible y completa
- [ ] Mocks por cada provider
- [ ] Migration SQL up/down por cambio de schema
- [ ] Errores mapeados a HTTP codes en handler
- [ ] Un archivo = un usecase
