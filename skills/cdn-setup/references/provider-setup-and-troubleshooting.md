# Provider setup, origin headers and troubleshooting

## CloudFront (AWS)

1. **Private S3 origin with Origin Access Control (OAC)**, not a public bucket and not the legacy OAI. The bucket policy allows only the distribution's ARN.
2. **Cache policy:** the managed `CachingOptimized` for static assets; a custom policy for APIs that lists exactly the headers, cookies and query strings that change the response (everything else stays out of the cache key).
3. **Origin request policy** forwards what the origin needs without adding it to the cache key.
4. **Response headers policy** for security headers (HSTS, `X-Content-Type-Options`, CSP) at the edge.
5. Edge logic: CloudFront Functions for header rewrites and redirects (cheap, viewer events only); Lambda@Edge only when you need the origin events or network calls.
6. Invalidation: `aws cloudfront create-invalidation --distribution-id <id> --paths "/index.html"`; paths count toward a monthly free quota, so prefer hashed filenames over `/*`.

## Cloudflare

1. DNS records **proxied** (orange cloud) for the hostnames to cache; DNS-only records bypass the CDN and expose the origin IP.
2. SSL/TLS mode **Full (strict)** with a valid origin certificate (a Cloudflare Origin CA certificate is fine); never Flexible, which serves the origin over plain HTTP.
3. **Cache Rules** (they replace Page Rules): by default Cloudflare caches static file extensions only, and HTML responses show `DYNAMIC`. To cache HTML or API responses, add an eligible-for-cache rule scoped to those paths, with a bypass when a session cookie is present.
4. Purge: by URL from the dashboard or `POST /zones/<zone_id>/purge_cache` with `{"files": [...]}`; `purge_everything` is for emergencies.
5. Lock the origin to Cloudflare (allow only Cloudflare IP ranges, or use a Tunnel) so the CDN and WAF cannot be bypassed. WAF, Workers, R2 and Zero Trust are in `/cloudflare`.

## Cache headers on the origin

The CDN follows what the origin sends; set it in the app or the web server, per route:

```nginx
location /assets/ {               # hashed filenames
  add_header Cache-Control "public, max-age=31536000, immutable";
}
location = /index.html {
  add_header Cache-Control "public, max-age=0, must-revalidate";
}
```

- Next.js sets these for `/_next/static/` already; set `Cache-Control` explicitly in route handlers that should be shared-cacheable.
- Express: `express.static(dir, { immutable: true, maxAge: "1y" })` for hashed assets only.
- An origin that sends `Set-Cookie`, `private` or `no-store` on a route makes it uncacheable, whatever the CDN rules say.

## Troubleshooting a miss

Read the response headers first:

| Header | Provider | Meaning |
|---|---|---|
| `cf-cache-status: HIT / MISS / EXPIRED` | Cloudflare | Cached; not yet cached; cached but stale |
| `cf-cache-status: DYNAMIC` | Cloudflare | Not eligible for cache: no Cache Rule covers it, or it is HTML |
| `cf-cache-status: BYPASS` | Cloudflare | The origin or a rule told it not to cache (cookie, `no-cache`) |
| `x-cache: Hit from cloudfront / Miss from cloudfront` | CloudFront | Cached or not at that edge |
| `Age` | Both | Seconds the object has been in cache |

Usual causes of a low hit rate, in order: `Set-Cookie` or `private` from the origin; query strings or headers in the cache key that vary per request; `Vary: User-Agent` or `Accept-Language`; a TTL shorter than the traffic gap per edge (enable tiered cache or an origin shield); purging everything on each deploy.
