# Key Decisions — Fastify TS Scaffold

## Organization
- **Modular by feature** (`modules/users/`, `modules/orders/`) — never by type (`controllers/`, `services/`)
- **Repository pattern** for DB access — enables mocking in tests
- **Thin routes, thick services** — routes handle HTTP, services handle logic

## Fastify Plugin Pattern
- Use `withTypeProvider<ZodTypeProvider>()` for schema-first validation
- Set `validatorCompiler` + `serializerCompiler` from fastify-type-provider-zod
- Register plugins via `app.register()` with encapsulation (scoped decorators)
- Autoload modules or explicitly register each module plugin

## Config Management
- Validate all env vars at startup with Zod schema — fail fast on missing config
- Use @fastify/env or direct `z.parse(process.env)` in `config/env.ts`
- Required vars: NODE_ENV, PORT, DATABASE_URL, JWT_SECRET (min 32 chars)

## TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`
- Module: `NodeNext` — imports require `.js` extension (ESM requirement)
- Path alias `@/*` mapping to `./src/*`

## Error Handling
- Centralized `setErrorHandler` on app — ZodError maps to 400, everything else 500
- Custom error classes extending Fastify's httpErrors (@fastify/sensible)
- Never expose stack traces in production
