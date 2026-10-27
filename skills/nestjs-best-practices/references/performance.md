# 5. Performance (HIGH)

## 5.3 Optimize Database Queries — HIGH

Select only the needed columns, appropriate indexes, no over-fetching of relations.
```ts
// Prisma: explicit select instead of fetching the whole row + relations
prisma.user.findMany({ select: { id: true, email: true } });
```

## 5.4 Use Caching Strategically — HIGH

Cache expensive operations with an appropriate TTL and event-based invalidation.
```ts
@UseInterceptors(CacheInterceptor)
@CacheTTL(30)
@Get('stats') getStats() { /* ... */ }
```

## 5.1 Async Lifecycle Hooks Correctly — HIGH

Return promises from async hooks; synchronous constructors (do not block startup).
```ts
async onModuleInit() { await this.warmupCache(); } // ✓
// constructor(){ await ... }  ✗ not allowed / blocks
```

## 5.2 Lazy Loading for Large Modules — MEDIUM

Defer initialization of rarely used modules with `LazyModuleLoader` → lower startup time and memory.

_Ref: https://docs.nestjs.com/techniques/caching · https://docs.nestjs.com/fundamentals/lazy-loading-modules_
