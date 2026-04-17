---
name: caching-strategy
description: "Estrategia de caching multi-capa para apps Educabot (Go/TS/React): HTTP (Cache-Control/ETag), CDN, Redis, in-memory, browser. Patterns (cache-aside, write-through, read-through), invalidation, TTLs, stampede protection. Usar para: cache, redis, cdn, http caching, etag, memoization, performance caching."
argument-hint: "[layer: http|cdn|redis|memory|browser]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# caching-strategy — Multi-Layer Caching

Guía de caching para backends Educabot (Go + TS) y frontends (React + RN). Objetivo: reducir latencia y carga sin corromper datos.

> Regla 0: **antes de cachear, medí.** Cachear sin profiling esconde problemas (ej. query lenta que se soluciona con un índice).

## Cuándo usar

- Hot path con lectura >> escritura
- Query cara sin índices posibles
- Respuesta inmutable o slow-changing
- Alivio de DB bajo carga
- Reducir latencia de API de terceros con rate limit

## Cuándo NO usar

- Datos write-heavy con lectura impredecible
- Info financiera/regulatoria donde staleness causa daño legal
- Como parche de query mal diseñada (arreglá la query)
- Prematuramente — el segundo más complejo que un índice

---

## 1. Capas de cache

```
Browser/RN      (HTTP cache, service worker, AsyncStorage)
    │
    ▼
CDN             (Cloudflare, CloudFront, GCP CDN)
    │
    ▼
API Gateway     (nginx, Cloud Run cache)
    │
    ▼
App in-memory   (LRU per-pod)
    │
    ▼
Redis           (shared across pods)
    │
    ▼
Database        (buffer pool, query cache)
```

Cada capa tiene **TTL distinto** y **trigger de invalidation distinto**. Más cerca del usuario = más caché posible pero más difícil de invalidar.

---

## 2. Decisión — qué cachear dónde

| Dato | Cache |
|------|-------|
| Assets estáticos (JS, CSS, img) | CDN + browser (immutable + versioned URLs) |
| API responses públicas (listados) | CDN + Redis |
| API responses por-user | Redis + cliente (localStorage/query) |
| Session/token | Redis (o memoria si single-pod) |
| Rate limit counters | Redis |
| Computaciones caras server-side | Redis o in-memory |
| Traducciones / config | In-memory con warm on boot |
| DB query resultado | Redis (cache-aside) |

---

## 3. HTTP caching (capa 1)

### Headers clave
```
Cache-Control: public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400
ETag: "abc123"
Last-Modified: Wed, 13 Apr 2026 12:00:00 GMT
Vary: Accept-Encoding, Authorization
```

| Header | Uso |
|--------|-----|
| `public` | CDN puede cachear |
| `private` | Solo cliente final (user-specific) |
| `max-age` | Segundos válido en client |
| `s-maxage` | Segundos válido en CDN (override) |
| `no-cache` | Validar con server antes de usar |
| `no-store` | No cachear en ningún lado (PII) |
| `immutable` | Archivos versionados (jamás cambian) |
| `stale-while-revalidate` | Servir stale mientras refresca en background |

### Ejemplos Educabot

**Assets Vite build**
```
Cache-Control: public, max-age=31536000, immutable
```
(URL tiene hash → cambia el URL si cambia el contenido)

**API listado semi-estático**
```
Cache-Control: public, s-maxage=300, stale-while-revalidate=3600
ETag: "v3-abc123"
```

**Response con PII**
```
Cache-Control: private, no-store
```

### Conditional GET — Fastify
```ts
app.get('/api/courses', async (req, reply) => {
  const data = await listCourses();
  const etag = hash(data);

  reply.header('Cache-Control', 'public, s-maxage=300');
  reply.header('ETag', etag);

  if (req.headers['if-none-match'] === etag) {
    return reply.code(304).send();
  }
  return data;
});
```

### Go (Gin)
```go
r.GET("/api/courses", func(c *gin.Context) {
    data := listCourses()
    etag := hashBytes(data)
    c.Header("Cache-Control", "public, s-maxage=300")
    c.Header("ETag", etag)
    if c.GetHeader("If-None-Match") == etag {
        c.Status(http.StatusNotModified)
        return
    }
    c.JSON(200, data)
})
```

---

## 4. CDN (capa 2)

### Cloudflare / GCP CDN
- Cachea por **URL + Vary headers**
- Respeta `s-maxage` > `max-age`
- **Purge** manual por tag/URL tras deploys que cambian contenido
- Varios niveles: edge → regional → origin

### Patterns
- **Asset versioning:** `/assets/app.a1b2c3.js` → immutable
- **Surrogate-Key** (Fastly/Cloudflare Enterprise): tag responses para purge masivo (`tag=course-123`)
- **Bypass con cookies de auth:** sesión logueada bypasea CDN para páginas privadas
- **API público:** cachear en CDN → response time < 50ms global

---

