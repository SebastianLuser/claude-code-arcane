---
name: error-tracking
description: "Error tracking y crash reporting para apps Educabot (Go/TS/React/RN) con Bugsnag como default: source maps/symbolication, release tracking, stability score, user context sin PII, breadcrumbs, sampling, alert routing, triage. Usar para: errors, crashes, bugsnag, stack traces, source maps, dSYM, proguard, exception tracking."
argument-hint: "[setup|triage|release <version>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# error-tracking — Bugsnag Error Tracking & Crash Reporting

Guía para capturar, triagear y actuar sobre errores en apps Educabot con **Bugsnag** como proveedor default. Objetivo: **detectar antes que el usuario reporte**, con contexto suficiente para fix rápido y stability score consistente (>99.9% sessions sin error).

## Cuándo usar

- Cualquier app en prod con usuarios reales
- Staging (para detectar regressions antes de prod)
- Crashes mobile RN (símbolos iOS dSYM + Android Proguard mapping)
- Errores unhandled del backend (panics Go, unhandled rejections Node)
- Frontend errors que no llegan al backend

## Cuándo NO usar

- Tools internos small sin usuarios → logs bastan
- PoCs/scratch → `console.error`
- Métricas de negocio → no es el lugar (ver `/logging-setup`)
- Logs de auditoría → ver `/audit-log`

---

## 1. Plataforma — decisión

**Default Educabot: Bugsnag.** Razones: stability score por release, UX de triage mobile-first, symbolication iOS/Android robusta, filtros PII por defecto.

Comparación breve:

| Tool | Fuerte en | Débil en | Cuándo elegirlo |
|------|-----------|----------|-----------------|
| **Bugsnag** ✅ | Mobile, stability score, release health, triage rápido | Menos APM vs Sentry | **Default Educabot** |
| Sentry | Performance/tracing, session replay, OSS self-host | Pricing 2024+ agresivo | Si se necesita APM + errors en una tool |
| Rollbar | Simple | Momentum bajo | Legacy |
| Datadog Error Tracking | Integrado con APM/logs | $$$ | Si ya pagan DD suite |

**Un project por app** (separar `alizia-web`, `alizia-api`, `alizia-mobile`, etc.) → issues no se mezclan entre plataformas.

---

## 2. Arquitectura

```
Backend (Go/TS) → bugsnag-go / @bugsnag/js → Bugsnag SaaS
Frontend React  → @bugsnag/js + @bugsnag/plugin-react
Mobile RN       → @bugsnag/react-native (+ native dSYM/Proguard upload)
                         ↓
            Grouping + stability score + release health
                         ↓
        Alerts (Slack/PagerDuty) + Jira/ClickUp integration
```

---

## 3. Setup — Backend Go

```go
import "github.com/bugsnag/bugsnag-go/v2"

bugsnag.Configure(bugsnag.Configuration{
    APIKey:          os.Getenv("BUGSNAG_API_KEY"),
    ReleaseStage:    os.Getenv("APP_ENV"),       // production | staging | development
    AppVersion:      os.Getenv("APP_VERSION"),    // semver o git sha
    NotifyReleaseStages: []string{"production", "staging"},
    ProjectPackages: []string{"main", "github.com/educabot/alizia/**"},
})

// Gin middleware
r.Use(func(c *gin.Context) {
    defer bugsnag.AutoNotify(c.Request.Context(), c.Request)
    c.Next()
})

// manual
bugsnag.Notify(err, ctx, bugsnag.MetaData{
    "order": {"id": orderID, "tenantId": tenantID},
})
```

Panics → recovered y enviados automáticamente via `AutoNotify`.

---

## 4. Setup — Node/TS (Express/Fastify)

```ts
import Bugsnag from '@bugsnag/js';
import BugsnagPluginExpress from '@bugsnag/plugin-express';

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY!,
  releaseStage: process.env.NODE_ENV,
  appVersion: process.env.APP_VERSION,
  enabledReleaseStages: ['production', 'staging'],
  plugins: [BugsnagPluginExpress],
  redactedKeys: ['password', 'token', 'authorization', /dni/i, /cuit/i],
  onError: (event) => {
    if (event.originalError?.name === 'ValidationError') return false; // no reportar
  },
});

const middleware = Bugsnag.getPlugin('express')!;
app.use(middleware.requestHandler);
app.use(middleware.errorHandler);

// unhandled
process.on('unhandledRejection', (e) => Bugsnag.notify(e as Error));
```

