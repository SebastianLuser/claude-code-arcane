# 5. Performance (HIGH)

## 5.3 Optimize Database Queries — HIGH

Seleccionar solo columnas necesarias, índices apropiados, no over-fetch de relaciones.
```ts
// Prisma: select explícito en vez de traer la fila entera + relaciones
prisma.user.findMany({ select: { id: true, email: true } });
```

## 5.4 Use Caching Strategically — HIGH

Cachear operaciones caras con TTL apropiado e invalidación basada en eventos.
```ts
@UseInterceptors(CacheInterceptor)
@CacheTTL(30)
@Get('stats') getStats() { /* ... */ }
```

## 5.1 Async Lifecycle Hooks Correctly — HIGH

Retornar promesas de hooks async; constructores síncronos (no bloquear el arranque).
```ts
async onModuleInit() { await this.warmupCache(); } // ✓
// constructor(){ await ... }  ✗ no se puede / bloquea
```

## 5.2 Lazy Loading for Large Modules — MEDIUM

Diferir inicialización de módulos poco usados con `LazyModuleLoader` → menor tiempo de arranque y memoria.

_Ref: https://docs.nestjs.com/techniques/caching · https://docs.nestjs.com/fundamentals/lazy-loading-modules_
