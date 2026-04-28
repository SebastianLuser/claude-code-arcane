---
name: cdn-setup
description: "CDN decision guide: provider selection, cache strategies, invalidation, edge security, performance. Use for: cdn, cloudflare, cloudfront, cache-control, edge, image optimization, purge."
argument-hint: "[provider: cloudflare|aws|gcp]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# cdn-setup — Decision Guide

Goal: **cache hit >90% on assets, TTFB <100ms** in target regions.

## Provider Decision

| Provider | Best For | Key Strength |
|---|---|---|
| **Cloudflare** | Default | LatAm PoPs, free tier, Workers, R2, WAF included |
| **CloudFront** | AWS stacks | S3 + Lambda@Edge integration |
| **GCP Cloud CDN** | GCP stacks | GCS + LB integration, IAM |
| **Fastly** | Strict SLA media | VCL control, instant purge |

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

## Security at Edge

- WAF managed ruleset ON; rate limit auth endpoints by IP
- Bot protection; geo-restrict if region-specific
- Origin allowlist (only CDN IPs); authenticated origin pull (mTLS)
- Also rate limit at origin — do not rely solely on CDN WAF

## Performance Checklist

- [ ] Brotli + HTTP/2 or HTTP/3 (QUIC) enabled
- [ ] Origin shield / tiered cache active
- [ ] Images: auto WebP/AVIF, resize on-the-fly
- [ ] LCP image: `fetchpriority="high"` + preload; lazy load below-fold
- [ ] Signed URLs for private content (1h previews, 24-72h docs)
- [ ] TLS Full (strict) with valid origin cert

## Monitoring

| Metric | Target |
|---|---|
| Cache hit (assets) | >90% |
| Cache hit (API) | >70% |
| p95 TTFB | <100ms |
| Edge 5xx | <0.1% |

## Anti-Patterns

- No hash in filenames — forces purge; `no-cache` everywhere — destroys LCP
- `Vary: User-Agent`; unstripped volatile query params
- 4000px images for 200px thumbnails; infinite TTL without purge plan
- Purge-all on every deploy; signed URLs with multi-day expiry
- CDN without origin allowlist; self-signed certs with strict mode
- `Set-Cookie` on cacheable responses
