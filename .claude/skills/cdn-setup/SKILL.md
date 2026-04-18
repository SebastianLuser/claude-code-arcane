---
name: cdn-setup
description: "CDN para apps Educabot: Cloudflare, Fastly, Cloud CDN (GCP), CloudFront, cache headers, immutable assets, stale-while-revalidate, signed URLs, image optimization, LatAm PoPs, purge, cache keys, bypass cookies, WAF+CDN. Usar para: cdn, cloudflare, fastly, cache-control, edge, cloudfront, image optimization, signed urls, purge."
argument-hint: "[provider: cloudflare|fastly|gcp|aws]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# cdn-setup — CDN & Edge Caching

Usar CDN para reducir latencia en LatAm + servir estáticos baratos. Target: **cache hit > 90% en assets, TTFB < 100ms en AR/BR/MX**.

## Cuándo usar

- Cualquier app web/mobile con assets estáticos (JS/CSS/imgs/fonts)
- API pública o semi-pública con respuestas cacheables
- PDFs/videos/archivos generados (signed URL + edge)
- Protección DDoS / WAF / bot mitigation

## Cuándo NO usar

- Intranet / tools internos chicos
- APIs 100% dinámicas con per-user data (no hay nada que cachear — igual hay valor por TLS terminación + WAF)

---

## 1. Provider — decisión

| Provider | Pros | Cons | Cuándo |
|----------|------|------|--------|
| **Cloudflare** | LatAm PoPs sólidos, pricing generoso (free tier real), Workers, R2 | Limitado customization cache profundo vs Fastly | **Default Educabot** |
| **Fastly** | Control VCL, perf top, purge instantáneo | $$, aprendizaje VCL | E-comm/media con SLA estricto |
| **GCP Cloud CDN** | Integra GCS+Load Balancer nativo, IAM | Features menos que CF | Stack 100% GCP |
| **AWS CloudFront** | Integra S3+Lambda@Edge | UX vieja, Latam PoPs OK | Stack AWS |
| **Bunny.net** | Cheap, fast, UX simple | Menos features enterprise | Proyectos chicos / media |
| **Akamai** | Enterprise legacy | Caro, UX anticuada | Banca/gov |

**Default Educabot:** Cloudflare (DNS + CDN + WAF + R2) + GCP Cloud CDN cuando origin es GCS directo.

---

## 2. Arquitectura

```
User (AR/BR/MX) ──► CDN edge PoP ──► Origin (Cloud Run / GCS)
                      │  cache
                      │  WAF
                      │  TLS
                      ▼
                 90%+ hit = origen no toca
```

Capas:
1. **DNS** (Cloudflare / Route53)
2. **Edge** (cache + compute + WAF)
3. **Origin shield** (regional cache antes del origin)
4. **Origin** (Cloud Run, GCS, API)

---

## 3. Cache-Control — lo que importa

### Immutable assets (JS/CSS/fonts con hash en nombre)
```
Cache-Control: public, max-age=31536000, immutable
```
- `immutable` evita revalidación — el browser ni pregunta
- Filename con hash (`app.a8f3b.js`) → nueva build = nuevo URL

### HTML
```
Cache-Control: public, max-age=0, must-revalidate
```
- No cachear el HTML largo — querés deploys instant
- Edge puede hacer SWR (ver abajo)

### API público de lectura
```
Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600
```
- `max-age=60`: browser
- `s-maxage=300`: CDN (más largo)
- `stale-while-revalidate=600`: servir stale + refetch en background

### API privado / user-specific
```
Cache-Control: private, no-store
```
- Nunca cachear en CDN compartido

### Imágenes de usuario (upload)
```
Cache-Control: public, max-age=604800   # 7d
```
+ invalidación al cambiar (URL con hash o purge).

---

## 4. Stale-while-revalidate (SWR)

La feature que más mejora perceived perf:

```
Cache-Control: max-age=60, stale-while-revalidate=600
```

Request dentro de `max-age`: fresh, nothing to do.
Request `60s-660s` después: **sirve stale inmediato** + refetch background.
Request `>660s`: fetch sincrónico al origin.

Ideal para:
- Feeds paginados (últimos 60s fresh, próximos 10min stale-safe)
- Perfiles públicos
- Catálogos

No usar para: carritos, auth, checkout, balance.

---

## 5. Cache key — lo que importa

Por default CDN agrupa por `host + path`. Problema: `?sessionId=X` crea cache keys distintos → 0% hit.

### Cloudflare — Cache Rules
```
# Stripear query params no relevantes
Query string: Ignore all but: ["v", "lang"]
```

### Bypass cookies
Si response tiene `Set-Cookie` → por default no cachea. Si la respuesta **no depende** del cookie (ej. CSRF genérico), strippear en la edge o no usar `Set-Cookie` en esa route.

