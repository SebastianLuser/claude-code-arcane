---
name: rate-limiting
description: "Rate limiting and throttling for Educabot APIs (Go/TS): token bucket, sliding window, Redis, per-user/IP/endpoint, 429 headers, protecting logins/expensive APIs."
category: "backend"
argument-hint: "[global|per-user|per-endpoint]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# rate-limiting — API Rate Limiting

Authoritative backend-side rate limiting with Redis for coordination across pods.

## When to use / NOT use

| Use | Do NOT use |
|------|---------|
| Login/signup/forgot-password (bruteforce) | As the only security mechanism (combine with auth, WAF) |
| Public APIs (scraping, abuse) | Internal service-to-service endpoints (circuit breakers) |
| Expensive endpoints (LLM, reports, exports) | Limiting legitimate usage (that is pricing/plans) |

## Defense in Depth

```
CDN/WAF (Cloudflare) → API Gateway/Ingress (crude per-IP) → App middleware (per-user, per-endpoint)
```

## Algorithms

| Algorithm | When |
|-----------|--------|
| **Sliding Window Counter** | **Default** — balances precision/cost |
| **Token Bucket** | APIs where bursts are useful |
| **Fixed Window** | Simple daily/monthly quotas |
| **Leaky Bucket** | Shapeable rate (uploads) |

## Dimensions

| Key | When |
|-------|--------|
| `ip:<ip>` | Unauthenticated |
| `user:<userId>` | **Default** authenticated |
| `endpoint:<route>:<userId>` | A specific expensive endpoint |
| `action:<name>:<id>` | Login, forgot-password |
| `tenant:<orgId>` | Multi-tenant |

Combine: `action:login:ip:<ip>` + `action:login:email:<email>`

## Educabot Config

| Endpoint | Limit | Window | Key |
|----------|--------|---------|-------|
| POST /auth/login | 5 | 15min | ip + email |
| POST /auth/signup | 3 | 1h | ip |
| POST /auth/forgot-password | 3 | 1h | email |
| General authenticated API | 1000 | 1min | user |
| General anonymous API | 60 | 1min | ip |
| Exports/reports | 10 | 1h | user |
| LLM/AI endpoints | 30 | 1min | user + tenant |

## Implementation

- Sliding window counter with an atomic Lua script in Redis (INCR + EXPIRE)
- Middleware: key function → CheckRate → set headers → 429 if exceeded
- **Fail-open** by default (Redis dies → allow). **Fail-closed** for auth/payment
- Go: `go-redis` + embedded Lua script. TS: `rate-limiter-flexible`

## Response Headers (RFC 9331)

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: <unix timestamp>
Retry-After: 30           ← only on 429
```

429 body: `application/problem+json` with type, title, status, detail, retryAfter

## Rate Limit per Plan (SaaS)

Config per plan (free/pro/enterprise) → look up the user's plan → use the matching limiter

## Correct IP

- Fastify: `trustProxy: true`. Gin: `SetTrustedProxies([]string{"10.0.0.0/8"})`
- Do not trust `X-Forwarded-For` without a trusted proxy — trivial spoofing

## Client: Handling 429

- Exponential backoff with **jitter**, always (without jitter → synchronized clients amplify the load)
- Read the `Retry-After` header

## Anti-patterns

- Client-only rate limit, in-memory on multi-pod, a single limit with no user dimension
- Not rate-limiting signup/forgot-password, 429 without Retry-After
- Retrying without jitter, a limit too loose or too tight without data
- Fail-closed everywhere (Redis hiccup → total outage)

## Observability

- Metrics: `rate_limit_requests_total{endpoint,decision}`, `redis_errors_total`
- Dashboard: % of 429 per endpoint, top limited users/IPs, Redis latency
- Alerts: 429 spike on non-auth, login bruteforce from the same IP, Redis errors >1%

## Checklist

- [ ] Login/signup/forgot rate limited by email + IP
- [ ] Sliding window counter in Redis (atomic Lua)
- [ ] X-RateLimit-* headers + Retry-After on 429
- [ ] Fail-open by default, fail-closed for auth/payment
- [ ] Trusted proxy configured correctly
- [ ] Metrics + dashboard
- [ ] Rate limit per plan if SaaS
- [ ] Tests: blocks after N requests, 429 with correct headers
