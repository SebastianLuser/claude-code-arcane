---
name: dotnet-architecture
description: "Arquitectura de backends .NET: Vertical Slice Architecture (features) y Clean Architecture (capas), con guía de cuándo usar cada una, estructura, patrones (MediatR/Result/outbox) y anti-patterns. Usar al diseñar o revisar la estructura de un proyecto ASP.NET Core."
category: "backend"
argument-hint: "[vertical-slice|clean|when-to-use]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# dotnet-architecture — VSA & Clean Architecture para .NET

Dos enfoques production-ready para estructurar un backend ASP.NET Core. No son excluyentes: muchos proyectos
usan Clean Architecture en el borde y slices verticales adentro. Esta skill ayuda a **elegir** y a aplicar
cada uno correctamente.

## MANDATORY WORKFLOW

**No imponer arquitectura por moda. Elegir según complejidad del dominio y vida del proyecto.**

### Step 0: Elegir enfoque (`when-to-use`)

| Señal | Recomendación |
|-------|---------------|
| CRUD, prototipos, APIs chicas, dominio fino, equipo chico | **Vertical Slice** (o single project) |
| Dominio complejo, reglas de negocio ricas, long-lived, varios equipos | **Clean Architecture** |
| Necesitás aislar el dominio de frameworks/DB para test y reemplazo | **Clean Architecture** |
| Querés velocidad y bajo overhead de indirección | **Vertical Slice** |

> Evitá Clean Architecture para CRUD simple: los proyectos extra y la indirección cuestan más de lo que aportan
> cuando la lógica de negocio es delgada. Empezá con Vertical Slice y migrá si el dominio crece.

### Step 1: Aplicar la estructura

- **Vertical Slice:** un folder por feature/use-case; cada slice tiene su request, handler, validator y endpoint juntos. Ver `references/project-structure.md`.
- **Clean Architecture:** proyectos `Domain → Application → Infrastructure → Api`; las dependencias apuntan **hacia adentro**, nunca al revés. Ver `references/project-structure.md`.

### Step 2: Patrones idiomáticos

Leer `references/patterns.md`: MediatR/handlers por use-case, `IApplicationDbContext` (exponer EF Core sin repos
genéricos), pipeline behaviors (validación/logging/transacción), Result pattern en vez de excepciones para flujo,
y outbox pattern para consistencia entre DB y eventos.

### Step 3: Revisar contra anti-patterns + checklist

- `references/anti-patterns.md` — repos genéricos sobre EF Core, fat controllers, dependencias que apuntan hacia afuera, lógica de dominio en Infrastructure.
- `references/checklist.md` — verificación de cierre antes de dar la estructura por buena.

Antes de aplicar una reestructuración significativa, confirmar el approach con el usuario (Question → Decision → Approval). Si todo el checklist pasa → arquitectura **COMPLIANT**.

## Resumen de enfoques

| Aspecto | Vertical Slice | Clean Architecture |
|---------|----------------|--------------------|
| Eje de organización | Feature / use-case | Capa técnica |
| Proyectos | 1 (+ tests) | 4 (Domain/App/Infra/Api) |
| Acoplamiento entre features | Bajo (slices independientes) | Mediado por Application |
| Overhead inicial | Bajo | Alto |
| Mejor para | CRUD, features, velocidad | Dominios complejos, long-lived |
| Riesgo | Duplicación entre slices | Sobre-ingeniería |

---

_Inspirado en [ardalis/CleanArchitecture](https://github.com/ardalis/CleanArchitecture), [nadirbad/VerticalSliceArchitecture](https://github.com/nadirbad/VerticalSliceArchitecture) y la guía de Vertical Slice de [Milan Jovanović](https://www.milanjovanovic.tech/blog/vertical-slice-architecture-dotnet). Adaptado al formato Arcane._
