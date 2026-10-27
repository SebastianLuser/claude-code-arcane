---
name: dotnet-architecture
description: ".NET backend architecture: Vertical Slice Architecture (features) and Clean Architecture (layers), with guidance on when to use each, structure, patterns (MediatR/Result/outbox) and anti-patterns. Use when designing or reviewing the structure of an ASP.NET Core project."
category: "backend"
argument-hint: "[vertical-slice|clean|when-to-use]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# dotnet-architecture — VSA & Clean Architecture for .NET

Two production-ready approaches to structuring an ASP.NET Core backend. They are not mutually exclusive: many projects
use Clean Architecture at the edge and vertical slices inside. This skill helps **choose** and apply
each one correctly.

## MANDATORY WORKFLOW

**Do not impose an architecture because it is fashionable. Choose by domain complexity and project lifespan.**

### Step 0: Choose the approach (`when-to-use`)

| Signal | Recommendation |
|-------|---------------|
| CRUD, prototypes, small APIs, thin domain, small team | **Vertical Slice** (or single project) |
| Complex domain, rich business rules, long-lived, several teams | **Clean Architecture** |
| You need to isolate the domain from frameworks/DB for testing and replacement | **Clean Architecture** |
| You want speed and low indirection overhead | **Vertical Slice** |

> Avoid Clean Architecture for simple CRUD: the extra projects and indirection cost more than they deliver
> when the business logic is thin. Start with Vertical Slice and migrate if the domain grows.

### Step 1: Apply the structure

- **Vertical Slice:** one folder per feature/use case; each slice keeps its request, handler, validator and endpoint together. See `references/project-structure.md`.
- **Clean Architecture:** `Domain → Application → Infrastructure → Api` projects; dependencies point **inward**, never the other way around. See `references/project-structure.md`.

### Step 2: Idiomatic patterns

Read `references/patterns.md`: MediatR/handlers per use case, `IApplicationDbContext` (expose EF Core without generic
repos), pipeline behaviors (validation/logging/transaction), Result pattern instead of exceptions for flow control,
and the outbox pattern for consistency between the DB and events.

### Step 3: Review against anti-patterns + checklist

- `references/anti-patterns.md` — generic repos over EF Core, fat controllers, outward-pointing dependencies, domain logic in Infrastructure.
- `references/checklist.md` — closing verification before accepting the structure.

Before applying a significant restructuring, confirm the approach with the user (Question → Decision → Approval). If the whole checklist passes → architecture **COMPLIANT**.

## Approach summary

| Aspect | Vertical Slice | Clean Architecture |
|---------|----------------|--------------------|
| Organizing axis | Feature / use case | Technical layer |
| Projects | 1 (+ tests) | 4 (Domain/App/Infra/Api) |
| Coupling between features | Low (independent slices) | Mediated by Application |
| Initial overhead | Low | High |
| Best for | CRUD, features, speed | Complex, long-lived domains |
| Risk | Duplication across slices | Over-engineering |

## Next steps

With the architecture defined → `/dotnet-scaffold` to generate the project, and `/dotnet-best-practices` to review the code against the 40 rules.

---

_Inspired by [ardalis/CleanArchitecture](https://github.com/ardalis/CleanArchitecture), [nadirbad/VerticalSliceArchitecture](https://github.com/nadirbad/VerticalSliceArchitecture) and [Milan Jovanović](https://www.milanjovanovic.tech/blog/vertical-slice-architecture-dotnet)'s Vertical Slice guide. Adapted to the Arcane format._
