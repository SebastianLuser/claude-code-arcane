# 7. Database & ORM (MEDIUM-HIGH)

## 7.1 Avoid N+1 Query Problems — HIGH

The silent performance killer. Eager loading with relations or joins.

**Incorrect** — 1 query + N queries in a loop:
```ts
const orders = await this.orderRepo.find();
for (const o of orders) o.user = await this.userRepo.findOne(o.userId); // N+1
```
**Correct:**
```ts
// Prisma
prisma.order.findMany({ include: { user: true } });
// TypeORM
this.orderRepo.find({ relations: ['user'] });
```

## 7.3 Use Transactions for Multi-Step Operations — MEDIUM-HIGH

Dependent operations in one transaction → consistency on failure.
```ts
await this.prisma.$transaction(async (tx) => {
  await tx.account.update({ where: { id: from }, data: { balance: { decrement: amt } } });
  await tx.account.update({ where: { id: to },   data: { balance: { increment: amt } } });
});
```

## 7.2 Use Database Migrations — MEDIUM-HIGH

Version schema changes with migrations. **Never `synchronize: true` in production** (it can delete data).
```ts
TypeOrmModule.forRoot({ synchronize: false, migrationsRun: true });
```

_Ref: https://docs.nestjs.com/techniques/database · https://www.prisma.io/docs/orm/prisma-migrate_
