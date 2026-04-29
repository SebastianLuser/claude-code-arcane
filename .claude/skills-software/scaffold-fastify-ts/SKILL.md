---
name: scaffold-fastify-ts
description: "Scaffold production-ready Fastify + TypeScript backend with Prisma, Zod, and Vitest."
category: "backend"
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# scaffold-fastify-ts — Backend Scaffolder

## MANDATORY WORKFLOW

**Antes de generar cualquier código, completar estos pasos en orden.**

### Step 0: Gather Requirements

Clarificar (o inferir del contexto si ya fue especificado):

1. **Nombre del servicio** (kebab-case)
2. **Base de datos:** PostgreSQL / MySQL / SQLite
3. **ORM:** Prisma (default) / Drizzle
4. **Auth:** JWT / Session cookies / OAuth / ninguna
5. **Deploy target:** Docker / AWS ECS / Railway / Vercel

Si el usuario ya especificó estos valores, saltar directamente al Step 1.

### Step 1: Implementar

Seguir las secciones de este documento en orden: Framework Decision → Stack Baseline → Project Structure.

### Step 2: Verificar

Antes de declarar el scaffold completo:

```bash
npm run build        # tsc sin errores
docker compose up -d # Postgres arriba
npm run test         # vitest pasa
curl http://localhost:3000/health  # responde 200
```

---

## Framework Decision

| Option | Use when |
|--------|----------|
| **Fastify** | Default. Schema-first with Zod, low overhead, fast |
| **NestJS** | Heavy DI needed, Angular-style conventions — ask first |
| **Express** | Legacy lib compatibility only |

## Stack Baseline

- Node.js 20+ LTS, Fastify 4+, TypeScript strict mode, `tsx` for dev
- **Validation:** Zod + fastify-type-provider-zod (inferred types from schemas)
- **ORM:** Prisma (PostgreSQL default) or Drizzle (SQL-first preference)
- **Auth:** @fastify/jwt, @fastify/cookie, @fastify/cors, @fastify/helmet
- **Logging:** pino (built-in Fastify) — never `console.log`
- **Docs:** @fastify/swagger + @fastify/swagger-ui
- **Testing:** Vitest + supertest, using `buildApp()` + `app.inject()`
- **Linting:** ESLint + Prettier + Husky + lint-staged
- **Infra:** Docker multi-stage + docker-compose (Postgres)

## Project Structure

- `src/server.ts` (entrypoint) + `src/app.ts` (Fastify builder, testable)
- `src/config/` — env.ts (Zod env validation), plugins.ts
- `src/modules/<feature>/` — routes.ts, service.ts, repository.ts, schema.ts, tests
- `src/lib/` — db.ts (Prisma singleton), errors.ts, logger.ts
- `src/middleware/` — auth.ts, error-handler.ts
- `prisma/` — schema.prisma + migrations
- `tests/` — setup.ts + integration/
- Root: Dockerfile, docker-compose.yml, tsconfig.json, vitest.config.ts, .env.example

> → Read references/key-decisions.md for organization patterns, plugin pattern, config management, TypeScript and error handling details

> → Read references/anti-patterns.md for common anti-patterns to avoid
