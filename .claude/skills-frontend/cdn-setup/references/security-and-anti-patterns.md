# cdn-setup — Security at Edge & Anti-patterns

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

## Anti-Patterns

- No hash in filenames — forces purge; `no-cache` everywhere — destroys LCP
- `Vary: User-Agent`; unstripped volatile query params
- 4000px images for 200px thumbnails; infinite TTL without purge plan
- Purge-all on every deploy; signed URLs with multi-day expiry
- CDN without origin allowlist; self-signed certs with strict mode
- `Set-Cookie` on cacheable responses
