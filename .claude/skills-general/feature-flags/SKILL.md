---
name: feature-flags
description: "Sistema de feature flags para apps Educabot (Go/TS/React/RN): rollouts graduales, kill switches, A/B tests, targeting por cohort. Recomienda provider (Unleash/GrowthBook/LaunchDarkly), SDK patterns, lifecycle management, cleanup. Usar para: feature flags, toggles, rollout, kill switch, ab test, canary."
argument-hint: "[setup|audit|cleanup]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# feature-flags — Feature Flags & Rollouts

Framework para feature flags en apps Educabot. Separa **deploy** de **release**, habilita rollouts graduales, kill switches en incidents, y A/B tests.

## Cuándo usar

- Feature grande con riesgo de rollback
- Rollout gradual (1% → 10% → 50% → 100%)
- Kill switch para paths problemáticos
- A/B test con segmentos
- Canary deploys controlados
- Dark launches (código en prod sin UI visible)

## Cuándo NO usar

- **Config runtime** (env vars, ConfigMap) — no es lo mismo
- Permissions / RBAC — usar auth system
- Personalización por usuario permanente — no es flag, es feature
- Cada if del código — overkill, genera ruido

---

## 1. Tipos de flag (Harnes / Hodgson)

| Tipo | Propósito | Lifetime | Ejemplo |
|------|-----------|----------|---------|
| **Release** | Separar deploy de release | Días-semanas | `new-dashboard` |
| **Experiment** | A/B test | Semanas | `onboarding-v2` |
| **Ops** | Kill switch / circuit breaker | Meses-permanente | `disable-heavy-query` |
| **Permission** | Entitlements por plan/rol | Permanente | `feature-x-pro-plan` |

Cada tipo tiene **lifecycle distinto**. Release flags deben **morir** tras el rollout.

---

## 2. Provider — decisión

| Provider | Pros | Cons | Cuándo |
|----------|------|------|--------|
| **GrowthBook** | Open source, self-host, A/B integrado, Postgres como storage | Menos maduro en UI | **Default Educabot** — self-host GCP |
| **Unleash** | Open source, muy maduro, SDK multi-lenguaje | UI pesada | Alternativa si ya tenemos infra |
| **LaunchDarkly** | SaaS mejor UX, multi-env, audit log | $$, vendor lock-in | Si hay presupuesto y no queremos self-host |
| **Flagsmith** | Open source + SaaS | Menos features que Unleash | Alternativa ligera |
| **Homegrown (DB row)** | Cero deps | Reinventás la rueda | NO — evitar |

**Default:** GrowthBook self-hosted en GCP.

---

## 3. Arquitectura

```
┌──────────────┐
│ GrowthBook   │  ← admin UI: targeting, rollout %, cohorts
│ (GCP Cloud   │
│  Run)        │
└──────┬───────┘
       │ SDK fetch (SSE o polling 30s)
       │
  ┌────┴─────┬──────────┬──────────┐
  │          │          │          │
┌─▼──┐   ┌──▼──┐   ┌───▼───┐   ┌──▼───┐
│ Go │   │ TS  │   │ React │   │ RN   │
│ BE │   │ BE  │   │ web   │   │      │
└────┘   └─────┘   └───────┘   └──────┘
```

### Patrón de evaluación
- **Backend:** eval server-side, flag resuelto antes de responder
- **Frontend:** hidratar con estado inicial desde backend o SDK con cache local
- **Mobile:** cache local + refresh on app foreground, fallback a default si offline

---

## 4. SDK por stack

### Go (backend)
```go
import "github.com/growthbook/growthbook-golang"

var gb *growthbook.Client

func init() {
    gb, _ = growthbook.NewClient(
        context.Background(),
        growthbook.WithAPIHost("https://flags.educabot.com"),
        growthbook.WithClientKey(os.Getenv("GB_CLIENT_KEY")),
    )
}

// en handler
func dashboardHandler(c *gin.Context) {
    userID := c.GetString("userID")
    attrs := growthbook.Attributes{
        "id":       userID,
        "email":    c.GetString("email"),
        "plan":     c.GetString("plan"),
        "country":  c.GetString("country"),
    }

    result := gb.EvalFeature(ctx, "new-dashboard", attrs)
    if result.On {
        c.JSON(200, newDashboard(userID))
        return
    }
    c.JSON(200, oldDashboard(userID))
}
```

