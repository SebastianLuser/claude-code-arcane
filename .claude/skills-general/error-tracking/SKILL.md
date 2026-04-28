---
name: error-tracking
description: "Error tracking y crash reporting para apps Educabot (Go/TS/React/RN) con Bugsnag: source maps, symbolication, release tracking, stability score, PII scrubbing, triage."
argument-hint: "[setup|triage|release <version>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# error-tracking — Bugsnag Error Tracking

**Default Educabot: Bugsnag.** Un project por app (separar web/mobile/api). Target: >99.9% crash-free sessions.

## Platform Decision

| Tool | Fuerte en | Cuándo |
|------|-----------|--------|
| **Bugsnag** | Mobile stability, triage, symbolication | **Default** |
| Sentry | APM + errors + replay en una tool | Si se necesita APM integrado |
| Datadog Error Tracking | Integrado con APM/logs | Si ya pagan DD suite |

## Setup por Stack

### Go Backend
- `bugsnag-go/v2`: Configure con APIKey, ReleaseStage, AppVersion, ProjectPackages
- Gin middleware: `defer bugsnag.AutoNotify(ctx, req)`. Panics auto-recovered
- Manual: `bugsnag.Notify(err, ctx, bugsnag.MetaData{...})`

### Node/TS (Fastify/Express)
- `@bugsnag/js` + plugin express. `redactedKeys` para PII
- `onError` filter para no reportar ValidationError
- `process.on('unhandledRejection', Bugsnag.notify)`

### React + Vite
- `@bugsnag/plugin-react` ErrorBoundary wrapping `<App />`
- **Source maps crítico:** upload con `@bugsnag/source-maps upload-browser` en CI. No servir `.map` públicos

### React Native / Expo
- `@bugsnag/react-native` con `codeBundleId` para OTA updates
- **Symbolication:** dSYM iOS (`bugsnag-dsym-upload`), Proguard Android, Hermes source maps
- Sin symbolication → stacks ofuscados inutilizables

## Release Tracking

- CI post-deploy: upload source maps + Build API report (`appVersion`, `revision`, `releaseStage`)
- Stability score por release → regressions visibles

## User Context & Breadcrumbs

- `setUser(id)` — **no email de menores**. `addMetadata('tenant', {id, plan})`
- Breadcrumbs auto (navigation, fetch, console) + manuales en flows críticos
- Últimos 50 eventos antes del error = oro para debugging

## PII Scrubbing

```
redactedKeys: ['password', 'token', 'authorization', 'cookie', /dni/i, /cuit/i, /cpf/i, /credit.?card/i]
```

- Menores: solo `user.id` interno, no email/nombre real
- Respetar consent: si usuario rechazó crash reporting → `pauseSession()`

## Sampling & Ruido

- Errors: **100% siempre** (no samplear)
- Filtrar ruido: ResizeObserver, chrome-extension, Non-Error promise rejection
- Dedupe burst: mismo error <5s → skip

## Grouping

Default por stack+message. Override con `groupingHash` cuando agrupa mal (network errors con URL variable, validation con mensaje dinámico).

## Alertas & Routing

| Evento | Destino |
|--------|---------|
| New issue production | Slack #alerts-prod |
| Regression (resolved reapareció) | Slack + reopen ticket |
| Spike >10x en 5min | PagerDuty on-call |
| Stability <99.5% mobile | Alert weekly |

Anti-fatiga: no alertar info a on-call, staging solo Slack.

## Triage Workflow

**Diario:** inbox new 24h → clasificar (bug/noise/regression) → asignar → Jira si >1h
**Weekly:** top 10 frecuencia, top 10 users afectados, stability por release

## Anti-patterns

- apiKey hardcoded, sin source maps/dSYM/Proguard, .map públicos
- Samplear errors <100%, enviar PII/datos menores, un project para todas las apps
- Release sin appVersion+commit, sin releaseStage, alertar info/warning
- Ignorar ruido (ahoga señal), no actuar en alta frecuencia, Bugsnag como logger

## Checklist

- [ ] Projects separados por app (web/mobile/api)
- [ ] API keys por env vía env vars
- [ ] releaseStage + appVersion configurados
- [ ] Source maps subidos en CI (browser + Hermes), no públicos
- [ ] dSYM iOS + Proguard Android subidos en CI
- [ ] redactedKeys verificado (passwords, tokens, PII, DNI/CUIT)
- [ ] ErrorBoundary en React root
- [ ] unhandledRejection handler en Node
- [ ] Breadcrumbs en flows críticos
- [ ] User id + tenantId en metadata (sin email/PII menores)
- [ ] onError filter ruido conocido
- [ ] Alertas: new/regression → Slack, spike → PagerDuty
- [ ] Jira/ClickUp integration activa
- [ ] Triage daily + weekly documentado
