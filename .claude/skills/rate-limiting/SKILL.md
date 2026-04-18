---
name: rate-limiting
description: "Rate limiting y throttling para APIs Educabot (Go/TS): algoritmos (token bucket, sliding window, fixed window), implementación con Redis, per-user/per-IP/per-endpoint, headers estándar, response 429, proteger logins/APIs caras. Usar para: rate limit, throttle, 429, ddos protection, api quotas, abuse prevention."
argument-hint: "[global|per-user|per-endpoint]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# rate-limiting — API Rate Limiting

Rate limiting para proteger APIs Educabot de abuso, DoS, scraping y costos descontrolados (ej. LLMs). Backend-side (autoritativo), con Redis para coordinación entre pods.

## Cuándo usar

- Endpoints de login / signup / forgot-password (bruteforce)
- APIs públicas (scraping, abuse)
- Endpoints caros (LLM calls, reports, exports)
- Protección contra pods desbalanceados
- Compliance con rate limits de terceros (pasar quota)

## Cuándo NO usar

- Como **único** mecanismo de seguridad (combinar con auth, WAF)
- Para endpoints internos entre servicios (usar circuit breakers)
- Para limitar uso legítimo del producto (ese es pricing/plans)

---

## 1. Niveles — defense in depth

```
┌─────────────────────────┐
│ CDN / WAF (Cloudflare) │  ← layer 4-7, global DDoS, bot challenge
└──────────┬──────────────┘
           │
┌──────────▼──────────────┐
│ API Gateway / Ingress   │  ← nginx-ingress, per-IP crude
└──────────┬──────────────┘
           │
┌──────────▼──────────────┐
│ App middleware          │  ← per-user, per-endpoint, por plan
└─────────────────────────┘
```

Cada capa atrapa distintos patrones. **Confiar solo en una = falla.**

---

## 2. Algoritmos

| Algoritmo | Pros | Cons | Cuándo |
|-----------|------|------|--------|
| **Fixed Window** | Simple, 1 counter | Burst en el límite (2x en el cambio) | Quotas diarias/mensuales |
| **Sliding Window Log** | Exacto | O(N) memoria/op | Endpoints caros, bajo volumen |
| **Sliding Window Counter** | Aproximado pero barato | Pequeño error (<10%) | **Default** — balance |
| **Token Bucket** | Permite bursts controlados | Config más pensada | APIs donde burst es útil |
| **Leaky Bucket** | Smooth output rate | No permite bursts | Rate shapeable (uploads) |

**Default Educabot:** Sliding window counter en Redis para la mayoría, token bucket donde hay bursts legítimos.

---

## 3. Dimensiones de limit

| Clave | Cuándo |
|-------|--------|
| `ip:<ip>` | No autenticado, protección básica |
| `user:<userId>` | Autenticado, el default |
| `apikey:<keyId>` | Clientes B2B |
| `endpoint:<route>:<userId>` | Endpoint específico caro |
| `action:<name>:<userId>` | Acción lógica (login, forgot-password) |
| `tenant:<orgId>` | Multi-tenant / colegios |

**Combinar** cuando aplica: `action:login:ip:<ip>` + `action:login:user:<email>`.

---

## 4. Config Educabot sugerida

| Endpoint/Acción | Límite | Ventana | Clave |
|-----------------|--------|---------|-------|
| `POST /auth/login` | 5 | 15min | `action:login:ip` + `action:login:email` |
| `POST /auth/signup` | 3 | 1h | `ip` |
| `POST /auth/forgot-password` | 3 | 1h | `email` |
| API general autenticada | 1000 | 1min | `user` |
| API general anon | 60 | 1min | `ip` |
| Exports/reports | 10 | 1h | `user` |
| LLM / AI endpoints | 30 | 1min | `user` + `tenant` |
| Webhooks outbound | 10 | 1s | `subscriber` (leaky) |

Ajustar con datos reales — empezar laxos, tightenear con evidencia de abuse.

---

## 5. Implementación — Sliding Window Counter (Redis)

### Script Lua atómico
```lua
-- rate_limit.lua
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])  -- seconds
local now = tonumber(ARGV[3])     -- unix seconds

local count = tonumber(redis.call('GET', key) or '0')
if count >= limit then
  local ttl = redis.call('TTL', key)
  return {0, limit, 0, ttl}  -- {allowed, limit, remaining, retry_after}
end

local new = redis.call('INCR', key)
if new == 1 then
  redis.call('EXPIRE', key, window)
end
local ttl = redis.call('TTL', key)
return {1, limit, limit - new, ttl}
```

