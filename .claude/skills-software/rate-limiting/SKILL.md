---
name: rate-limiting
description: "Rate limiting y throttling APIs Educabot (Go/TS): token bucket, sliding window, Redis, per-user/IP/endpoint, headers 429, proteger logins/APIs caras."
category: "backend"
argument-hint: "[global|per-user|per-endpoint]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# rate-limiting — API Rate Limiting

Rate limiting backend-side autoritativo con Redis para coordinación entre pods.

## Cuándo usar / NO usar

| Usar | NO usar |
|------|---------|
| Login/signup/forgot-password (bruteforce) | Único mecanismo seguridad (combinar con auth, WAF) |
| APIs públicas (scraping, abuse) | Endpoints internos entre servicios (circuit breakers) |
| Endpoints caros (LLM, reports, exports) | Limitar uso legítimo (eso es pricing/plans) |

## Defense in Depth

```
CDN/WAF (Cloudflare) → API Gateway/Ingress (per-IP crude) → App middleware (per-user, per-endpoint)
```

## Algoritmos

| Algoritmo | Cuándo |
|-----------|--------|
| **Sliding Window Counter** | **Default** — balance precisión/costo |
| **Token Bucket** | APIs donde burst es útil |
| **Fixed Window** | Quotas diarias/mensuales simples |
| **Leaky Bucket** | Rate shapeable (uploads) |

## Dimensiones

| Clave | Cuándo |
|-------|--------|
| `ip:<ip>` | No autenticado |
| `user:<userId>` | **Default** autenticado |
| `endpoint:<route>:<userId>` | Endpoint caro específico |
| `action:<name>:<id>` | Login, forgot-password |
| `tenant:<orgId>` | Multi-tenant |

Combinar: `action:login:ip:<ip>` + `action:login:email:<email>`

## Config Educabot

| Endpoint | Límite | Ventana | Clave |
|----------|--------|---------|-------|
| POST /auth/login | 5 | 15min | ip + email |
| POST /auth/signup | 3 | 1h | ip |
| POST /auth/forgot-password | 3 | 1h | email |
| API general autenticada | 1000 | 1min | user |
| API general anon | 60 | 1min | ip |
| Exports/reports | 10 | 1h | user |
| LLM/AI endpoints | 30 | 1min | user + tenant |

## Implementación

- Sliding window counter con script Lua atómico en Redis (INCR + EXPIRE)
- Middleware: key function → CheckRate → set headers → 429 si excedido
- **Fail-open** default (Redis muere → permite). **Fail-closed** para auth/payment
- Go: `go-redis` + Lua script embed. TS: `rate-limiter-flexible`

## Response Headers (RFC 9331)

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: <unix timestamp>
Retry-After: 30           ← solo en 429
```

429 body: `application/problem+json` con type, title, status, detail, retryAfter

## Rate Limit por Plan (SaaS)

Config por plan (free/pro/enterprise) → lookup plan del user → usar limiter correspondiente

## IP Correcta

- Fastify: `trustProxy: true`. Gin: `SetTrustedProxies([]string{"10.0.0.0/8"})`
- No confiar `X-Forwarded-For` sin proxy confiable — spoofing trivial

## Cliente: Manejo de 429

- Backoff exponencial con **jitter** siempre (sin jitter → clientes sincronizados amplifican)
- Leer `Retry-After` header

## Anti-patterns

- Rate limit solo en cliente, in-memory en multi-pod, límite único sin dimensión user
- No rate-limitar signup/forgot-password, 429 sin Retry-After
- Reintento sin jitter, limit demasiado laxo o estrecho sin datos
- Fail-closed en todo (Redis hiccup → caída total)

## Observabilidad

- Métricas: `rate_limit_requests_total{endpoint,decision}`, `redis_errors_total`
- Dashboard: % 429 por endpoint, top users/IPs limitados, Redis latency
- Alertas: spike 429 en no-auth, login bruteforce desde mismo IP, Redis errors >1%

## Checklist

- [ ] Login/signup/forgot con rate limit por email + IP
- [ ] Sliding window counter en Redis (Lua atómico)
- [ ] Headers X-RateLimit-* + Retry-After en 429
- [ ] Fail-open default, fail-closed para auth/payment
- [ ] Trusted proxy configurado correctamente
- [ ] Métricas + dashboard
- [ ] Rate limit por plan si SaaS
- [ ] Tests: bloquea tras N requests, 429 con headers correctos