## 5. Redis (capa 3)

### Setup recomendado
- Cluster managed: GCP Memorystore / AWS ElastiCache
- 1 replica mínimo (HA)
- Separar instancias por propósito:
  - `cache` (datos cacheados, evictable)
  - `session` (tokens, NO evictable, persistence RDB)
  - `queue` (BullMQ/asynq — tema aparte)

### Eviction policy
```
maxmemory-policy allkeys-lru   # para cache
maxmemory-policy noeviction    # para session (que no desaparezcan)
```

### Key naming
```
<domain>:<entity>:<id>:<variant>

courses:course:c_abc:detail
courses:teacher:t_123:courses:v3
user:u_456:preferences
rate:api:user:u_456:1m
session:token:s_xyz
```

Beneficios: pattern-based purge (`DEL courses:course:c_abc:*`), debug visual.

### Serialización
- **JSON** por default (debuggable)
- **MessagePack** si latencia/CPU importa (~2x faster)
- Prefijo de version: `v3:{...}` → migrations de schema

---

## 6. Patterns de caching

### Cache-aside (lazy)
App consulta cache, miss → DB → write cache.

```go
func GetCourse(ctx context.Context, id string) (*Course, error) {
    key := "courses:course:" + id

    // 1. cache
    if data, err := redis.Get(ctx, key).Bytes(); err == nil {
        var c Course
        json.Unmarshal(data, &c)
        return &c, nil
    }

    // 2. DB
    c, err := db.FindCourse(ctx, id)
    if err != nil { return nil, err }

    // 3. write cache (async, no bloquea)
    go func() {
        data, _ := json.Marshal(c)
        redis.Set(context.Background(), key, data, 5*time.Minute)
    }()

    return c, nil
}
```

**Pros:** simple, resiliente (cache down → DB fallback)
**Cons:** miss penalty la primera vez, posible stampede

### Write-through
App escribe a cache + DB en la misma operación.

```ts
async function updateCourse(id: string, data: Partial<Course>) {
  await db.course.update({ where: { id }, data });
  await redis.set(`courses:course:${id}:detail`, JSON.stringify(data), 'EX', 300);
}
```

**Pros:** cache siempre fresco
**Cons:** escrituras más lentas, complica transacciones

### Read-through
Cliente siempre pide a cache; cache se encarga de buscar en DB si miss. Menos común en apps (más usado en CDN/proxies).

### Write-behind (write-back)
App escribe solo a cache; worker async persiste a DB. **Riesgoso** — pérdida de datos si cache cae antes del flush. Usar solo para métricas/analytics.

---

## 7. Invalidation — el problema difícil

> "Hay dos cosas difíciles en CS: cache invalidation, naming things, y off-by-one errors."

### Estrategias

**TTL corto (simple)**
```go
redis.Set(ctx, key, data, 1*time.Minute)
```
Acepta stale hasta N segundos. **Default si se puede**.

**Invalidate on write**
```ts
async function updateCourse(id: string, data) {
  await db.course.update({ where: { id }, data });
  await redis.del(`courses:course:${id}:*`);  // patterns
  // también invalidar queries list que puedan contener este course
  await redis.del(`courses:list:*`);
}
```

**Event-driven (pub/sub)**
App publica evento `course.updated` → consumers invalidan su cache local.

**Versioning (cache-busting sin delete)**
```
courses:course:c_abc:v3
```
Al cambiar schema o invalidar global, bump la versión → las keys viejas expiran solas.

### Regla práctica
Default: **TTL corto** (1-5 min para datos user-facing).
Agregá invalidation explícita solo si el TTL no alcanza.

---

## 8. Stampede protection (thundering herd)

Cache expira → 1000 requests pegan a la DB al mismo tiempo.

### Single-flight (Go)
```go
import "golang.org/x/sync/singleflight"

var sfg singleflight.Group

func GetCourse(ctx context.Context, id string) (*Course, error) {
    v, err, _ := sfg.Do("courses:course:"+id, func() (any, error) {
        // solo 1 goroutine llega acá; las otras esperan el resultado
        return loadCourseAndCache(ctx, id)
    })
    return v.(*Course), err
}
```

### Lock distribuido (Redis)
```ts
// SET NX con TTL
const got = await redis.set(`lock:${key}`, '1', 'EX', 10, 'NX');
if (got === 'OK') {
  // este pod carga y cachea
  const data = await loadAndCache();
  return data;
} else {
  // otro pod está cargando; esperar y releer
  await sleep(50);
  return redis.get(key);
}
```

### Early expiration (probabilístico)
Refrescar cache antes del expiry con probabilidad creciente al acercarse al TTL.

### `stale-while-revalidate` pattern
Servir valor stale, refrescar en background. Aplica a HTTP y a cache interno.

---

## 9. In-memory (capa 4)

Per-pod, no compartido. Útil para config inmutable, traducciones, lookup tables.