### Go (go-redis)
```go
//go:embed rate_limit.lua
var rateLimitScript string

var rl = redis.NewScript(rateLimitScript)

type RLResult struct {
    Allowed    bool
    Limit      int
    Remaining  int
    RetryAfter int
}

func CheckRate(ctx context.Context, key string, limit int, window time.Duration) (RLResult, error) {
    res, err := rl.Run(ctx, rdb, []string{"rl:" + key},
        limit, int(window.Seconds()), time.Now().Unix()).Result()
    if err != nil { return RLResult{}, err }
    arr := res.([]any)
    return RLResult{
        Allowed:    arr[0].(int64) == 1,
        Limit:      int(arr[1].(int64)),
        Remaining:  int(arr[2].(int64)),
        RetryAfter: int(arr[3].(int64)),
    }, nil
}

// middleware
func RateLimitMiddleware(limit int, window time.Duration, keyFn func(*gin.Context) string) gin.HandlerFunc {
    return func(c *gin.Context) {
        key := keyFn(c)
        res, err := CheckRate(c, key, limit, window)
        if err != nil {
            c.Next()  // fail-open: si Redis muere, no bloqueamos tráfico
            return
        }
        c.Header("X-RateLimit-Limit", strconv.Itoa(res.Limit))
        c.Header("X-RateLimit-Remaining", strconv.Itoa(res.Remaining))
        c.Header("X-RateLimit-Reset", strconv.FormatInt(time.Now().Unix()+int64(res.RetryAfter), 10))
        if !res.Allowed {
            c.Header("Retry-After", strconv.Itoa(res.RetryAfter))
            c.AbortWithStatusJSON(429, gin.H{
                "type": "https://errors.educabot.com/rate-limited",
                "title": "Too Many Requests",
                "status": 429,
                "detail": "Rate limit exceeded, retry in " + strconv.Itoa(res.RetryAfter) + "s",
            })
            return
        }
        c.Next()
    }
}

// uso
r.POST("/auth/login",
    RateLimitMiddleware(5, 15*time.Minute, func(c *gin.Context) string {
        return "login:ip:" + c.ClientIP()
    }),
    loginHandler,
)
```

### TS / Fastify (rate-limiter-flexible)
```ts
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

const loginLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:login:ip',
  points: 5,
  duration: 15 * 60,
  blockDuration: 15 * 60,
});

app.post('/auth/login', async (req, reply) => {
  try {
    const res = await loginLimiter.consume(req.ip);
    reply.header('X-RateLimit-Limit', 5);
    reply.header('X-RateLimit-Remaining', res.remainingPoints);
    reply.header('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 + res.msBeforeNext / 1000));
  } catch (res: any) {
    reply.header('Retry-After', Math.ceil(res.msBeforeNext / 1000));
    return reply.code(429).send({
      type: 'https://errors.educabot.com/rate-limited',
      title: 'Too Many Requests',
      status: 429,
    });
  }
  // ... login logic
});
```

---

## 6. Token Bucket (cuando permitís bursts)

```lua
-- token_bucket.lua
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])  -- tokens/sec
local cost = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

local bucket = redis.call('HMGET', key, 'tokens', 'updated')
local tokens = tonumber(bucket[1]) or capacity
local updated = tonumber(bucket[2]) or now

-- refill
local elapsed = now - updated
tokens = math.min(capacity, tokens + elapsed * refillRate)

if tokens < cost then
  redis.call('HMSET', key, 'tokens', tokens, 'updated', now)
  redis.call('EXPIRE', key, math.ceil(capacity / refillRate) + 1)
  return {0, math.floor(tokens), math.ceil((cost - tokens) / refillRate)}
end

tokens = tokens - cost
redis.call('HMSET', key, 'tokens', tokens, 'updated', now)
redis.call('EXPIRE', key, math.ceil(capacity / refillRate) + 1)
return {1, math.floor(tokens), 0}
```

Uso típico: API con quota "100 req/min pero podés hacer 20 en un segundo".

---

## 7. Headers — RFC 9331 / draft-ietf-httpapi-ratelimit-headers

### Respuesta OK
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1712345678
```

### Respuesta 429
```
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1712345678
Content-Type: application/problem+json

{
  "type": "https://errors.educabot.com/rate-limited",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Retry in 30s.",
  "retryAfter": 30
}
```

**`Retry-After`** puede ser segundos o fecha HTTP. Preferir segundos (más simple de parsear).

---

## 8. Obtener la IP correcta

Detrás de proxies (Cloudflare, nginx, Cloud Run), `req.ip` puede ser el del proxy.

### Fastify
```ts
const app = Fastify({
  trustProxy: process.env.TRUST_PROXY || true,  // confiar en X-Forwarded-For
});
```

### Go / Gin
```go
r.SetTrustedProxies([]string{"10.0.0.0/8"})
// o usar ClientIP que respeta X-Forwarded-For cuando hay trusted proxy
```

**Cuidado:** no confiar en `X-Forwarded-For` sin proxy confiable en frente — spoofing trivial.

---

## 9. Rate limit por plan (multi-tenant / SaaS)

```ts
const limits = {
  free: { points: 100, duration: 60 },
  pro:  { points: 1000, duration: 60 },
  enterprise: { points: 10000, duration: 60 },
};

