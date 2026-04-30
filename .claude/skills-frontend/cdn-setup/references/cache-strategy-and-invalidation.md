# cdn-setup — Cache Strategy & Invalidation

## Cache Strategy — TTL Table

| Content | Cache-Control | Rationale |
|---|---|---|
| Immutable assets (hashed JS/CSS/fonts) | `public, max-age=31536000, immutable` | Hash changes per build |
| HTML | `public, max-age=0, must-revalidate` | Instant deploys |
| Public read API | `public, max-age=60, s-maxage=300, stale-while-revalidate=600` | Browser 60s, CDN 5min |
| Private/user API | `private, no-store` | Never on shared CDN |
| User images | `public, max-age=604800` | Invalidate via hash/purge |

**stale-while-revalidate**: highest-impact perf feature. Use for feeds, catalogs. Never for auth, carts, checkout.

## Invalidation

| Approach | Speed | Use When |
|---|---|---|
| Versioned filenames (hash) | Instant | Default for build assets |
| Purge by URL | Seconds | Specific resources post-deploy |
| Purge by tag (Enterprise) | Seconds | Tenant/entity scoped |
| Purge everything | Minutes | Emergency only |

Prefer hash-based busting. Deploy assets before HTML (atomic deploy).

## Cache Key Hygiene

- Strip volatile query params at edge; keep only meaningful ones (`v`, `lang`)
- `Vary: Accept-Encoding` OK; `Vary: Accept-Language` explodes keys (use path `/es/`); `Vary: User-Agent` destroys cache
- `Set-Cookie` in response disables caching — strip on non-cookie-dependent routes
