---
name: performance
description: "Rate limiting and caching strategy for backend services"
argument-hint: "[rate-limit|cache|full]"
user-invocable: true
allowed-tools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep"]
---
# performance — Rate Limiting & Caching Strategy

Stack: Fastify + Prisma + PostgreSQL + Redis + Zod + TypeScript.

## RATE LIMITING

| Algorithm | Best For | Trade-off |
|-----------|----------|-----------|
| **Fixed Window** | Daily/monthly quotas | 2x burst at window boundary |
| **Sliding Window Counter** | **Default** — most endpoints | ~10% approximation error |
| **Token Bucket** | APIs where burst is useful | More config tuning |
| **Leaky Bucket** | Smooth output (uploads) | No burst tolerance |

### Implementation Tiers (all three required)

| Tier | Scope | Catches |
|------|-------|---------|
| CDN / WAF | Global, L4-L7 | DDoS, bot challenges |
| API Gateway / Ingress | Per-IP crude | Volumetric abuse pre-auth |
| App Middleware (Redis) | Per-user, per-endpoint, per-plan | Authenticated abuse, plan limits |

### Key Dimensions

`ip:<ip>` (unauth), `user:<userId>` (default auth), `endpoint:<route>:<userId>` (expensive), `action:<name>:<id>` (login/signup), `tenant:<orgId>` (multi-tenant). Combine when needed: `action:login:ip:<ip>` + `action:login:email:<email>`.

### Recommended Limits

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| POST /auth/login | 5 | 15min | ip + email |
| POST /auth/signup | 3 | 1h | ip |
| POST /auth/forgot-password | 3 | 1h | email |
| Authenticated API | 1000 | 1min | user |
| Anonymous API | 60 | 1min | ip |
| Exports/reports | 10 | 1h | user |
| LLM/AI endpoints | 30 | 1min | user + tenant |

Start permissive, tighten with evidence. Use `rate-limiter-flexible` with Redis.

### Response: always include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`. On 429: add `Retry-After` (seconds), RFC 7807 problem+json body.

### Fail-open default (allow all if Redis down). Fail-closed only for auth/payment/admin. Emit metric + alert on limiter failure.

### Abuse: rate limit login by email (not just IP) for distributed brute force. Combine with temporary lockout. Escalate sustained 429 clusters to SIEM.

## CACHING

### Rule Zero: Before caching, profile. Caching hides problems a database index would solve.

### Cache Layer Decision

| Data Type | Layer |
|-----------|-------|
| Static assets | CDN + browser (immutable + versioned URLs) |
| Public API responses | CDN + Redis (cache-aside, `s-maxage`) |
| Per-user API responses | Redis + client (cache-aside, `private`) |
| Config / feature flags | In-memory LRU (warm on boot, 30s TTL) |
| DB query results | Redis (cache-aside) |
| Sessions / tokens | Redis no-eviction (dedicated instance) |

### Patterns: **cache-aside** (default — app checks cache, miss->DB->write cache), read-through (CDN/proxy), write-through (always fresh), write-behind (metrics only, data loss risk).

### TTL Strategy

| Data | TTL | Rationale |
|------|-----|-----------|
| Versioned assets | 1 year | URL changes on content change |
| Public listings | 5 min | Acceptable staleness |
| Entity detail | 1 min | Editable by users |
| User profile | 5 min | Invalidate on write |
| Config / flags | 30 sec | Fast visibility |

### Invalidation: default to **short TTL**. Add explicit invalidation (delete on write, event-driven pub/sub, versioned keys) only when TTL is insufficient.

### Stampede Prevention: single-flight/mutex (one request loads, others wait), distributed lock (Redis SETNX), early probabilistic refresh, stale-while-revalidate.

### HTTP Headers: versioned assets (`public, max-age=31536000, immutable`), public API (`public, s-maxage=300, stale-while-revalidate=3600`), per-user/PII (`private, no-store`), must-revalidate (`no-cache` + ETag).

### Redis: key format `<domain>:<entity>:<id>:<variant>`. Separate instances: cache (allkeys-lru), session (noeviction), queue.

## ANTI-PATTERNS

**Rate Limiting:** client-only limiting (bypassed), in-memory counters on multi-pod (unsynchronized), no user dimension in key, no limit on signup/forgot-password, 429 without Retry-After, retries without jitter, fail-closed everywhere.

**Caching:** caching without profiling, infinite TTL without invalidation, caching PII without `private, no-store`, caching errors, cache failure crashes app, `KEYS *` in prod (use SCAN), no namespace in keys, per-user in CDN without `Vary`, no hit/miss metrics, mutable auth data with long TTL, sessions in app memory.

## REVIEW CHECKLIST

- [ ] Algorithm matches use case; all three tiers covered
- [ ] Keys include user dimension; RateLimit-* headers + Retry-After on 429
- [ ] Fail-open default, fail-closed for sensitive endpoints
- [ ] Cache justified by profiling; TTL has explicit rationale
- [ ] Invalidation strategy documented; stampede protection on hot paths
- [ ] App works when Redis is down; hit/miss/eviction metrics exported
- [ ] Redis key naming follows `domain:entity:id:variant` convention
