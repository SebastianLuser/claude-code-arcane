# 1. Architecture (CRITICAL)

## 1.1 Avoid Circular Dependencies — CRITICAL

Causa #1 de crashes en runtime. `forwardRef()` es un parche, no una solución.

**Incorrecto** — A importa B, B importa A:
```ts
// users.service.ts → inyecta OrdersService
// orders.service.ts → inyecta UsersService  ⇒ ciclo
```
**Correcto** — extraer lo compartido a un tercer módulo o usar eventos:
```ts
// Mover la lógica común a SharedModule, o emitir un evento
this.eventEmitter.emit('order.created', payload);
```

## 1.2 Organize by Feature Modules — CRITICAL

Estructurar por feature, no por capa técnica → desarrollo 3-5x más rápido.

```
src/
  users/   { users.module.ts, users.controller.ts, users.service.ts, dto/ }
  orders/  { orders.module.ts, ... }
```
No: `controllers/`, `services/`, `repositories/` globales.

## 1.3 Proper Module Sharing — CRITICAL

Exportar servicios desde un módulo dedicado garantiza instancia singleton.

**Correcto:**
```ts
@Module({ providers: [UsersService], exports: [UsersService] })
export class UsersModule {}
// Otro módulo: imports: [UsersModule] → reusa la MISMA instancia
```
Re-declarar el provider en otro módulo crea una instancia nueva → estado inconsistente.

## 1.4 Single Responsibility for Services — CRITICAL

Un servicio = un concepto de dominio. +40% testabilidad. Si un servicio hace auth + email + billing, separarlo.

## 1.5 Event-Driven Architecture for Decoupling — MEDIUM-HIGH

Emitir eventos de dominio (`@nestjs/event-emitter`) para desacoplar módulos y permitir procesamiento async sin dependencias directas.

## 1.6 Repository Pattern for Data Access — HIGH

Encapsular queries en repositorios; separar lógica de negocio de la persistencia. El servicio depende de una abstracción `UserRepository`, no del ORM directamente.

_Ref: https://docs.nestjs.com/modules · https://docs.nestjs.com/fundamentals/circular-dependency_
