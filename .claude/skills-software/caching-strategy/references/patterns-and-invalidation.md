# Caching Patterns & Invalidation

## Patterns

| Pattern | Como | Pros | Cons |
|---------|------|------|------|
| **Cache-aside** (lazy) | App: check cache -> miss -> DB -> write cache | Simple, resiliente | Miss penalty, stampede |
| **Write-through** | App escribe a cache + DB | Cache siempre fresco | Escrituras lentas |
| **Read-through** | Cache busca en DB si miss | Limpio para el cliente | Menos comun en apps |
| **Write-behind** | App -> cache; worker -> DB | Rapido | Riesgo perdida datos (solo analytics) |

## Invalidation

| Estrategia | Cuando |
|------------|--------|
| **TTL corto** (1-5 min) | **Default** si se puede aceptar stale |
| **Invalidate on write** | TTL no alcanza, delete keys en write |
| **Event-driven** (pub/sub) | Cache local multi-pod |
| **Versioning** (key con vN) | Bump version = keys viejas expiran solas |

## Stampede Protection

- **Go:** `golang.org/x/sync/singleflight` — solo 1 goroutine carga, las otras esperan
- **Redis lock:** `SET NX` con TTL, quien no obtiene lock espera y relee
- **stale-while-revalidate:** servir stale, refrescar en background
