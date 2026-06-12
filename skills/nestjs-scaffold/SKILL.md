---
name: nestjs-scaffold
description: "Scaffold de API NestJS production-ready con módulos por feature, DI, ValidationPipe global, Prisma/Drizzle, guards de auth y testing. Usar para iniciar un backend NestJS nuevo."
category: "backend"
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# nestjs-scaffold — NestJS API Scaffolder

## MANDATORY WORKFLOW

**Antes de generar cualquier código, completar estos pasos en orden.**

### Step 0: Gather Requirements
1. **Nombre del servicio** (kebab-case)
2. **Transport:** REST (default) / GraphQL / microservicio
3. **ORM:** Prisma (default) / Drizzle / TypeORM
4. **DB:** PostgreSQL (default) / MySQL
5. **Auth:** JWT + refresh (default) / OAuth / ninguna
6. **Deploy:** Docker (default) / Railway / AWS ECS

### Step 1: Crear base
```bash
npm i -g @nestjs/cli
nest new <name> --package-manager pnpm
cd <name>
nest g module users && nest g controller users && nest g service users
```

### Step 2: Estructura (feature modules — NO por capa)
```
src/
  users/   { users.module.ts, users.controller.ts, users.service.ts, dto/, entities/ }
  auth/    { auth.module.ts, jwt.strategy.ts, guards/, decorators/ }
  common/  { filters/, interceptors/, pipes/ }
  config/  { config.module.ts, env.validation.ts }
  main.ts
```

### Step 3: Bootstrap no negociable (`main.ts`)
```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
app.useGlobalFilters(new AllExceptionsFilter());
app.enableShutdownHooks();           // graceful shutdown
app.enableVersioning({ type: VersioningType.URI });
```

### Step 4: Defaults
- Constructor injection siempre; cero `ModuleRef.get()` en runtime
- DTOs decorados (`class-validator`) en todos los endpoints
- Guards declarativos para auth/authz
- `ConfigModule` con validación de env (Joi/Zod) al boot
- Migraciones versionadas, `synchronize: false`
- Health check (`@nestjs/terminus`) + structured logging (pino)
- Tests: `Test.createTestingModule` (unit) + supertest (e2e)

### Step 5: Verificar
`npm run build` + `npm run test`. Revisar contra la rule `nestjs-code` y el skill `nestjs-best-practices`. Build + tests verdes → scaffold **READY**.

## Stack Defaults

| Componente | Default |
|------------|---------|
| Framework | NestJS 10+ |
| ORM | Prisma |
| DB | PostgreSQL |
| Auth | JWT + refresh tokens |
| Validación | class-validator + ValidationPipe |
| Testing | Jest + supertest |
| Deploy | Docker |

---

_Inspirado en las skills NestJS de [kadajett/agent-nestjs-skills](https://github.com/kadajett/agent-nestjs-skills) y [giuseppe-trisciuoglio/developer-kit](https://github.com/giuseppe-trisciuoglio/developer-kit). Adaptado al formato Arcane._
