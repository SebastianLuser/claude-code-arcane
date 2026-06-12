---
paths:
  - "src/**/*.ts"
  - "**/*.module.ts"
  - "**/*.controller.ts"
  - "**/*.service.ts"
  - "**/*.guard.ts"
  - "**/*.pipe.ts"
  - "**/*.interceptor.ts"
  - "**/*.dto.ts"
  - "apps/**"
  - "libs/**"
---

# NestJS Code Rules

Reglas production-ready para NestJS, ordenadas por impacto. Catálogo completo (40 reglas, 10 categorías) + ejemplos incorrecto/correcto: skill `nestjs-best-practices`.

## CRITICAL — Arquitectura & DI

- **Cero dependencias circulares entre módulos** — causa #1 de crashes en runtime. Si aparece `forwardRef()`, es señal de mal diseño: refactorizar.
- **Organizar por feature modules**, no por capas técnicas (`users/`, no `controllers/` + `services/` globales).
- **Exportar servicios desde módulos dedicados** para garantizar instancias singleton y evitar estado inconsistente.
- **Single Responsibility por servicio** — un servicio = un concepto de dominio.
- **Constructor injection siempre.** Nunca `ModuleRef.get()` en runtime (service locator anti-pattern). Dependencias explícitas, tipadas, testeables.
- **Provider scopes**: `DEFAULT` (singleton) por defecto; `REQUEST` scope solo cuando se necesita contexto de request (tiene costo de performance).
- **Injection tokens (símbolos o abstract classes) para interfaces** — las interfaces de TS no existen en runtime.

## HIGH — Error handling & Security

- **Servicios lanzan `HttpException` subclasses**, no retornan objetos de error.
- **Manejar errores async explícitamente** — fire-and-forget y background tasks deben atrapar errores (no unhandled rejections).
- **Exception filters** para formato de respuesta de error centralizado y consistente.
- **`ValidationPipe` global + DTOs decorados** — rechazar input malformado antes de procesarlo. `whitelist: true`, `forbidNonWhitelisted: true`.
- **Guards declarativos para auth/authz**, no chequeos manuales en cada handler.
- **JWT seguro**: tokens de vida corta + refresh tokens, secretos en env/secret manager, nunca data sensible en el payload.
- **Rate limiting con `@nestjs/throttler`**, límites por endpoint.
- **Sanitizar output** (XSS) y setear `Content-Type` correcto.

## HIGH — Performance & Data

- **Evitar N+1**: eager loading con relations o joins de QueryBuilder.
- **Optimizar queries**: seleccionar solo columnas necesarias, índices apropiados, no over-fetch de relaciones.
- **Caching estratégico** con TTL apropiado e invalidación basada en eventos.
- **Transacciones para operaciones multi-step** dependientes (consistencia ante fallos).
- **Migraciones versionadas** — nunca `synchronize: true` en producción.
- **Async lifecycle hooks** retornan promesas; constructores síncronos (no bloquear el arranque).

## MEDIUM — API, Microservices, DevOps

- **DTOs + serialización** (`ClassSerializerInterceptor`) para respuestas — controlar exposición, evitar referencias circulares.
- **Interceptors para cross-cutting concerns** (logging, transformación, formato de respuesta).
- **Pipes para transformación/validación** de input.
- **API versioning** para cambios breaking.
- **Health checks** (readiness/liveness) para orquestadores.
- **Message queues para jobs largos** — no bloquear handlers de request.
- **Graceful shutdown**: escuchar SIGTERM, drenar requests in-flight antes de salir.
- **`ConfigModule` para configuración** por entorno — nada hardcodeado.
- **Structured logging (JSON)** para parseo/filtrado en producción.

## Anti-Patterns

- `forwardRef()` para parchear dependencias circulares en vez de rediseñar
- Lógica de negocio en controllers (solo parsean input, llaman service, dan shape a la respuesta)
- `synchronize: true` contra una DB de producción
- `ModuleRef.get()` / service locator en runtime
- Validación manual de input en cada handler en vez de `ValidationPipe` + DTO
- Devolver entidades de ORM crudas como respuesta HTTP
- `REQUEST` scope sin necesidad real (penaliza performance)

---

_Derivado de [kadajett/agent-nestjs-skills](https://github.com/kadajett/agent-nestjs-skills) (nestjs-best-practices). Condensado al formato Arcane._
