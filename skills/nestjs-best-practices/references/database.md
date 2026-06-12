# 7. Database & ORM (MEDIUM-HIGH)

## 7.1 Avoid N+1 Query Problems — HIGH

El asesino silencioso de performance. Eager loading con relations o joins.

**Incorrecto** — 1 query + N queries en loop:
```ts
const orders = await this.orderRepo.find();
for (const o of orders) o.user = await this.userRepo.findOne(o.userId); // N+1
```
**Correcto:**
```ts
// Prisma
prisma.order.findMany({ include: { user: true } });
// TypeORM
this.orderRepo.find({ relations: ['user'] });
```

## 7.3 Use Transactions for Multi-Step Operations — MEDIUM-HIGH

Operaciones dependientes en una transacción → consistencia ante fallos.
```ts
await this.prisma.$transaction(async (tx) => {
  await tx.account.update({ where: { id: from }, data: { balance: { decrement: amt } } });
  await tx.account.update({ where: { id: to },   data: { balance: { increment: amt } } });
});
```

## 7.2 Use Database Migrations — MEDIUM-HIGH

Versionar cambios de schema con migraciones. **Nunca `synchronize: true` en producción** (puede borrar datos).
```ts
TypeOrmModule.forRoot({ synchronize: false, migrationsRun: true });
```

_Ref: https://docs.nestjs.com/techniques/database · https://www.prisma.io/docs/orm/prisma-migrate_
