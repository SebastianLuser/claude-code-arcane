---
name: caching-strategy
description: "Multi-layer caching: HTTP, CDN, Redis, in-memory, browser. Invalidation, TTLs, stampede protection."
category: "backend"
argument-hint: "[layer: http|cdn|redis|memory|browser]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# caching-strategy — Multi-Layer Caching

**Rule 0:** measure before you cache. Caching without profiling hides problems.

## When to use / NOT use

| Use | Do NOT use |
|------|---------|
| Hot path with reads >> writes | Write-heavy with unpredictable reads |
| Expensive query with no possible indexes | Financial/regulatory info (staleness = legal damage) |
| Immutable or slow-changing response | Patch for a badly designed query (fix the query) |
| DB relief under load | Prematurely (indexes first) |

## Layers

```
Browser/RN → CDN → API Gateway → App in-memory (LRU) → Redis → Database
```

Each layer: a different TTL, a different invalidation. Closer to the user = more caching but harder to invalidate.

## What to cache where

| Data | Cache |
|------|-------|
| Static assets (JS, CSS, img) | CDN + browser (immutable + versioned URLs) |
| Public API responses | CDN + Redis |
| Per-user API responses | Redis + client |
| Session/token, rate limit counters | Redis |
| Translations / config | In-memory warm on boot |
| DB query result | Redis (cache-aside) |

## HTTP Caching Headers

> → Read references/http-headers.md for header values and ETag usage

## Patterns, Invalidation & Stampede Protection

> → Read references/patterns-and-invalidation.md for cache-aside/write-through/read-through patterns, invalidation strategies, and stampede protection

## TTL Defaults

> → Read references/ttl-defaults.md for recommended TTLs by data type

## Redis & Client-Side

> → Read references/redis-and-client.md for Redis cluster config, key naming, and React/RN client caching

## Anti-patterns

- Caching without measuring, infinite TTL without invalidation, caching PII without `no-store`
- Caching errors (404/500), cache fails → app goes down (the cache must be optional)
- `KEYS *` on prod Redis (use SCAN), cache without a namespace, per-user on a CDN without Vary
- No hit rate metrics

## Observability

- Metrics: `cache_hits/misses_total`, `cache_latency_seconds`, `cache_evictions_total`
- Hit rate target: hot >90%, warm >70%. Sustained hit rate <50% = the cache is not worth it
- Alerts: growing evictions, latency p99 >10ms, hit rate drops suddenly

## Checklist

- [ ] Profiling justifies the cache
- [ ] Correct layer chosen (browser/CDN/Redis/memory)
- [ ] TTL reasoned with the staleness vs. load trade-off
- [ ] Clear invalidation strategy
- [ ] Stampede protection if hot path
- [ ] Optional cache — the app works if Redis is down
- [ ] Correct HTTP headers (`private` for PII, `Vary`)
- [ ] Consistent key naming + namespace
- [ ] Metrics: hits/misses/latency/evictions
- [ ] We do not cache errors
