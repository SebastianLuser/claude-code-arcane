# Cache Strategy - Performance

## Cache Layer Decision

| Data Type | Layer |
|-----------|-------|
| Static assets | CDN + browser (immutable + versioned URLs) |
| Public API responses | CDN + Redis (cache-aside, `s-maxage`) |
| Per-user API responses | Redis + client (cache-aside, `private`) |
| Config / feature flags | In-memory LRU (warm on boot, 30s TTL) |
| DB query results | Redis (cache-aside) |
| Sessions / tokens | Redis no-eviction (dedicated instance) |

## TTL Strategy

| Data | TTL | Rationale |
|------|-----|-----------|
| Versioned assets | 1 year | URL changes on content change |
| Public listings | 5 min | Acceptable staleness |
| Entity detail | 1 min | Editable by users |
| User profile | 5 min | Invalidate on write |
| Config / flags | 30 sec | Fast visibility |

## Patterns

- **cache-aside** (default): app checks cache, miss->DB->write cache
- **read-through**: CDN/proxy handles
- **write-through**: always fresh
- **write-behind**: metrics only, data loss risk

## Invalidation

Default to **short TTL**. Add explicit invalidation (delete on write, event-driven pub/sub, versioned keys) only when TTL is insufficient.

## Stampede Prevention

Single-flight/mutex (one request loads, others wait), distributed lock (Redis SETNX), early probabilistic refresh, stale-while-revalidate.

## HTTP Headers

- Versioned assets: `public, max-age=31536000, immutable`
- Public API: `public, s-maxage=300, stale-while-revalidate=3600`
- Per-user/PII: `private, no-store`
- Must-revalidate: `no-cache` + ETag

## Redis Key Convention

Key format: `<domain>:<entity>:<id>:<variant>`. Separate instances: cache (allkeys-lru), session (noeviction), queue.
