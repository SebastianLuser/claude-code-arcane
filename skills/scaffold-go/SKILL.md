---
name: scaffold-go
description: "Scaffold Go projects with Alizia-BE architecture: Clean Architecture, GORM, Gin, PostgreSQL, DI, migrations. Trigger: new Go project."
category: "backend"
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Go Project Scaffold — Alizia-BE Style

Generates a complete Go project structure with Clean Architecture + team-ai-toolkit.

## MANDATORY WORKFLOW

**Before generating any code, complete these steps in order.**

### Step 0: Gather Requirements

Clarify (or infer from context if already specified):

1. **Project name** (e.g., "vigia-be", "tich-be")
2. **Go module** (e.g., "github.com/educabot/vigia-be")
3. **Description** (1 line)
4. **First domain/feature** (e.g., "alerts", "students")
5. **Default port** (default: 8080)
6. **Local PostgreSQL port** (default: 5432)

If the user already specified these values, skip straight to Step 1.

### Step 1: Implement

Follow: Architecture → Structure to generate → Patterns → Dependencies → Rules.

### Step 2: Verify

```bash
GOPRIVATE=github.com/educabot/* go mod download
go build ./...
go test ./...          # all tests must pass
```

## Architecture

Dependency flow (strict): `entrypoints → usecases → providers (interfaces) ← repositories`

| Layer | Location | Responsibility | Imports |
|------|-----------|-----------------|---------|
| **Entities** | `src/core/entities/` | Domain structs, enums, value objects | Nothing |
| **Providers** | `src/core/providers/` | Interfaces (contracts) + sentinel errors | entities |
| **Usecases** | `src/core/usecases/{feature}/` | Business logic. 1 file = 1 operation | providers, entities |
| **Entrypoints** | `src/entrypoints/` | HTTP handlers, containers, middleware | usecases, entities |
| **Repositories** | `src/repositories/{feature}/` | GORM implementation of providers | providers, entities |
| **Mocks** | `src/mocks/` | testify mocks for testing | providers |

## Structure to generate

> → Read references/project-structure.md for full file list per directory

## Patterns

> → Read references/patterns.md for UseCase, Handler, Repository, Entity, Errors, DI, and Test patterns

## Core dependencies

team-ai-toolkit v1.7.7, gin v1.12.0, golang-jwt/jwt v5.3.1, google/uuid v1.6.0, testify v1.11.1, gorm v1.31.1, gorm/datatypes v1.2.7.

## Rules

- Generate ALL files with working code (no placeholders)
- Every file must compile
- Include ≥1 working usecase + handler + repo + test
- The first `go test ./...` must pass
- Use `GOPRIVATE=github.com/educabot/*` in the Dockerfile
- Migrations with up + down
- .env.example with pre-generated test tokens
- CLAUDE.md with the project conventions
- Docs in the user's language, code in English
