# 1. Architecture (CRITICAL)

## 1.1 Avoid Circular Dependencies — CRITICAL

The #1 cause of runtime crashes. `forwardRef()` is a patch, not a solution.

**Incorrect** — A imports B, B imports A:
```ts
// users.service.ts → injects OrdersService
// orders.service.ts → injects UsersService  ⇒ cycle
```
**Correct** — extract the shared part into a third module or use events:
```ts
// Move the shared logic to SharedModule, or emit an event
this.eventEmitter.emit('order.created', payload);
```

## 1.2 Organize by Feature Modules — CRITICAL

Structure by feature, not by technical layer → 3-5x faster development.

```
src/
  users/   { users.module.ts, users.controller.ts, users.service.ts, dto/ }
  orders/  { orders.module.ts, ... }
```
Not: global `controllers/`, `services/`, `repositories/`.

## 1.3 Proper Module Sharing — CRITICAL

Exporting services from a dedicated module guarantees a singleton instance.

**Correct:**
```ts
@Module({ providers: [UsersService], exports: [UsersService] })
export class UsersModule {}
// Another module: imports: [UsersModule] → reuses the SAME instance
```
Re-declaring the provider in another module creates a new instance → inconsistent state.

## 1.4 Single Responsibility for Services — CRITICAL

One service = one domain concept. +40% testability. If a service does auth + email + billing, split it.

## 1.5 Event-Driven Architecture for Decoupling — MEDIUM-HIGH

Emit domain events (`@nestjs/event-emitter`) to decouple modules and allow async processing without direct dependencies.

## 1.6 Repository Pattern for Data Access — HIGH

Encapsulate queries in repositories; separate business logic from persistence. The service depends on a `UserRepository` abstraction, not on the ORM directly.

_Ref: https://docs.nestjs.com/modules · https://docs.nestjs.com/fundamentals/circular-dependency_