### Vary
```
Vary: Accept-Encoding   # OK, CDN lo maneja
Vary: Accept-Language   # OJO: explota el cache key, usar con cuidado
Vary: User-Agent        # NUNCA — destruye cache
```

Para localización usar **path prefix** (`/es/`, `/pt/`), no `Vary: Accept-Language`.

---

## 6. Cloudflare — setup

### Básico
1. DNS en CF, orange cloud ON (proxied)
2. SSL/TLS → Full (strict) con cert válido en origin
3. Always Use HTTPS + HSTS
4. Brotli ON
5. HTTP/3 + 0-RTT ON
6. Cache Level: Standard (o Aggressive si JS/CSS con hash)

### Cache Rules (reemplaza Page Rules desde 2024)
```
Rule 1: "/assets/*"
  Cache eligibility: Eligible
  Edge TTL: Override origin, 1 year
  Browser TTL: 1 year

Rule 2: "/api/public/*"
  Cache eligibility: Eligible
  Edge TTL: 5 min
  Cache key: ignore query params except ?lang

Rule 3: "/api/*" (fallback)
  Cache eligibility: Bypass
```

### Origin shield (Tiered Cache)
Activar "Argo Tiered Cache" — reduce requests al origin (un PoP regional agrupa pedidos antes de ir al origin).

---

## 7. GCP Cloud CDN

```hcl
resource "google_compute_backend_bucket" "static" {
  name        = "alizia-static"
  bucket_name = google_storage_bucket.static.name
  enable_cdn  = true
  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    default_ttl       = 3600
    max_ttl           = 86400
    client_ttl        = 3600
    negative_caching  = true
    serve_while_stale = 86400
  }
}
```

- `CACHE_ALL_STATIC`: usa Cache-Control del origin + fallback a types estáticos
- `USE_ORIGIN_HEADERS`: respeta solo Cache-Control
- Negative caching: cachea 4xx/5xx cortitos para proteger origin

---

## 8. Assets build — Vite

```ts
// vite.config.ts
export default {
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
  },
};
```

+ server config:
- `index.html` → `max-age=0, must-revalidate`
- `/assets/*` → `max-age=31536000, immutable`

Deploy atómico: subir assets **antes** que el HTML que los referencia (sino 404 temporal).

---

## 9. Imágenes — optimización

### Cloudflare Images / Polish
- Auto WebP/AVIF por User-Agent
- Resize on-the-fly: `/cdn-cgi/image/width=400,quality=80,format=auto/https://origin/photo.jpg`
- Polish: recompress/strip metadata automático

### imgproxy self-host
```
https://imgproxy.educabot.com/signature/resize:fit:400:400/plain/gs://bucket/avatar.jpg@webp
```
Genera URL firmada + transforma.

### Reglas
- `width`/`height` server-side, no con CSS (user baja 4MB para mostrar 200px)
- WebP primero, AVIF si está (60% más chico que JPEG)
- LCP image con `fetchpriority="high"` + preload
- Lazy loading `<img loading="lazy">` excepto above-the-fold
- `srcset` + `sizes` para responsive
- SVG inline si es <2KB

---

## 10. Signed URLs

Para contenido privado (boletines, videos, documentos de tenant):

### GCS V4 Signed URL
```ts
const [url] = await storage.bucket(b).file(path).getSignedUrl({
  version: 'v4',
  action: 'read',
  expires: Date.now() + 24*60*60*1000,
});
```

### Cloudflare Signed URLs (R2 / Cache Rules)
Workers token verifier + `X-Signed-Key` header.

### Reglas
- Expiración corta (24-72h para docs user, 1h para previews)
- Una URL por user (no compartir) — audit log de descargas
- No meter secrets en query string de la URL pública — usar signature solo
- Revocar: rotar la signing key = invalida todas las URLs antiguas (blast radius — ojo)

---

## 11. Purge / invalidation

### Cloudflare
- **By URL**: `POST /zones/:zone/purge_cache { files: [url, ...] }`
- **By tag** (Enterprise): `Cache-Tag: user-123,course-456` en response → purge por tag
- **Purge everything**: emergency only

### GCP Cloud CDN
```bash
gcloud compute url-maps invalidate-cdn-cache $MAP --path "/api/public/*"
```
Lento (minutos), caro si se hace muy seguido.

### Reglas
- **Preferir cache busting (URL con hash) a purge** — es instant + sin costo
- Purge en deploys: listar URLs cambiadas, no "purge everything"
- Rate limit purge: API tiene limits, planificar

---

## 12. HTTP/3, Brotli, 0-RTT

Activar en CDN:
- **Brotli** compression: ~20% mejor que gzip en text
- **HTTP/3 (QUIC)**: mejor en redes móviles/flakey (AR/BR carriers)
- **0-RTT**: reduce 1 RTT en re-conexión TLS — OK para GET idempotente, NO para POST

---

## 13. WAF + bot mitigation

