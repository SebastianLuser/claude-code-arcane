---
name: caching-strategy
description: "Estrategia de caching multi-capa para apps Educabot (Go/TS/React): HTTP, CDN, Redis, in-memory, browser. Patterns, invalidation, TTLs, stampede protection. DO NOT TRIGGER when: invalidar cache manualmente en Redis ya configurado, operaciones redis-cli puntuales."
argument-hint: "[layer: http|cdn|redis|memory|browser]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# caching-strategy — Multi-Layer Caching

**Regla 0:** antes de cachear, medí. Cachear sin profiling esconde problemas.

## Cuándo usar / NO usar

| Usar | NO usar |
|------|---------|
| Hot path lectura >> escritura | Write-heavy con lectura impredecible |
| Query cara sin índices posibles | Info financiera/regulatoria (staleness = daño legal) |
| Respuesta inmutable o slow-changing | Parche de query mal diseñada (arreglá la query) |
| Alivio DB bajo carga | Prematuramente (primero índices) |

## Capas

```
Browser/RN → CDN → API Gateway → App in-memory (LRU) → Redis → Database
```

Cada capa: TTL distinto, invalidation distinta. Más cerca del usuario = más caché pero más difícil invalidar.

## Qué cachear dónde

| Dato | Cache |
|------|-------|
| Assets estáticos (JS, CSS, img) | CDN + browser (immutable + versioned URLs) |
| API responses públicas | CDN + Redis |
| API responses por-user | Redis + cliente |
| Session/token, rate limit counters | Redis |
| Traducciones / config | In-memory warm on boot |
| DB query resultado | Redis (cache-aside) |

## HTTP Caching Headers

| Header | Uso |
|--------|-----|
| `public, max-age=31536000, immutable` | Assets versionados (hash en URL) |
| `public, s-maxage=300, stale-while-revalidate=3600` | API listado semi-estático |
| `private, no-store` | Response con PII |

- ETag + `If-None-Match` → 304 Not Modified. `Vary: Accept-Encoding, Authorization`

## Patterns

| Pattern | Cómo | Pros | Cons |
|---------|------|------|------|
| **Cache-aside** (lazy) | App: check cache → miss → DB → write cache | Simple, resiliente | Miss penalty, stampede |
| **Write-through** | App escribe a cache + DB | Cache siempre fresco | Escrituras lentas |
| **Read-through** | Cache busca en DB si miss | Limpio para el cliente | Menos común en apps |
| **Write-behind** | App → cache; worker → DB | Rápido | Riesgo pérdida datos (solo analytics) |

## Invalidation

| Estrategia | Cuándo |
|------------|--------|
| **TTL corto** (1-5 min) | **Default** si se puede aceptar stale |
| **Invalidate on write** | TTL no alcanza, delete keys en write |
| **Event-driven** (pub/sub) | Cache local multi-pod |
| **Versioning** (key con vN) | Bump versión = keys viejas expiran solas |

## Stampede Protection

- **Go:** `golang.org/x/sync/singleflight` — solo 1 goroutine carga, las otras esperan
- **Redis lock:** `SET NX` con TTL, quien no obtiene lock espera y relee
- **stale-while-revalidate:** servir stale, refrescar en background

## TTL Defaults

| Tipo | TTL |
|------|-----|
| Assets versionados | 1 año (immutable) |
| Lista cursos público | 5 min |
| Detalle curso | 1 min |
| Perfil usuario | 5 min (invalidate on write) |
| Config/feature flags | 30 seg |
| Rate limit counters | ventana exacta |
| Respuesta LLM/IA | horas a días (según costo) |

## Redis

- Cluster managed (Memorystore/ElastiCache), separar por propósito: cache (allkeys-lru) / session (noeviction) / queue
- Key naming: `<domain>:<entity>:<id>:<variant>` — pattern-based purge
- Serialización: JSON default, MessagePack si latencia importa

## Cliente (React/RN)

- TanStack Query: `staleTime`, `gcTime`, `invalidateQueries` on mutation
- RN: AsyncStorage persister para offline-first
- PWA: Service Worker — assets CacheFirst, API NetworkFirst

## Anti-patterns

- Cachear sin medir, TTL infinito sin invalidation, cachear PII sin `no-store`
- Cachear errores (404/500), cache que falla → app cae (cache debe ser opcional)
- `KEYS *` en Redis prod (usar SCAN), cache sin namespace, per-user en CDN sin Vary
- Sin métricas de hit rate

## Observabilidad

- Métricas: `cache_hits/misses_total`, `cache_latency_seconds`, `cache_evictions_total`
- Hit rate target: hot >90%, warm >70%. Hit rate <50% sostenido = cache no vale
- Alertas: evictions creciente, latency p99 >10ms, hit rate cae súbitamente

## Checklist

- [ ] Profiling justifica el cache
- [ ] Capa correcta elegida (browser/CDN/Redis/memoria)
- [ ] TTL razonado con trade-off staleness vs carga
- [ ] Invalidation strategy clara
- [ ] Stampede protection si hot path
- [ ] Cache opcional — app funciona si Redis down
- [ ] Headers HTTP correctos (`private` para PII, `Vary`)
- [ ] Key naming consistente + namespace
- [ ] Métricas: hits/misses/latency/evictions
- [ ] No cacheamos errores
