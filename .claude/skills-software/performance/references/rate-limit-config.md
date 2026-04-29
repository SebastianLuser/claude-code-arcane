# Rate Limit Configuration - Performance

## Algorithm Selection

| Algorithm | Best For | Trade-off |
|-----------|----------|-----------|
| **Fixed Window** | Daily/monthly quotas | 2x burst at window boundary |
| **Sliding Window Counter** | **Default** — most endpoints | ~10% approximation error |
| **Token Bucket** | APIs where burst is useful | More config tuning |
| **Leaky Bucket** | Smooth output (uploads) | No burst tolerance |

## Implementation Tiers (all three required)

| Tier | Scope | Catches |
|------|-------|---------|
| CDN / WAF | Global, L4-L7 | DDoS, bot challenges |
| API Gateway / Ingress | Per-IP crude | Volumetric abuse pre-auth |
| App Middleware (Redis) | Per-user, per-endpoint, per-plan | Authenticated abuse, plan limits |

## Recommended Limits

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| POST /auth/login | 5 | 15min | ip + email |
| POST /auth/signup | 3 | 1h | ip |
| POST /auth/forgot-password | 3 | 1h | email |
| Authenticated API | 1000 | 1min | user |
| Anonymous API | 60 | 1min | ip |
| Exports/reports | 10 | 1h | user |
| LLM/AI endpoints | 30 | 1min | user + tenant |

Start permissive, tighten with evidence. Use `rate-limiter-flexible` with Redis.

## Key Dimensions

`ip:<ip>` (unauth), `user:<userId>` (default auth), `endpoint:<route>:<userId>` (expensive), `action:<name>:<id>` (login/signup), `tenant:<orgId>` (multi-tenant). Combine when needed: `action:login:ip:<ip>` + `action:login:email:<email>`.

## Response Headers

Always include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`. On 429: add `Retry-After` (seconds), RFC 7807 problem+json body.

## Failure Modes

Fail-open default (allow all if Redis down). Fail-closed only for auth/payment/admin. Emit metric + alert on limiter failure.

## Abuse Prevention

Rate limit login by email (not just IP) for distributed brute force. Combine with temporary lockout. Escalate sustained 429 clusters to SIEM.