CF WAF rules útiles:
- Bloquear requests con `User-Agent` vacío o sospechoso
- Rate limit `/api/auth/*` (login/signup) por IP
- Challenge países fuera del target (si el producto es solo LatAm)
- Block patterns SQLi/XSS (managed ruleset ON)
- Super Bot Fight Mode (clasifica bots)

Nota: no confiar **solo** en CDN WAF — rate limiting también en origin.

---

## 14. Origin health

- **Origin allowlist**: origin acepta conexión solo desde IPs de CF / GCP CDN — evita bypass al CDN
- Cloudflare Authenticated Origin Pull (mTLS origin<-edge)
- Health checks del CDN → failover a backup origin si hay uno
- Origin timeouts: 30-60s; CDN reintenta con backoff

---

## 15. Observabilidad CDN

Métricas a mirar:
- **Cache hit ratio** por path (target >90% estáticos, >70% API cacheable)
- **p95 TTFB** por país/PoP
- **4xx/5xx** en edge vs origin (si 5xx edge alto, origin suda)
- **Bandwidth** (cost)
- **WAF blocks** (picos = ataque o falso positivo)

Logs a BigQuery/S3 con Logpush (CF) o Log Sink (GCP).

---

## 16. React Native / mobile

Assets del bundle no pasan por CDN (están en el device), pero:
- Imágenes remotas → CDN (`react-native-fast-image` respeta cache headers)
- API cacheable → hit CDN edge desde mobile
- OTA updates (Expo EAS) → servidos por CDN automáticamente
- Evitar `?t=${Date.now()}` cache-busting → destruye hit ratio

---

## 17. Anti-patterns

- ❌ Assets sin hash en nombre → cache busting via purge (lento) o query param (parcial)
- ❌ `Cache-Control: no-cache` en todo "por las dudas" → LCP se va al tacho
- ❌ `Vary: User-Agent` → cache key explode
- ❌ Query params volátiles (trackers) sin strippear → miss ratio alto
- ❌ HTML con `max-age=1h` + deploy instantáneo esperado → users ven mix de versiones
- ❌ Servir imgs 4000px para thumbnails de 200px
- ❌ Signed URL con expiración de días + sin revocación
- ❌ Purge all en cada deploy → caro + latency spike
- ❌ CDN encima del origin sin allowlist → alguien hits directo = bypass WAF
- ❌ Certificados self-signed en origin + CF Full (strict) → 526 error
- ❌ `Set-Cookie` en responses que deberían ser cacheables → no cacheables
- ❌ Orange cloud off en prod (pasa directo) por "debugging" → olvidado
- ❌ Infinite TTL sin plan de purge

---

## 18. Checklist review

```markdown
- [ ] Provider elegido (CF default)
- [ ] DNS proxied / CDN activo en producción
- [ ] TLS Full (strict) con cert válido en origin
- [ ] HSTS + HTTP/2/3 + Brotli ON
- [ ] Cache-Control correcto por tipo (immutable assets, SWR API, no-store privado)
- [ ] Hash en filenames de assets
- [ ] Cache rules / key normalization configuradas
- [ ] Origin shield / tiered cache activo
- [ ] Imágenes optimizadas (WebP/AVIF, resize on-the-fly)
- [ ] Signed URLs para contenido privado con expiry corta
- [ ] WAF rules base + rate limit auth endpoints
- [ ] Origin allowlist (solo IPs del CDN)
- [ ] Purge strategy: hash-first, by URL, nunca "all"
- [ ] Monitoring: cache hit ratio, TTFB por país, WAF blocks
- [ ] Logpush a BigQuery para analytics
```

---

## 19. Output final

```
✅ CDN — Alizia
   🌐 Cloudflare (DNS + CDN + WAF + R2)
   🧊 Cache: assets immutable 1yr, HTML revalidate, API SWR 5min
   🗝️  Signed URLs 24-72h para boletines/docs privados
   🖼️  Cloudflare Images: auto WebP/AVIF + resize on-the-fly
   🛡️  WAF managed + rate limit /auth + origin allowlist
   📊 Cache hit ratio: 94% assets, 72% API pública
   📍 PoPs LatAm: AR, BR, MX, CO, CL — TTFB p95 < 80ms

Próximos pasos:
  1. Cache-Tag por tenant para purge granular
  2. Workers para A/B en edge sin pegarle al origin
  3. Dashboard mensual: hit ratio + bandwidth por ruta
```

## Delegación

**Coordinar con:** `cloud-architect`, `frontend-architect`, `security-architect`, `sre-lead`
**Reporta a:** `cloud-architect`

**Skills relacionadas:**
- `/pdf-generation` — signed URLs para PDFs servidos vía CDN
- `/security-hardening` — WAF rules + origin allowlist
- `/observability-setup` — métricas edge
- `/deploy-check` — assets atomicity + purge en pipeline
- `/monorepo-setup` — build assets con hash en filename