---

## 5. Setup — React + Vite

```ts
import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';
import React from 'react';

Bugsnag.start({
  apiKey: import.meta.env.VITE_BUGSNAG_API_KEY,
  releaseStage: import.meta.env.MODE,
  appVersion: import.meta.env.VITE_APP_VERSION,
  plugins: [new BugsnagPluginReact()],
  redactedKeys: ['password', 'token', 'authorization'],
});

const ErrorBoundary = Bugsnag.getPlugin('react')!.createErrorBoundary(React);
```

```tsx
<ErrorBoundary FallbackComponent={Crash}>
  <App />
</ErrorBoundary>
```

### Source maps (CRÍTICO)
Sin source maps, el stack es `main.a8f3b.js:1:92834` — inútil.

```bash
# build + upload
vite build
npx @bugsnag/source-maps upload-browser \
  --api-key $BUGSNAG_API_KEY \
  --app-version $APP_VERSION \
  --directory ./dist \
  --base-url "https://app.educabot.com/"
```

**No servir `.map` públicos** — borrar del bundle público tras upload (`rm dist/**/*.map`).

---

## 6. Setup — React Native / Expo

```ts
import Bugsnag from '@bugsnag/react-native';

Bugsnag.start({
  apiKey: '...',
  releaseStage: __DEV__ ? 'development' : 'production',
  appVersion: Constants.expoConfig?.version,
  codeBundleId: Updates.updateId ?? undefined, // OTA bundle id
});
```

### Symbolication

- **iOS (dSYM):** upload en CI post-build con `bugsnag-dsym-upload`
  ```bash
  npx bugsnag-dsym-upload ios/build/Products/Release-iphoneos
  ```
- **Android (Proguard mapping):**
  ```bash
  npx bugsnag-android-mapping-upload --api-key $KEY \
    --app-version $VERSION \
    --mapping-file android/app/build/outputs/mapping/release/mapping.txt
  ```
- **Hermes:** upload source map + bytecode con `@bugsnag/source-maps upload-react-native`
- **Expo OTA:** cada update = nuevo `codeBundleId`; re-subir source map

Sin symbolication correcta → stacks ofuscados inutilizables.

---

## 7. Release tracking

```bash
# post-deploy en CI
npx @bugsnag/source-maps upload-browser \
  --api-key $BUGSNAG_API_KEY \
  --app-version $APP_VERSION \
  --directory ./dist
```

Integrar con Bugsnag Build API para reportar deploys:

```bash
curl -X POST https://build.bugsnag.com/ \
  -H 'Content-Type: application/json' \
  -d "{
    \"apiKey\": \"$BUGSNAG_API_KEY\",
    \"appVersion\": \"$APP_VERSION\",
    \"releaseStage\": \"production\",
    \"sourceControl\": {
      \"provider\": \"github\",
      \"repository\": \"https://github.com/educabot/alizia\",
      \"revision\": \"$GIT_SHA\"
    }
  }"
```

Beneficio: stability score por release → "v2.4.0 introdujo regresión vs v2.3.9" queda obvio.

---

## 8. User context & breadcrumbs

```ts
Bugsnag.setUser(user.id, undefined, user.username); // ⚠️ no mandar email de menores
Bugsnag.addMetadata('tenant', { id: tenantId, plan: tenant.plan });
Bugsnag.addMetadata('session', { locale, appVersion, featureFlags });
```

### Breadcrumbs (auto + manual)
Bugsnag captura automáticamente: navigation, fetch, console, touch events. Agregar manuales en flows críticos:

```ts
Bugsnag.leaveBreadcrumb('Checkout started', { orderId, amount }, 'navigation');
Bugsnag.leaveBreadcrumb('Payment confirmed', { orderId, provider: 'stripe' }, 'state');
```

Breadcrumbs = últimos 50 eventos antes del error. **Oro para debugging.**

---

## 9. PII / Consent — scrubbing

Nunca enviar a Bugsnag:
- Password, tokens, API keys, cookies
- DNI, CPF, CUIT completos
- Datos de pago (PAN, CVV)
- Emails de menores
- Contenido libre de usuarios (puede ser sensible en edu)

