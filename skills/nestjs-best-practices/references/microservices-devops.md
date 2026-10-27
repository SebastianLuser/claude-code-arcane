# 9. Microservices (MEDIUM) & 10. DevOps (LOW-MEDIUM)

## 9.1 Implement Health Checks — MEDIUM

Readiness/liveness endpoints with `@nestjs/terminus` so the orchestrator manages the service's health.
```ts
@Get('health') @HealthCheck()
check() { return this.health.check([() => this.db.pingCheck('db')]); }
```

## 9.2 Message and Event Patterns Correctly — MEDIUM

Tell request-response (`@MessagePattern`) apart from event-based (`@EventPattern`). Use the right pattern depending on whether a response is expected.

## 9.3 Use Message Queues for Background Jobs — MEDIUM

Offload long tasks to queues (`@nestjs/bull` / BullMQ) → do not block request handlers.
```ts
await this.reportQueue.add('generate', { userId }); // responds fast, processes async
```

## 10.1 Implement Graceful Shutdown — MEDIUM

Listen for SIGTERM, finish in-flight requests before exiting.
```ts
app.enableShutdownHooks();
// onModuleDestroy() { await this.drainConnections(); }
```

## 10.2 Use ConfigModule for Environment Config — MEDIUM

Per-environment config via `ConfigModule`, validated at boot. Nothing hardcoded.
```ts
ConfigModule.forRoot({ validationSchema: Joi.object({ DATABASE_URL: Joi.string().required() }) });
```

## 10.3 Use Structured Logging — LOW-MEDIUM

Consistent JSON logging (pino/winston) with `request_id`, `trace_id` for parsing/filtering in production.

_Ref: https://docs.nestjs.com/recipes/terminus · https://docs.nestjs.com/microservices/basics · https://docs.nestjs.com/techniques/configuration_
