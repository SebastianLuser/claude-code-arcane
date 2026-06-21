# Anti-Patterns

- **`IRepository<T>` / `IUnitOfWork` genérico sobre EF Core** — el `DbContext` ya es repositorio (`DbSet<>`) y Unit of Work (`SaveChangesAsync`); envolverlo agrega indirección sin valor y te tapa LINQ/Include/proyecciones.
- **Fat controllers / endpoints con lógica de negocio** — el endpoint solo traduce HTTP ↔ request y mapea el resultado; las reglas van en el handler/dominio, no en el controlador.
- **Dependencias apuntando hacia afuera** — `Domain` referenciando `Infrastructure` o EF Core rompe la regla de dependencias: el dominio deja de ser testeable y reemplazable.
- **Application anémica que solo reenvía a repos** — si el handler no hace más que `return repo.Get(id)`, la capa no aporta nada; movés lógica de negocio real al dominio/handler o eliminás la indirección.
- **Filtrar entidades EF como respuestas de API** — exponer entidades de persistencia acopla el contrato HTTP al schema de la DB y arrastra lazy-loading/ciclos; devolvé DTOs en el borde.
- **Forzar Clean Architecture en un CRUD simple** — cuatro proyectos y pipeline behaviors para listar y guardar registros es sobre-ingeniería; empezá con Vertical Slice o single project.
- **Service locator estático / `BuildServiceProvider()` en `Program.cs`** — construir el provider a mano crea grafos duplicados y dependencias ocultas; registrá todo en el contenedor y dejá que resuelva por constructor.
- **Un `Services/` y `Controllers/` gigantes** — organizar por tipo técnico dispersa cada feature en cinco carpetas; organizá por feature/slice para que un caso de uso viva junto.

_Ref: https://www.milanjovanovic.tech/blog/vertical-slice-architecture-dotnet · https://github.com/ardalis/CleanArchitecture · https://learn.microsoft.com/en-us/ef/core/dbcontext-configuration/_