```ts
Bugsnag.start({
  // ...
  redactedKeys: [
    'password', 'token', 'authorization', 'cookie',
    /^dni$/i, /^cuit$/i, /^cpf$/i,
    /credit.?card/i, /cvv/i,
  ],
  onError: (event) => {
    // strip extra si detectás algo en metadata libre
    delete event.request?.headers?.authorization;
    return true;
  },
});
```

**Respetar consent (`/consent-cookies`):** si usuario rechazó analytics/crash reporting, no inicializar Bugsnag en ese cliente o llamar `Bugsnag.pauseSession()`.

**Menores:** no mandar email/nombre real — solo `user.id` interno.

---

## 10. Sampling & ruido

### Error capture: 100%
No samplear errores — queremos todos.

### Filtrar ruido conocido

```ts
onError: (event) => {
  const msg = event.errors[0]?.errorMessage ?? '';
  if (msg.includes('ResizeObserver loop limit')) return false;
  if (msg.includes('Non-Error promise rejection')) return false;
  if (event.request?.url?.startsWith('chrome-extension://')) return false;
  return true;
};
```

### Dedupe burst client-side
```ts
let lastKey = '', lastTs = 0;
Bugsnag.addOnError((event) => {
  const key = event.errors[0]?.errorMessage ?? '';
  const now = Date.now();
  if (key === lastKey && now - lastTs < 5000) return false;
  lastKey = key; lastTs = now;
});
```

---

## 11. Grouping / fingerprinting

Bugsnag agrupa por stack+message default. Cuando agrupa mal:

```ts
Bugsnag.addOnError((event) => {
  if (event.context === 'stripe-webhook') {
    event.groupingHash = `stripe-webhook:${event.errors[0].errorMessage}`;
  }
});
```

Casos comunes Educabot:
- Network errors con URL variable → agrupar por endpoint, no URL completa
- Validation errors con mensaje dinámico → agrupar por `error.code`
- Extensions de Chrome inyectando errores → filtrar

---

## 12. Alertas & routing

### Bugsnag → Slack
- **New issue en production** → `#alerts-prod`
- **Regression** (issue resolved reapareció) → Slack + reopen ticket
- **Spike:** >10x errors en 5min → PagerDuty on-call
- **Stability score** crash-free < 99.5% mobile → alert weekly

Config en Bugsnag → Dashboard → Integrations.

### Jira / ClickUp integration
- Crear ticket desde issue con 1 click
- Bugsnag Data Forwarding actualiza el ticket al resolver
- Link bidireccional

### Anti-fatiga
- No alertar severity `info` a on-call
- Staging: solo Slack, nunca page
- Dedupe por `releaseStage + appVersion`

---

## 13. Triage workflow

### Diario (on-call)
1. Inbox de "new" en últimas 24h
2. Clasificar: `bug` (fix), `noise` (snooze + filtro), `regression` (hotfix)
3. Asignar owner (por tag `area`)
4. Link a Jira si fix > 1h

### Weekly review
- Top 10 por frecuencia
- Top 10 por users afectados
- Stability score por release
- Acciones: priorizar en sprint, deprecate, deep-dive

### SLO
- **Nueva issue crítica** triaged < 1h
- **High-freq issue** ticketeada < 1 día
- **Resolved** marcado tras deploy del fix

---

## 14. Frontend — capturing the right things

```ts
// network errors con contexto
try { await api.get('/courses'); }
catch (err: any) {
  Bugsnag.notify(err, (event) => {
    event.addMetadata('request', {
      url: err.config?.url,
      status: err.response?.status,
    });
    event.groupingHash = `${err.config?.url}:${err.response?.status}`;
  });
}

// React Query
new QueryClient({
  queryCache: new QueryCache({
    onError: (err, query) => {
      Bugsnag.notify(err as Error, (ev) => {
        ev.addMetadata('query', { key: String(query.queryKey) });
      });
    },
  }),
});
```

---

## 15. Anti-patterns

