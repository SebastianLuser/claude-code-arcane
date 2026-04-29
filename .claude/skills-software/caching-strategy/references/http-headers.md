# HTTP Caching Headers

| Header | Uso |
|--------|-----|
| `public, max-age=31536000, immutable` | Assets versionados (hash en URL) |
| `public, s-maxage=300, stale-while-revalidate=3600` | API listado semi-estatico |
| `private, no-store` | Response con PII |

- ETag + `If-None-Match` -> 304 Not Modified. `Vary: Accept-Encoding, Authorization`
