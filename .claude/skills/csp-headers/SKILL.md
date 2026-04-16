---
name: csp-headers
description: Configurar security headers (CSP, HSTS, Permissions-Policy, COOP/COEP) en backends Go/TS y Cloudflare. Prevenir XSS, clickjacking, MIME sniffing. Usar cuando se mencione CSP, Content-Security-Policy, security headers, HSTS, XSS, headers de seguridad, securityheaders.com.
---

# CSP & Security Headers

Configuración de headers de seguridad para stack Educabot (Go + TS backends, React + Vite frontends, Cloudflare CDN). Default deny, nonces en CSP, report-only antes de enforce.

## Cuándo usar

- Nuevo backend/frontend que expone HTTP público
- Score bajo en `securityheaders.com` o `csp-evaluator.withgoogle.com`
- Auditoría de seguridad (pentest, compliance, SOC2)
- Incidente XSS o clickjacking reportado
- Migración a nonces después de haber vivido con `unsafe-inline`

## Cuándo NO usar

- Endpoints internos sin exposición pública (VPN only)
- Prototipos efímeros (pero si va a prod, sí)
- Microservicios backend-to-backend sin browser (ahí mTLS > CSP)

---

## 1. Headers críticos (stack 2026)

| Header | Objetivo | Criticidad |
|---|---|---|
| `Content-Security-Policy` | Prevenir XSS, data exfiltration | ALTA |
| `Strict-Transport-Security` | Forzar HTTPS, evitar SSL strip | ALTA |
| `X-Content-Type-Options: nosniff` | Evitar MIME sniffing | MEDIA |
| `Referrer-Policy: strict-origin-when-cross-origin` | No leak de URLs con query params | MEDIA |
| `Permissions-Policy` | Deshabilitar APIs (cam/mic/geo) no usadas | MEDIA |
| `Cross-Origin-Opener-Policy: same-origin` | Aislar browsing context | MEDIA |
| `Cross-Origin-Embedder-Policy: require-corp` | Habilitar SharedArrayBuffer seguro | BAJA |
| `X-Frame-Options: DENY` | Clickjacking (legacy; CSP `frame-ancestors` lo supera) | MEDIA |

`X-XSS-Protection` está **deprecado** — solo CSP.

---

## 2. CSP estricta default Educabot

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{RANDOM}' 'strict-dynamic';
  style-src 'self' 'nonce-{RANDOM}';
  img-src 'self' data: https://cdn.educabot.com https://lh3.googleusercontent.com;
  font-src 'self' data:;
  connect-src 'self' https://api.educabot.com https://*.bugsnag.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
  report-uri https://educabot.report-uri.com/r/d/csp/enforce;
```

### Nonces

- Generar **128-bit random** por request (crypto-secure, no Math.random)
- Inyectar en `<script nonce="X">` y `<style nonce="X">` server-side
- NUNCA `unsafe-inline` junto con nonce (el browser ignora el nonce si hay `unsafe-inline`)

### `strict-dynamic`

- Scripts con nonce pueden cargar otros scripts dinámicamente
- Reemplaza whitelist de dominios (`cdn.ejemplo.com` etc), que es débil contra JSONP bypass
- Preferido en 2026

### Vite + React SPA

- Sin SSR, nonces son complicados (HTML es estático desde CDN)
- Opciones:
  1. `vite-plugin-csp-guard` — genera hashes SHA256 de scripts inline en build time
  2. SSR con Remix/Next (si aplica) — nonce por request
  3. Proxy que reescribe HTML e inyecta nonce (Go/TS middleware)
- Para assets con hash de Vite (`app.abc123.js`), `script-src 'self'` alcanza

---

## 3. Report-only primero, enforce después

Nunca hacer enforce de CSP estricta directo en prod. Romperás widgets, analytics, etc.

**Fase 1 — Report-only (2-4 semanas):**
```
Content-Security-Policy-Report-Only: <policy>; report-uri /csp-report
```

**Fase 2 — Analizar reports:**
- Agrupá violaciones por `blocked-uri` y `violated-directive`
- Decidí: whitelistear, remover, o mover a dominio propio
- Servicios: `report-uri.com`, Sentry CSP, Bugsnag, endpoint propio

**Fase 3 — Enforce:**
```
Content-Security-Policy: <policy>
```

### Endpoint de reports (Go)

```go
func cspReportHandler(w http.ResponseWriter, r *http.Request) {
    var report struct {
        CSPReport struct {
            DocumentURI        string `json:"document-uri"`
            Referrer           string `json:"referrer"`
            ViolatedDirective  string `json:"violated-directive"`
            EffectiveDirective string `json:"effective-directive"`
            OriginalPolicy     string `json:"original-policy"`
            BlockedURI         string `json:"blocked-uri"`
            LineNumber         int    `json:"line-number"`
        } `json:"csp-report"`
    }
    if err := json.NewDecoder(r.Body).Decode(&report); err != nil {
        http.Error(w, "bad report", 400)
        return
    }
    log.Printf("[CSP] %s blocked %s on %s",
        report.CSPReport.ViolatedDirective,
        report.CSPReport.BlockedURI,
        report.CSPReport.DocumentURI,
    )
    w.WriteHeader(204)
}
```

---

## 4. HSTS

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

- `max-age=63072000` = 2 años (mínimo para preload list)
- `includeSubDomains` — obligatorio en prod, cuidado si tenés subdominios HTTP legacy
- `preload` — después submit en `https://hstspreload.org/`