### TS / Fastify
```ts
import { GrowthBook, GrowthBookClient } from '@growthbook/growthbook';

const client = new GrowthBookClient({
  apiHost: 'https://flags.educabot.com',
  clientKey: process.env.GB_CLIENT_KEY,
});
await client.init();

app.get('/api/dashboard', async (req) => {
  const gb = new GrowthBook({
    attributes: {
      id: req.user.id,
      plan: req.user.plan,
      country: req.user.country,
    },
  });
  await client.initForUser(gb);

  if (gb.isOn('new-dashboard')) {
    return newDashboard(req.user.id);
  }
  return oldDashboard(req.user.id);
});
```

### React + Vite
```tsx
import { GrowthBookProvider, GrowthBook, useFeatureIsOn } from '@growthbook/growthbook-react';

const gb = new GrowthBook({
  apiHost: import.meta.env.VITE_GB_API_HOST,
  clientKey: import.meta.env.VITE_GB_CLIENT_KEY,
  enableDevMode: import.meta.env.DEV,
});

export function App() {
  useEffect(() => { gb.init({ streaming: true }); }, []);
  return (
    <GrowthBookProvider growthbook={gb}>
      <Dashboard />
    </GrowthBookProvider>
  );
}

function Dashboard() {
  const showNew = useFeatureIsOn('new-dashboard');
  return showNew ? <NewDashboard /> : <OldDashboard />;
}
```

**Importante (React):** setAttributes al montar con user context (post-login) para que targeting funcione.

### React Native
Similar a React. Cache local (AsyncStorage) para offline-first. Refresh on app foreground.

---

## 5. Naming convention

```
<feature-area>-<what>-<optional-version>

✅ dashboard-new-layout
✅ auth-passkey-login
✅ checkout-express-flow-v2
✅ ops-disable-heavy-analytics     # ops/kill switch
✅ exp-onboarding-variant-b        # experiment

❌ new_feature                     # snake, sin área
❌ NewDashboard                    # camelCase
❌ test                            # ambiguo
❌ fix-123                         # refiere ticket, muere con él
```

- kebab-case
- prefijo por tipo: `exp-` (experiment), `ops-` (ops), sin prefijo para release
- incluir área/dominio
- evitar "new" sin versión (¿nuevo cuándo?)

---

## 6. Targeting patterns

### Rollout gradual
```
0% → 1% (canary) → 5% → 25% → 50% → 100%
```
Entre paso y paso: 24-48h observando métricas.

### Por cohort
- `plan == 'pro'`
- `country IN ['AR', 'MX']`
- `createdAt > 2026-01-01` (solo usuarios nuevos)
- `email ENDS_WITH '@educabot.com'` (dogfooding)

### Sticky hashing
Usar `userId` como hash key → el mismo user siempre ve lo mismo (crucial para UX y experimentos).

### Kill switch
Flag siempre ON, se apaga en incidente:
```go
if !gb.EvalFeature(ctx, "ops-enable-dashboard-cache").On {
    // bypass cache
    return queryDirect()
}
```

---

## 7. Lifecycle management (el problema real)

El 90% del dolor de flags = **no limpiarlos**.

### Regla: release flag tiene expiration date
Al crear un flag:
- **Owner** (persona)
- **Type** (release / exp / ops / permission)
- **Expires** (fecha — release: 30-60 días; exp: fin del test; ops: permanente)
- **Cleanup ticket** en Jira linkeado

### Cleanup automatizado
```bash
# detectar flags que siguen en código pero están 100% ON (o OFF) hace > 30 días
growthbook-cli stale --age 30d > stale-flags.json
```

Cada sprint: revisar `stale-flags` → crear PRs de cleanup.

