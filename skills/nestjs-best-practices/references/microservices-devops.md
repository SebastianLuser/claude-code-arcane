# 9. Microservices (MEDIUM) & 10. DevOps (LOW-MEDIUM)

## 9.1 Implement Health Checks — MEDIUM

Endpoints readiness/liveness con `@nestjs/terminus` para que el orquestador maneje la salud del servicio.
```ts
@Get('health') @HealthCheck()
check() { return this.health.check([() => this.db.pingCheck('db')]); }
```

## 9.2 Message and Event Patterns Correctly — MEDIUM

Distinguir request-response (`@MessagePattern`) de event-based (`@EventPattern`). Usar el patrón correcto según si se espera respuesta.

## 9.3 Use Message Queues for Background Jobs — MEDIUM

Offload de tareas largas a colas (`@nestjs/bull` / BullMQ) → no bloquear handlers de request.
```ts
await this.reportQueue.add('generate', { userId }); // responde rápido, procesa async
```

## 10.1 Implement Graceful Shutdown — MEDIUM

Escuchar SIGTERM, completar requests in-flight antes de salir.
```ts
app.enableShutdownHooks();
// onModuleDestroy() { await this.drainConnections(); }
```

## 10.2 Use ConfigModule for Environment Config — MEDIUM

Config por entorno vía `ConfigModule`, validada al boot. Nada hardcodeado.
```ts
ConfigModule.forRoot({ validationSchema: Joi.object({ DATABASE_URL: Joi.string().required() }) });
```

## 10.3 Use Structured Logging — LOW-MEDIUM

Logging JSON consistente (pino/winston) con `request_id`, `trace_id` para parseo/filtrado en producción.

_Ref: https://docs.nestjs.com/recipes/terminus · https://docs.nestjs.com/microservices/basics · https://docs.nestjs.com/techniques/configuration_
