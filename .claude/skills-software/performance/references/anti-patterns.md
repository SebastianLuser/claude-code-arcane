# Anti-patterns - Performance (Rate Limiting & Caching)

## Rate Limiting

- Client-only limiting (bypassed)
- In-memory counters on multi-pod (unsynchronized)
- No user dimension in key
- No limit on signup/forgot-password
- 429 without Retry-After
- Retries without jitter
- Fail-closed everywhere

## Caching

- Caching without profiling
- Infinite TTL without invalidation
- Caching PII without `private, no-store`
- Caching errors
- Cache failure crashes app
- `KEYS *` in prod (use SCAN)
- No namespace in keys
- Per-user in CDN without `Vary`
- No hit/miss metrics
- Mutable auth data with long TTL
- Sessions in app memory