### Cleanup PR pattern
1. Remover llamadas a `useFeatureIsOn('flag')` → dejar solo la rama ganadora
2. Eliminar código muerto de la rama perdedora
3. Archivar flag en GrowthBook (no deletes bruscos — audit trail)
4. Update de docs/changelog

---

## 8. Testing con flags

### Unit tests
```ts
// mock del SDK
vi.mock('@growthbook/growthbook-react', () => ({
  useFeatureIsOn: vi.fn().mockReturnValue(true),
}));
```

### E2E (Playwright)
```ts
// forzar flag desde query param
await page.goto('/dashboard?gb_feature_new-dashboard=true');
```

### Matrix de combinatoria
Evitar explosión. Solo probar combinaciones **realistas** (por cohort). Si tenés 5 flags activos → NO probar 32 combinaciones.

---

## 9. Observabilidad

### Eventos a emitir
```ts
// cuando un flag se evalúa en producción
analytics.track('feature_flag_evaluated', {
  flag: 'new-dashboard',
  variant: 'on',
  user_id: userId,
});
```

Correlacionar con métricas de negocio (conversion, retention, errors) para medir impact.

### Alertas
- Error rate spike correlacionado con variant → auto-rollback recomendado
- Flag evaluado pero nunca expuesto a usuarios reales → flag muerto

---

## 10. Runbook — rollout de feature

```
1. Implementar código detrás de flag (default OFF)
2. Merge a main → deploy a prod (código dormido)
3. Smoke test interno: flag ON para email=@educabot.com
4. Canary: flag ON 1% → observar 24h
   - Error rate
   - p95 latencia
   - Métrica de negocio relevante
5. Si OK: subir a 10% → 24h → 25% → 50% → 100%
6. Si NO OK: flag OFF (release en < 1min) → post-mortem
7. Tras 100% por 2 semanas: cleanup del flag
```

---

## 11. Anti-patterns

- ❌ Flag sin owner/expiration → zombie eterno
- ❌ Eval del flag en cada línea del código (usar 1x por request, pasar resultado)
- ❌ Flag para config runtime (usar env vars)
- ❌ Targeting complejo en cliente con datos sensibles → server-side
- ❌ Borrar flag sin limpiar código → `useFeatureIsOn` siempre false → rama muerta
- ❌ Flag sin métrica de éxito → no sabés si anda
- ❌ Varios flags interactuando sin matriz documentada → bugs combinatorios
- ❌ Tests que no cubren la rama OFF (solo testean la nueva)
- ❌ Rollout 0→100% directo sin gradual → pérdida del valor del flag

---

## 12. Security

- [ ] SDK client keys **no son secrets** (están en cliente) — usar **SDK connection** con lectura-only
- [ ] Admin API key en backend, nunca en frontend
- [ ] Audit log de cambios (GrowthBook lo hace por default)
- [ ] 2FA para admin console
- [ ] No eval flags sensibles en cliente (billing, permisos) — server-side

---

## 13. Output final

```
✅ Feature flag creado — dashboard-new-layout
   👤 Owner: @alice
   📅 Expires: 2026-06-15 (60 días)
   🎯 Targeting: canary 1% users con plan=pro
   📊 Métrica: dashboard_load_time p95 + error_rate
   🔗 Ticket cleanup: ALZ-1250
   📖 Runbook: docs/runbooks/dashboard-rollout.md

Próximos pasos:
  1. Smoke test interno (email=@educabot.com)
  2. Canary 1% → 2026-04-15
  3. Review gradual schedule cada 48h
  4. Cleanup ticket activo para post-100%
```

## Delegación

**Coordinar con:** `backend-architect`, `frontend-architect`, `product-manager`, `sre-lead`
**Reporta a:** `tech-lead` + `product-manager`

**Skills relacionadas:**
- `/observability-setup` — métricas para validar rollout
- `/deploy-check` — flags nuevos listados en checklist
- `/incident` — kill switches como respuesta
- `/performance-test` — validar variante ganadora no degrada
- `/ab-test` — diseño formal de experimentos (si existe)
