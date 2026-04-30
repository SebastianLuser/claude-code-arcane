---
name: caching-strategy
description: "Multi-layer caching: HTTP, CDN, Redis, in-memory, browser. Invalidation, TTLs, stampede protection."
category: "backend"
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

> → Read references/http-headers.md for header values and ETag usage

## Patterns, Invalidation & Stampede Protection

> → Read references/patterns-and-invalidation.md for cache-aside/write-through/read-through patterns, invalidation strategies, and stampede protection

## TTL Defaults

> → Read references/ttl-defaults.md for recommended TTLs by data type

## Redis & Client-Side

> → Read references/redis-and-client.md for Redis cluster config, key naming, and React/RN client caching

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