### Go
```go
import "github.com/hashicorp/golang-lru/v2"

var translations, _ = lru.New[string, string](10_000)
```

### TS
```ts
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, Course>({
  max: 10_000,
  ttl: 5 * 60_000,  // 5 min
});
```

**Cuidado:** consistencia entre pods. Si necesitás ver update inmediato en todos los pods → Redis.

---

## 10. Cliente (React + RN)

### TanStack Query (React)
```tsx
const { data } = useQuery({
  queryKey: ['courses', id],
  queryFn: () => fetchCourse(id),
  staleTime: 60_000,    // considerado fresh por 1min
  gcTime: 5 * 60_000,   // mantener en memoria 5min tras unmount
});

// invalidar on mutation
const mut = useMutation({
  mutationFn: updateCourse,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
});
```

### RN + React Query + AsyncStorage persister
```ts
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

persistQueryClient({
  queryClient,
  persister: createAsyncStoragePersister({ storage: AsyncStorage }),
  maxAge: 24 * 60 * 60_000,  // 24h
});
```

Offline-first → app arranca con última data vista.

### Service Worker (React web, PWA)
Strategy:
- Assets → `CacheFirst`
- API → `NetworkFirst` con fallback a cache (offline)

---

## 11. TTL defaults sugeridos

| Tipo | TTL | Nota |
|------|-----|------|
| Assets versionados | 1 año | `immutable` |
| Lista de cursos público | 5 min | refresh aceptable |
| Detalle de curso | 1 min | cambia con edición |
| Perfil de usuario | 5 min | invalidate on write |
| Config/feature flags | 30 seg | cambios visibles rápido |
| Rate limit counters | 1 min (ventana) | exacto |
| Session token | TTL de la sesión | ver security |
| Respuesta de LLM/IA | Según costo | puede ser hora a días |

---

## 12. Observabilidad

### Métricas clave
```
cache_hits_total{cache="redis",key_prefix="courses"}
cache_misses_total{...}
cache_latency_seconds{operation="get|set"}
cache_evictions_total
```

### Hit rate target
- Hot path: > 90%
- Warm: > 70%
- Cold (rarely accessed): sin objetivo — cache no ayuda

Hit rate < 50% sostenido → cache probablemente no vale la pena (o TTL mal calibrado).

### Alertas
- `evicted_keys_total` creciente → memoria insuficiente
- `cache_latency` p99 > 10ms → problemas de red/Redis
- `hit_rate` cae súbitamente → invalidation masiva no intencional

---

## 13. Anti-patterns

- ❌ Cachear sin medir → podés estar cacheando queries rápidas
- ❌ TTL infinito sin invalidation strategy
- ❌ Cachear PII sin `Cache-Control: private, no-store`
- ❌ Cachear respuestas de error (404/500) → propagás fallos
- ❌ Cache que falla → app cae (cache debe ser **opcional**)
- ❌ `KEYS *` en Redis prod (O(n) bloqueante — usar `SCAN`)
- ❌ Cache sin namespace → colisión entre servicios
- ❌ Cachear per-user en CDN (falta `Vary: Authorization`)
- ❌ Invalidation "tras el refactor" → stale bugs eternos
- ❌ Sin métricas → no sabés si funciona

---

## 14. Checklist review

```markdown
- [ ] Profiling justifica el cache (no es preventivo)
- [ ] Capa correcta elegida (browser/CDN/Redis/memoria)
- [ ] TTL razonado (con trade-off staleness vs carga)
- [ ] Invalidation strategy clara (TTL / on-write / event)
- [ ] Stampede protection si es hot path
- [ ] Cache opcional — app funciona si Redis down
- [ ] Headers HTTP correctos (`private` para PII, `Vary`)
- [ ] Key naming consistente + namespace
- [ ] Métricas: hits/misses/latency/evictions
- [ ] No cacheamos errores
- [ ] Tests: hit path, miss path, cache-fail path
```

---

## 15. Output final

```
✅ Caching strategy aplicada — /api/dashboard
   📊 Capa: Redis cache-aside + CDN s-maxage=60
   ⏱️  TTL: 60s (stale-while-revalidate 300s)
   🎯 Hit rate esperado: >85%
   🛡️  Stampede: single-flight habilitado
   📈 Métricas: cache_hits_total + hit_rate dashboard

Próximos pasos:
  1. Monitorear hit rate por 48h
  2. Si < 70% → ajustar TTL o key granularity
  3. Revisar DB CPU (target < 40% en hora pico)
```

## Delegación

**Coordinar con:** `backend-architect`, `sre-lead`, `database-architect`
**Reporta a:** `backend-architect`

**Skills relacionadas:**
- `/performance-test` — validar mejora real del cache
- `/observability-setup` — métricas de hit rate
- `/api-design` — headers HTTP estándar
- `/db-migrations` — índices antes de cachear (primero lo barato)
- `/incident` — muchos incidents nacen de invalidation bugs
