---
name: scaffold-fastify-ts
description: "Scaffold de backend TypeScript con Fastify, Prisma, Zod, testing. Stack alternativo al Go de Educabot cuando el proyecto requiere TS. Usar para nuevos servicios Node/TS."
---

# scaffold-fastify-ts — TypeScript Backend Scaffolder

Genera un backend TypeScript production-ready con **Fastify** como framework HTTP. Alineado con el stack permitido en Educabot (Go + TypeScript only).

## Cuándo usar

- Nuevo servicio backend en TypeScript
- API que consume frontend React/Vite
- Microservicio que necesita arrancar rápido con tipos end-to-end
- Cuando Go no es la mejor opción (ej. necesitás npm ecosystem, WebSockets complejos, SSR)

## Por qué Fastify (vs Express / NestJS)

- **Fastify**: rápido, schema-first con Zod, low overhead — default recomendado
- **NestJS**: si necesitás DI heavy, decoradores, convenciones estilo Angular — preguntar antes
- **Express**: solo para compatibilidad con libs legacy

## Stack por defecto

- **Node.js 20+ LTS**
- **Fastify 4+**
- **TypeScript** strict mode + `tsx` para dev
- **Zod** + **fastify-type-provider-zod** (schema-first con types inferidos)
- **Prisma** (PostgreSQL default) o **Drizzle** (si preferís SQL-first)
- **@fastify/jwt** / **@fastify/cookie** / **@fastify/cors** / **@fastify/helmet**
- **pino** (logger, built-in Fastify)
- **Vitest** + **supertest** para tests
- **ESLint** + **Prettier** + **Husky** + **lint-staged**
- **Docker** + **docker-compose** para local dev

## Preguntas previas

1. **Nombre del servicio** (kebab-case)
2. **Base de datos**: PostgreSQL / MySQL / SQLite / MongoDB
3. **ORM**: Prisma (default) / Drizzle / raw SQL
4. **Auth**: JWT / Session cookies / OAuth (Google Educabot SSO?)
5. **Deploy target**: Docker / Vercel / AWS ECS / Railway
6. **¿Consume este backend el frontend Alizia/Tuni?** (para CORS + tipos compartidos)

## Estructura generada

```
<service>/
├── src/
│   ├── server.ts              # entrypoint
│   ├── app.ts                 # Fastify app builder (testeable)
│   ├── config/
│   │   ├── env.ts             # Zod schema para env vars
│   │   └── plugins.ts         # register plugins
│   ├── modules/
│   │   └── <feature>/
│   │       ├── routes.ts      # Fastify routes
│   │       ├── service.ts     # business logic
│   │       ├── repository.ts  # DB access
│   │       ├── schema.ts      # Zod schemas
│   │       └── <feature>.test.ts
│   ├── lib/
│   │   ├── db.ts              # Prisma client
│   │   ├── errors.ts          # error classes
│   │   └── logger.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── error-handler.ts
│   └── types/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── setup.ts
│   └── integration/
├── .env.example
├── .eslintrc.cjs
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

## Pasos de scaffolding

### 1. Init proyecto
```bash
mkdir <service> && cd <service>
npm init -y
npm pkg set type=module
```

### 2. Deps core
```bash
npm i fastify @fastify/cors @fastify/helmet @fastify/jwt @fastify/cookie \
  @fastify/sensible @fastify/swagger @fastify/swagger-ui \
  fastify-type-provider-zod \
  zod \
  @prisma/client \
  pino-pretty
```

### 3. Dev deps
```bash
npm i -D typescript tsx @types/node \
  prisma \
  vitest @vitest/coverage-v8 supertest @types/supertest \
  eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  prettier husky lint-staged \
  dotenv
```

### 4. `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/**/*"]
}
```

### 5. `src/app.ts` (app builder)
```ts
import Fastify from "fastify";
import { ZodError } from "zod";
import { serializerCompiler, validatorCompiler, ZodTypeProvider }
  from "fastify-type-provider-zod";

export async function buildApp() {
  const app = Fastify({
    logger: { transport: { target: "pino-pretty" } },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(import("@fastify/cors"), { origin: true, credentials: true });
  await app.register(import("@fastify/helmet"));
  await app.register(import("@fastify/sensible"));

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) {
      return reply.status(400).send({ error: "VALIDATION", issues: err.issues });
    }
    req.log.error(err);
    return reply.status(500).send({ error: "INTERNAL" });
  });

  // register routes por módulo
  await app.register(import("./modules/health/routes.js"));

  return app;
}
```

### 6. `src/server.ts`
```ts
import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = await buildApp();
await app.listen({ port: env.PORT, host: "0.0.0.0" });
```

### 7. `src/config/env.ts`
```ts
import { z } from "zod";
import "dotenv/config";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

export const env = schema.parse(process.env);
```

### 8. Módulo de ejemplo — `modules/health/routes.ts`
```ts
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

const plugin: FastifyPluginAsyncZod = async (app) => {
  app.get("/health", {
    schema: { response: { 200: z.object({ ok: z.boolean() }) } },
  }, async () => ({ ok: true }));
};

export default plugin;
```

### 9. Prisma setup
```bash
npx prisma init --datasource-provider postgresql
```

`src/lib/db.ts`:
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

### 10. Tests
`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    coverage: { reporter: ["text", "html"] },
  },
});
```

Test de integración usando `buildApp()` + `app.inject()` (no necesita levantar puerto).

### 11. Docker
`Dockerfile` multi-stage (builder + runtime con `node:20-alpine`).
`docker-compose.yml` con Postgres + el servicio.

### 12. Scripts `package.json`
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src/",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate"
  }
}
```

### 13. `.env.example`
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
JWT_SECRET=change-me-to-a-long-random-string-32-chars
```

## Convenciones

- **Modular por feature** (`modules/users/`, `modules/orders/`) — no por tipo (`controllers/`, `services/`)
- **Zod schemas co-located** con las routes
- **Service layer** separado de routes: routes delgadas, lógica en `service.ts`
- **Repository pattern** para DB access (permite mockear en tests)
- **Error handling centralizado** en setErrorHandler
- **Logs estructurados** con pino (nunca `console.log`)
- **Imports con extensión `.js`** (ESM requirement con NodeNext)
- **Ningún commit sin tests** para lógica nueva

## Integración con Alizia/Tuni

Si el backend va a consumir un frontend Alizia/Tuni:
- CORS: permitir origin del frontend (`http://localhost:5173` en dev)
- Cookies con `SameSite=Lax` y `Secure` en prod
- Generar OpenAPI spec con `@fastify/swagger` para tipos compartidos

## Output final

```
✅ Servicio creado en ./<service>
✅ Fastify + Zod schema-first configurado
✅ Prisma listo (falta DATABASE_URL)
✅ Docker compose con Postgres
✅ Tests con Vitest + supertest

Próximos pasos:
  cd <service>
  cp .env.example .env
  docker compose up -d db
  npm run db:migrate
  npm run dev  # http://localhost:3000
```

## Delegación

**Coordinar con:** `backend-architect`, `api-architect`, `database-architect`
**Reporta a:** `vp-engineering`
