---
name: nestjs-scaffold
description: "Production-ready NestJS API scaffold with feature modules, DI, global ValidationPipe, Prisma/Drizzle, auth guards and testing. Use to start a new NestJS backend."
category: "backend"
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# nestjs-scaffold — NestJS API Scaffolder

## MANDATORY WORKFLOW

**Before generating any code, complete these steps in order.**

### Step 0: Gather Requirements
1. **Service name** (kebab-case)
2. **Transport:** REST (default) / GraphQL / microservice
3. **ORM:** Prisma (default) / Drizzle / TypeORM
4. **DB:** PostgreSQL (default) / MySQL
5. **Auth:** JWT + refresh (default) / OAuth / none
6. **Deploy:** Docker (default) / Railway / AWS ECS

### Step 1: Create the base
```bash
npm i -g @nestjs/cli
nest new <name> --package-manager pnpm
cd <name>
nest g module users && nest g controller users && nest g service users
```

### Step 2: Structure (feature modules — NOT by layer)
```
src/
  users/   { users.module.ts, users.controller.ts, users.service.ts, dto/, entities/ }
  auth/    { auth.module.ts, jwt.strategy.ts, guards/, decorators/ }
  common/  { filters/, interceptors/, pipes/ }
  config/  { config.module.ts, env.validation.ts }
  main.ts
```

### Step 3: Non-negotiable bootstrap (`main.ts`)
```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
app.useGlobalFilters(new AllExceptionsFilter());
app.enableShutdownHooks();           // graceful shutdown
app.enableVersioning({ type: VersioningType.URI });
```

### Step 4: Defaults
- Constructor injection always; zero `ModuleRef.get()` at runtime
- Decorated DTOs (`class-validator`) on every endpoint
- Declarative guards for auth/authz
- `ConfigModule` with env validation (Joi/Zod) at boot
- Versioned migrations, `synchronize: false`
- Health check (`@nestjs/terminus`) + structured logging (pino)
- Tests: `Test.createTestingModule` (unit) + supertest (e2e)

### Step 5: Verify
`npm run build` + `npm run test`. Review against the `nestjs-code` rule and the `nestjs-best-practices` skill. Build + tests green → scaffold **READY**.

## Stack Defaults

| Component | Default |
|------------|---------|
| Framework | NestJS 10+ |
| ORM | Prisma |
| DB | PostgreSQL |
| Auth | JWT + refresh tokens |
| Validation | class-validator + ValidationPipe |
| Testing | Jest + supertest |
| Deploy | Docker |

---

_Inspired by the NestJS skills from [kadajett/agent-nestjs-skills](https://github.com/kadajett/agent-nestjs-skills) and [giuseppe-trisciuoglio/developer-kit](https://github.com/giuseppe-trisciuoglio/developer-kit). Adapted to the Arcane format._