**Advertencia:** una vez en preload list, es **difícil salir** (meses). Probá primero con max-age corto (300s), después escalá.

---

## 5. Permissions-Policy (default restrictivo)

```
Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(self), usb=(), interest-cohort=()
```

- `()` = deshabilitado totalmente
- `(self)` = solo origin propio
- `(self "https://trusted.com")` = origin propio + trusted
- `interest-cohort=()` opta out de FLoC/Topics (Chrome tracking)

Si Educabot usa webcam para alguna app educativa:
```
Permissions-Policy: camera=(self), microphone=(self), geolocation=()
```

---

## 6. Implementación Go (chi / Gin)

```go
package middleware

import (
    "crypto/rand"
    "encoding/base64"
    "fmt"
    "net/http"
)

func generateNonce() string {
    b := make([]byte, 16)
    rand.Read(b)
    return base64.StdEncoding.EncodeToString(b)
}

type contextKey string
const NonceKey contextKey = "csp-nonce"

func SecurityHeaders(reportOnly bool) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            nonce := generateNonce()
            ctx := context.WithValue(r.Context(), NonceKey, nonce)

            csp := fmt.Sprintf(
                "default-src 'self'; "+
                "script-src 'self' 'nonce-%s' 'strict-dynamic'; "+
                "style-src 'self' 'nonce-%s'; "+
                "img-src 'self' data: https://cdn.educabot.com; "+
                "connect-src 'self' https://api.educabot.com; "+
                "frame-ancestors 'none'; "+
                "base-uri 'self'; "+
                "form-action 'self'; "+
                "upgrade-insecure-requests; "+
                "report-uri /csp-report",
                nonce, nonce,
            )

            headerName := "Content-Security-Policy"
            if reportOnly {
                headerName = "Content-Security-Policy-Report-Only"
            }
            w.Header().Set(headerName, csp)
            w.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
            w.Header().Set("X-Content-Type-Options", "nosniff")
            w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
            w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()")
            w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
            w.Header().Set("X-Frame-Options", "DENY")

            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}

// Uso en templates:
// nonce := r.Context().Value(middleware.NonceKey).(string)
// <script nonce="{{.Nonce}}">...</script>
```

---

## 7. Implementación TS (Express / Fastify)

```ts
import helmet from "helmet";
import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

// Helmet defaults son permisivos — override CSP
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString("base64");
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", (_req, res) => `'nonce-${(res as any).locals.cspNonce}'`, "'strict-dynamic'"],
        styleSrc: ["'self'", (_req, res) => `'nonce-${(res as any).locals.cspNonce}'`],
        imgSrc: ["'self'", "data:", "https://cdn.educabot.com"],
        connectSrc: ["'self'", "https://api.educabot.com", "https://*.bugsnag.com"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
        reportUri: ["/csp-report"],
      },
      reportOnly: process.env.CSP_REPORT_ONLY === "true",
    },
    strictTransportSecurity: { maxAge: 63072000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
  })
);

// Permissions-Policy manual (helmet no lo cubre completo)
app.use((_req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  next();
});
```

---

## 8. Cloudflare

**Preferir headers desde origin** (Go/TS) con Cloudflare pass-through — más testeable y consistente entre envs.

Si hay que hacerlo en Cloudflare:

### Transform Rules (UI)

- Rules → Transform Rules → Modify Response Header
- Set static: `Strict-Transport-Security`, `X-Content-Type-Options`, etc.
- Limitación: no podés generar nonces por request (estáticos only)

### Workers (flexible, nonces per-request)

