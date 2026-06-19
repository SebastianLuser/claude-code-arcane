---
name: dotnet-best-practices
description: "ASP.NET Core / C# production best practices: 40 reglas en 10 categorías (arquitectura, DI, errores, seguridad, performance, async, EF Core, testing, API, devops) priorizadas por impacto. Usar al escribir/revisar código .NET backend."
category: "backend"
argument-hint: "[architecture|di|errors|security|performance|async|database|testing|api|all]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# dotnet-best-practices — Guía priorizada por impacto

40 reglas para aplicaciones ASP.NET Core (.NET 10) production-ready, organizadas en 10 categorías y priorizadas de **CRITICAL** a **LOW-MEDIUM**. Cada regla del catálogo (en `references/`) trae impacto, ejemplo incorrecto, ejemplo correcto y link a docs.

## MANDATORY WORKFLOW

**No aplicar las 40 reglas a ciegas. Diagnosticar primero, priorizar por impacto.**

### Step 0: Determinar scope

1. **¿Código nuevo o auditoría de existente?** Si es auditoría, leer primero el feature/proyecto objetivo.
2. **¿Qué categoría aplica?** Mapear el área del problema (ver tabla) o usar `all` para review completa.
3. **¿Hay síntomas concretos?** (deadlocks, N+1, 500 inconsistentes, leaks) → ir directo a la categoría relevante.

### Step 1: Priorizar por impacto

Aplicar en este orden — no bajar de nivel hasta resolver el anterior:

| Prioridad | Categoría | Impacto | Reference |
|-----------|-----------|---------|-----------|
| 1 | Architecture | CRITICAL | `references/architecture.md` |
| 2 | Dependency Injection | CRITICAL | `references/dependency-injection.md` |
| 3 | Async & Concurrency | HIGH | `references/async.md` |
| 4 | Error Handling | HIGH | `references/error-handling.md` |
| 5 | Security | HIGH | `references/security.md` |
| 6 | Performance | HIGH | `references/performance.md` |
| 7 | Database & EF Core | MEDIUM-HIGH | `references/database.md` |
| 8 | Testing | MEDIUM-HIGH | `references/testing.md` |
| 9 | API Design | MEDIUM | `references/api-design.md` |
| 10 | DevOps & Deployment | LOW-MEDIUM | `references/devops.md` |

### Step 2: Aplicar + verificar

Para cada regla relevante: leer el ejemplo correcto en el reference, aplicarlo, y verificar contra el checklist de cierre.

### Step 3: Checklist de cierre

- [ ] `<Nullable>enable</Nullable>` + warnings as errors; cero `#nullable disable`
- [ ] Async end-to-end con `CancellationToken`; cero `.Result`/`.Wait()`/`.GetAwaiter().GetResult()`
- [ ] DI por constructor con scope correcto; sin `BuildServiceProvider()` manual ni service locator
- [ ] Errores vía `ProblemDetails` (RFC 7807); sin stack traces expuestos
- [ ] Sin N+1 en EF Core (`Include`/projection); `AsNoTracking()` en lecturas
- [ ] Migraciones versionadas; nunca `EnsureCreated()` en prod
- [ ] AuthZ por policies declarativas; secrets en secret manager (no en `appsettings.json`)
- [ ] Structured logging (Serilog JSON) + health checks
- [ ] Tests con xUnit; integración contra Postgres real (Testcontainers), no mocks de DbContext

Si todo el checklist pasa → código **COMPLIANT**. Antes de escribir cambios significativos, confirmar el approach con el usuario (Question → Decision → Approval).

## Tabla de mapeo síntoma → categoría

| Síntoma | Categoría |
|---------|-----------|
| Deadlocks / thread pool starvation / app cuelga | Async, Performance |
| Lentitud en endpoints, muchas queries | Performance, Database |
| `InvalidOperationException` de DI / scopes / captured dependency | DI, Architecture |
| Errores 500 inconsistentes / leaks de stack traces | Error Handling |
| Endpoints expuestos / brute force / data sensible en logs | Security |
| Tests frágiles o que pegan a servicios/DB reales sin control | Testing |
| Respuestas inconsistentes / over-fetching de entidades | API Design |

---

_Adaptado de [github/awesome-copilot](https://github.com/github/awesome-copilot) (dotnet-best-practices), [dotnet/skills](https://github.com/dotnet/skills) y [Aaronontheweb/dotnet-skills](https://github.com/Aaronontheweb/dotnet-skills). Reorganizado al formato skill+references de Arcane._
