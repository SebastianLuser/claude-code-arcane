# HTTP Caching Headers

| Header | Use |
|--------|-----|
| `public, max-age=31536000, immutable` | Versioned assets (hash in URL) |
| `public, s-maxage=300, stale-while-revalidate=3600` | Semi-static list API |
| `private, no-store` | Response with PII |

- ETag + `If-None-Match` -> 304 Not Modified. `Vary: Accept-Encoding, Authorization`
