---
name: performance
description: "Rate limiting and caching strategy for backend services."
category: "backend"
argument-hint: "[rate-limit|cache|full]"
user-invocable: true
allowed-tools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep"]
---
# performance — Rate Limiting & Caching Strategy

Stack: Fastify + Prisma + PostgreSQL + Redis + Zod + TypeScript.

## RATE LIMITING

**Default algorithm:** Sliding Window Counter. Three tiers required: CDN/WAF, API Gateway, App Middleware (Redis). Use `rate-limiter-flexible` with Redis.

> → Read references/rate-limit-config.md for algorithm comparison, implementation tiers, recommended limits per endpoint, key dimensions, response headers, and failure modes

## CACHING

**Rule Zero:** Before caching, profile. Caching hides problems a database index would solve. **Default pattern:** cache-aside. **Default invalidation:** short TTL.

> → Read references/cache-strategy.md for cache layer decision table, TTL strategy, patterns, stampede prevention, HTTP headers, and Redis key conventions

## ANTI-PATTERNS

> → Read references/anti-patterns.md for rate limiting (7 items) and caching (11 items) anti-patterns

## Checklist

- [ ] Algorithm matches use case; all three tiers covered
- [ ] Keys include user dimension; RateLimit-* headers + Retry-After on 429
- [ ] Fail-open default, fail-closed for sensitive endpoints
- [ ] Cache justified by profiling; TTL has explicit rationale
- [ ] Invalidation strategy documented; stampede protection on hot paths
- [ ] App works when Redis is down; hit/miss/eviction metrics exported
- [ ] Redis key naming follows `domain:entity:id:variant` convention