```js
export default {
  async fetch(request, env) {
    const response = await fetch(request);
    const nonce = crypto.randomUUID().replace(/-/g, "");
    const newResponse = new Response(response.body, response);

    newResponse.headers.set("Content-Security-Policy",
      `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; ...`
    );
    newResponse.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    newResponse.headers.set("X-Content-Type-Options", "nosniff");
    newResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Rewrite HTML para inyectar nonce
    return new HTMLRewriter()
      .on("script", { element(el) { el.setAttribute("nonce", nonce); } })
      .on("style", { element(el) { el.setAttribute("nonce", nonce); } })
      .transform(newResponse);
  },
};
```

---

## 9. Iframes y embedding

Educabot embebe contenido educativo (Classroom, Genially, YouTube edu):

```
frame-src 'self' https://www.youtube-nocookie.com https://view.genially.com https://classroom.google.com;
```

- `frame-src` controla qué puede embeber **tu** página
- `frame-ancestors` controla quién puede embeber **a vos** (usar `'none'` salvo caso explícito)
- Si una app Educabot necesita ser embebida en LMS externo (Moodle, etc.), whitelist explícito en `frame-ancestors`

---

## 10. Testing

1. **securityheaders.com** — score A+ objetivo
2. **csp-evaluator.withgoogle.com** — análisis de directivas, detecta `unsafe-*`
3. **hstspreload.org** — validar HSTS antes de submit
4. **Local:**
   ```bash
   curl -I https://tu-app.educabot.com | grep -iE "csp|strict-transport|frame|referrer|permissions"
   ```
5. **Browser DevTools → Network → Response Headers** — verificar nonces cambian por request
6. **Violaciones:** abrir DevTools Console en modo report-only para ver `[Report Only] Refused to execute...`

---

## Anti-patterns

- ❌ `'unsafe-inline'` o `'unsafe-eval'` en `script-src` → anula CSP contra XSS
- ❌ `*` en cualquier directiva → permite todo
- ❌ CSP solo en `<meta http-equiv>` → bypasseable, preferir header HTTP
- ❌ HSTS sin `includeSubDomains` en prod → subdominios quedan expuestos a SSL strip
- ❌ Headers solo en algunas rutas → debe ser middleware global
- ❌ No monitorear CSP reports → ciego ante ataques y regresiones
- ❌ Enforce directo sin fase report-only → rompés prod garantizado
- ❌ `X-XSS-Protection: 1; mode=block` → deprecado, removelo
- ❌ Whitelist de dominios en lugar de `strict-dynamic` → JSONP bypass conocido
- ❌ Nonces generados con `Math.random()` → predecibles, usar crypto
- ❌ Mismo nonce reutilizado entre requests → anula el propósito
- ❌ `report-uri` pero sin endpoint real que persista → reports al vacío
- ❌ `frame-ancestors *` → clickjacking habilitado

---

## Checklist pre-deploy

- [ ] CSP en report-only mode durante 2-4 semanas antes de enforce
- [ ] Endpoint `/csp-report` existe, persiste, y tiene dashboard/alertas
- [ ] Nonces generados con CSPRNG (crypto.randomBytes / crypto/rand)
- [ ] Sin `unsafe-inline` ni `unsafe-eval` en `script-src`
- [ ] `strict-dynamic` en vez de whitelist de dominios
- [ ] HSTS con `includeSubDomains` y `preload` (si va a preload list)
- [ ] `X-Content-Type-Options: nosniff` presente
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` deshabilita APIs no usadas
- [ ] `frame-ancestors 'none'` (o whitelist explícito si se embebe)
- [ ] Headers aplicados como middleware **global**, no por-ruta
- [ ] Testeado en `securityheaders.com` (score A+) y `csp-evaluator.withgoogle.com`
- [ ] `X-XSS-Protection` removido
- [ ] Cloudflare no duplica ni pisa headers de origin
- [ ] Dev/staging tienen los mismos headers que prod (solo cambia `report-only`)

---

## Output esperado ✅

- Middleware de security headers aplicado global en backend
- CSP estricta con nonces, sin `unsafe-*`
- Report-only durante periodo de observación, luego enforce
- Endpoint de reports + dashboard/alertas
- Score A+ en securityheaders.com
- 0 violaciones en console del browser para flujos legítimos

---

## Delegación

- **Auditoría previa de seguridad general:** `/audit-dev`
- **Checklist pre-deploy completa:** `/deploy-check`
- **Documentar decisión arquitectónica:** `/doc-rfc`
- **Post-mortem tras incidente XSS/clickjacking:** `/incident`
- **Scaffolding Go con headers ya incluidos:** `/scaffold-go`
