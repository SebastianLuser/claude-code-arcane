# Anti-patterns — Fastify TS Scaffold

- No schema validation on routes (lose type safety and runtime checks)
- God routes with business logic inline (untestable)
- Missing centralized error handler (inconsistent error responses)
- No graceful shutdown handling (SIGTERM/SIGINT)
- `console.log` instead of pino structured logging
- Skipping env validation (runtime crashes on missing vars)
- Prisma client instantiated per-request instead of singleton
- Missing `.js` extensions in ESM imports