- ❌ `apiKey` hardcoded en repo — siempre via env / secret manager
- ❌ Sin source maps / dSYM / Proguard mapping en prod → traces inútiles
- ❌ Source maps `.map` servidos públicos — solo subir a Bugsnag
- ❌ Samplear errors < 100% → perdés rares críticos
- ❌ Enviar PII (email, DNI, tokens) → fine GDPR/LGPD
- ❌ Enviar datos de menores sin consent del tutor
- ❌ Un solo project Bugsnag para todas las apps → issues mezclados
- ❌ Release sin `appVersion` + commit → regressions imposibles de atribuir
- ❌ Sin `releaseStage` → staging/prod se mezclan
- ❌ Alertar severity `info`/`warning` → fatiga, nadie mira
- ❌ Ignorar ruido en vez de filtrar → ahoga señal
- ❌ No actuar sobre issues de alta frecuencia (son los más baratos)
- ❌ Bugsnag como logger general — usar `/logging-setup` (slog/pino) para logs
- ❌ `console.log(err)` en catch sin `notify` → error perdido
- ❌ Olvidar `Bugsnag.flush()` (Go) en workers/scripts cortos → errores truncados
- ❌ Exponer la app `apiKey` sin allowlist de dominios en dashboard Bugsnag

---

## 16. Seguridad

- [ ] `apiKey` backend en Secret Manager (`/secret-management`)
- [ ] `apiKey` frontend con allowlist de dominios en Bugsnag dashboard
- [ ] `redactedKeys` cubre passwords/tokens/PII
- [ ] Source maps no accesibles públicamente
- [ ] Retention alineado con política (default Bugsnag varía por plan)
- [ ] Access al project por roles (viewer / dev / admin)
- [ ] 2FA obligatorio en cuentas Bugsnag
- [ ] Integración con `/consent-cookies` — pause si usuario rechazó

---

## 17. Checklist review

```markdown
- [ ] Projects separados por app (web/mobile/api)
- [ ] API keys por env (dev/staging/prod) vía env vars
- [ ] releaseStage + appVersion configurados
- [ ] Build reporter en CI post-deploy
- [ ] Source maps subidos (browser + Hermes) y no públicos
- [ ] dSYM iOS + Proguard mapping Android subidos en CI
- [ ] redactedKeys verificado con test event (¿PII escapa?)
- [ ] ErrorBoundary en React root
- [ ] process.on('unhandledRejection') en Node
- [ ] bugsnag.AutoNotify middleware en Go
- [ ] Breadcrumbs personalizados en flows críticos (checkout, login, grade-submit)
- [ ] User id + tenantId en metadata (sin email/PII)
- [ ] onError filter para ruido conocido
- [ ] Alertas solo para issues accionables
- [ ] Slack + Jira/ClickUp integration activa
- [ ] Triage docs (daily + weekly) en runbook
```

---

## 18. Output final

```
✅ Error tracking — Alizia (Bugsnag)
   🐛 Bugsnag SaaS, projects: alizia-web / alizia-mobile / alizia-api
   🏷️  releaseStage + appVersion (git SHA) + Build Reporter en CI
   🗺️  Source maps browser + Hermes + dSYM iOS + Proguard Android
   👤 user.id + tenantId en metadata (sin email/PII)
   🔐 redactedKeys: password, token, authorization, dni, cuit, cpf
   🔇 onError filter: ResizeObserver, chrome-extension, validation
   📱 Mobile stability score target > 99.9% crash-free sessions
   📨 Alertas: new/regression → Slack; spike → PagerDuty
   🎫 Jira auto-ticket para severity=error
   🔗 Consent-aware: Bugsnag.pauseSession() si user rechazó

Próximos pasos:
  1. Dashboard "stability score" semanal para producto
  2. SLO: new critical issue triaged < 1h
  3. Auditar redactedKeys con test payload con DNI/CUIT fake
```

## Delegación

**Coordinar con:** `backend-architect`, `frontend-architect`, `mobile-lead`, `sre-lead`, `security-architect`
**Reporta a:** `sre-lead`

**Skills relacionadas:**
- `/logging-setup` — logs estructurados complementan errors (slog/pino)
- `/secret-management` — API keys en Secret Manager
- `/consent-cookies` — pausar Bugsnag si usuario rechazó crash reporting
- `/audit-log` — acciones auditables, no errores técnicos
- `/incident` — spike de errores como señal de incident
- `/deploy-check` — build reporter + source maps en pipeline
- `/api-versioning` — tagging de release por versión de API
