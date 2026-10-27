# Checklist

- [ ] Structure `cmd/`, `src/core/{entities,providers,usecases}`, `src/entrypoints`, `src/repositories`
- [ ] Entities without infrastructure tags
- [ ] Providers in `core/providers/`, not in repositories
- [ ] Each usecase: Request with Validate() + Execute()
- [ ] OrgID always validated (multi-tenant)
- [ ] Handler without business logic
- [ ] Manual DI in cmd/ readable and complete
- [ ] Mocks for every provider
- [ ] SQL up/down migration per schema change
- [ ] Errors mapped to HTTP codes in the handler
- [ ] One file = one usecase
