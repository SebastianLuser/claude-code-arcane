---
name: scaffold-fastify-ts
description: "Scaffold production-ready Fastify + TypeScript backend with Prisma, Zod, and Vitest."
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# scaffold-fastify-ts — Backend Scaffolder

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

## Key Decisions

### Organization
- **Modular by feature** (`modules/users/`, `modules/orders/`) — never by type (`controllers/`, `services/`)
- **Repository pattern** for DB access — enables mocking in tests
- **Thin routes, thick services** — routes handle HTTP, services handle logic

### Fastify Plugin Pattern
- Use `withTypeProvider<ZodTypeProvider>()` for schema-first validation
- Set `validatorCompiler` + `serializerCompiler` from fastify-type-provider-zod
- Register plugins via `app.register()` with encapsulation (scoped decorators)
- Autoload modules or explicitly register each module plugin

### Config Management
- Validate all env vars at startup with Zod schema — fail fast on missing config
- Use @fastify/env or direct `z.parse(process.env)` in `config/env.ts`
- Required vars: NODE_ENV, PORT, DATABASE_URL, JWT_SECRET (min 32 chars)

### TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`
- Module: `NodeNext` — imports require `.js` extension (ESM requirement)
- Path alias `@/*` mapping to `./src/*`

### Error Handling
- Centralized `setErrorHandler` on app — ZodError maps to 400, everything else 500
- Custom error classes extending Fastify's httpErrors (@fastify/sensible)
- Never expose stack traces in production

## Pre-scaffold Questions

1. Service name (kebab-case)
2. Database: PostgreSQL / MySQL / SQLite
3. ORM: Prisma (default) / Drizzle
4. Auth: JWT / Session cookies / OAuth
5. Deploy target: Docker / AWS ECS / Railway / Vercel

## Anti-patterns

- No schema validation on routes (lose type safety and runtime checks)
- God routes with business logic inline (untestable)
- Missing centralized error handler (inconsistent error responses)
- No graceful shutdown handling (SIGTERM/SIGINT)
- `console.log` instead of pino structured logging
- Skipping env validation (runtime crashes on missing vars)
- Prisma client instantiated per-request instead of singleton
- Missing `.js` extensions in ESM imports
