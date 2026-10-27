# Caching Patterns & Invalidation

## Patterns

| Pattern | How | Pros | Cons |
|---------|------|------|------|
| **Cache-aside** (lazy) | App: check cache -> miss -> DB -> write cache | Simple, resilient | Miss penalty, stampede |
| **Write-through** | App writes to cache + DB | Cache always fresh | Slow writes |
| **Read-through** | Cache fetches from the DB on a miss | Clean for the client | Less common in apps |
| **Write-behind** | App -> cache; worker -> DB | Fast | Risk of data loss (analytics only) |

## Invalidation

| Strategy | When |
|------------|--------|
| **Short TTL** (1-5 min) | **Default** if stale data is acceptable |
| **Invalidate on write** | TTL is not enough, delete keys on write |
| **Event-driven** (pub/sub) | Multi-pod local cache |
| **Versioning** (key with vN) | Bumping the version = old keys expire on their own |

## Stampede Protection

- **Go:** `golang.org/x/sync/singleflight` — only 1 goroutine loads, the others wait
- **Redis lock:** `SET NX` with a TTL; whoever does not get the lock waits and re-reads
- **stale-while-revalidate:** serve stale, refresh in the background
