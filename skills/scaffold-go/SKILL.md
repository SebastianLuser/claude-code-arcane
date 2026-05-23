---
name: scaffold-go
description: "Scaffold Go projects with Alizia-BE architecture: Clean Architecture, GORM, Gin, PostgreSQL, DI, migrations. Trigger: new Go project."
category: "backend"
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Go Project Scaffold — Estilo Alizia-BE

Genera estructura completa de proyecto Go con Clean Architecture + team-ai-toolkit.

## MANDATORY WORKFLOW

**Antes de generar cualquier código, completar estos pasos en orden.**

### Step 0: Gather Requirements

Clarificar (o inferir del contexto si ya fue especificado):

1. **Nombre del proyecto** (e.g., "vigia-be", "tich-be")
2. **Módulo Go** (e.g., "github.com/educabot/vigia-be")
3. **Descripción** (1 línea)
4. **Primer dominio/feature** (e.g., "alerts", "students")
5. **Puerto default** (default: 8080)
6. **Puerto PostgreSQL local** (default: 5432)

Si el usuario ya especificó estos valores, saltar directamente al Step 1.

### Step 1: Implementar

Seguir: Arquitectura → Estructura a generar → Patrones → Dependencias → Rules.

### Step 2: Verificar

```bash
GOPRIVATE=github.com/educabot/* go mod download
go build ./...
go test ./...          # todos los tests deben pasar
```

## Arquitectura

Dependency flow (estricto): `entrypoints → usecases → providers (interfaces) ← repositories`

| Capa | Ubicación | Responsabilidad | Importa |
|------|-----------|-----------------|---------|
| **Entities** | `src/core/entities/` | Structs dominio, enums, value objects | Nada |
| **Providers** | `src/core/providers/` | Interfaces (contratos) + errores sentinel | entities |
| **Usecases** | `src/core/usecases/{feature}/` | Lógica negocio. 1 archivo = 1 operación | providers, entities |
| **Entrypoints** | `src/entrypoints/` | HTTP handlers, containers, middleware | usecases, entities |
| **Repositories** | `src/repositories/{feature}/` | Implementación GORM de providers | providers, entities |
| **Mocks** | `src/mocks/` | Mocks testify para testing | providers |

## Estructura a generar

> → Read references/project-structure.md for full file list per directory

## Patrones

> → Read references/patterns.md for UseCase, Handler, Repository, Entity, Errors, DI, and Test patterns

## Dependencias core

team-ai-toolkit v1.7.7, gin v1.12.0, golang-jwt/jwt v5.3.1, google/uuid v1.6.0, testify v1.11.1, gorm v1.31.1, gorm/datatypes v1.2.7.

## Rules

- Generar TODOS los archivos con código funcional (no placeholders)
- Cada archivo debe compilar
- Incluir ≥1 usecase + handler + repo + test funcional
- Primer `go test ./...` debe pasar
- Usar `GOPRIVATE=github.com/educabot/*` en Dockerfile
- Migrations con up + down
- .env.example con test tokens pre-generados
- CLAUDE.md con convenciones del proyecto
- Español para docs, inglés para código