async function apiLimiter(req) {
  const plan = req.user.plan;
  const { points, duration } = limits[plan];
  const limiter = new RateLimiterRedis({ storeClient: redis, points, duration, keyPrefix: `rl:api:${plan}` });
  return limiter.consume(req.user.id);
}
```

Escalamiento gratis por upgrade de plan → señal pricing.

---

## 10. Fail-open vs fail-closed

| Modo | Si Redis cae | Cuándo |
|------|--------------|--------|
| **Fail-open** | Permite todo | Default — UX primero |
| **Fail-closed** | Rechaza todo | Endpoints sensibles (pagos, admin) |

Mezcla: fail-open para API normal, fail-closed para auth/payment endpoints.

Monitorear: si el limiter falla, emitir métrica + alertar — sino es problema invisible.

---

## 11. Cliente — manejo de 429

### Backoff exponencial
```ts
async function apiCallWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.status !== 429 || i === maxRetries) throw err;
      const retry = parseInt(err.headers['retry-after']) || Math.pow(2, i);
      await sleep((retry + Math.random()) * 1000);  // jitter
    }
  }
}
```

Siempre **jitter** — sin él, los clientes reintentan sincronizados y amplifican el problema.

---

## 12. Testing

### Unit
```ts
it('blocks after N requests', async () => {
  for (let i = 0; i < 5; i++) {
    await request(app).post('/auth/login').send({...}).expect(401);
  }
  await request(app).post('/auth/login').send({...}).expect(429);
});
```

### Integration (con Redis real)
- Container de Redis en CI (Docker service)
- Reset con `FLUSHDB` entre tests

### Load (k6)
Ver `/performance-test` — validar que 429 aparece cuando esperás, no antes.

---

## 13. Observabilidad

### Métricas
```
rate_limit_requests_total{endpoint, decision="allow|block"}
rate_limit_remaining{endpoint} (gauge, sampled)
rate_limit_redis_errors_total
```

### Dashboards
- % de 429 por endpoint
- Top users/IPs rate-limitados (flag potencial abuse)
- Redis latency del limiter (debe ser < 5ms p99)

### Alertas
- Spike de 429 en endpoints NO de auth → posible abuse en otro lado
- 429 en login desde mismo IP/email → bruteforce → SIEM/SOC
- Redis errors del limiter > 1% → fail-open actuando → urgente

---

## 14. Security ángulos

- [ ] Login: rate limit **por email** (no solo IP) → bruteforce distribuído no evade
- [ ] Signup: rate limit + captcha tras N
- [ ] Forgot-password: rate limit por email (evitar spam a inbox ajeno)
- [ ] Combinar rate limit + account lockout temporal
- [ ] No revelar `remaining` o TTL en responses si son endpoints sensibles (info oracle)
- [ ] IP rotation defense: capa CDN con bot detection

---

## 15. Anti-patterns

- ❌ Rate limit solo en cliente (trivialmente bypass)
- ❌ Rate limit in-memory en app multi-pod (cada pod tiene su contador)
- ❌ Límite único "por endpoint" sin dimensión de usuario
- ❌ No rate-limitar signup/forgot-password (spam inbox ajeno, DoS email)
- ❌ 429 sin `Retry-After` (cliente no sabe cuándo reintentar)
- ❌ Reintento sin jitter → sincronización de clientes
- ❌ Limit tan laxo que no protege / tan estrecho que rompe UX legítima
- ❌ No distinguir abuse vs integración legítima con mucho volumen
- ❌ Fail-closed en todo → Redis hiccup → caída total

---

## 16. Output final

```
✅ Rate limiting aplicado — Alizia API
   📊 Config:
      - /auth/login:          5 req / 15min / ip+email
      - /auth/signup:         3 req / 1h / ip
      - /api/* autenticado:   1000 req / 1min / user
      - /api/export:          10 req / 1h / user
   🔌 Redis: shared cluster, fail-open
   📈 Headers: X-RateLimit-* + Retry-After en 429
   📊 Dashboard: <link Grafana rate-limit>

Próximos pasos:
  1. Monitorear 7 días: % 429 por endpoint
  2. Ajustar thresholds con datos reales
  3. Review integración clientes B2B (plan enterprise)
```

## Delegación

**Coordinar con:** `backend-architect`, `security-engineer`, `sre-lead`
**Reporta a:** `backend-architect`, `security-architect`

**Skills relacionadas:**
- `/security-hardening` — rate limit en context OWASP
- `/api-design` — headers estándar documentados
- `/observability-setup` — métricas del limiter
- `/caching-strategy` — Redis shared con cache (separar key prefixes)
- `/incident` — abuse patterns detectados
