---
name: visual-regression
description: "Visual regression testing para detectar cambios visuales no intencionales comparando screenshots antes/después por componente o página. Stack Educabot: React+Vite+TS (NO Next.js), React Native. Usar cuando se mencione: visual regression, VR testing, screenshot testing, Chromatic, Percy, Playwright screenshots, Storybook snapshots, regresión visual, diff visual, baseline de UI."
argument-hint: "[setup|run|update-baseline]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Visual Regression Testing

## Cuándo usar

- PRs que tocan CSS, componentes UI, tokens de diseño o layouts
- Refactors de design system / migración de librerías de UI
- Validar que un upgrade (React, Vite, Tailwind) no rompe apariencia
- Gatekeeping de merges cuando hay cambios visuales sin aprobar
- Detectar regresiones en focus outlines, contraste, dark mode

## Cuándo NO usar

- Testing de behavior / lógica (usar unit + integration + e2e)
- Validar accesibilidad semántica (usar axe, no VR)
- Performance (usar Lighthouse / Web Vitals)
- Features aún inestables sin diseño congelado (baselines inútiles)
- Prototipos / MVPs sin tráfico real (overkill)

## 1. Qué es Visual Regression

Detectar cambios visuales **no intencionales** comparando screenshots antes/después por componente o página. Complementa (no reemplaza) tests de behavior.

**Flujo:**
1. Correr suite → generar screenshots
2. Comparar contra baseline versionado
3. Si hay diff → humano aprueba (intencional) o rechaza (regresión)
4. Baseline aprobado reemplaza el anterior

## 2. Tools disponibles

| Tool | Tipo | Host | Cuándo |
|------|------|------|--------|
| **Chromatic** | SaaS | Cloud | Default si usás Storybook |
| **Playwright screenshots** | OSS | Self-host | Default sin Storybook, flujos cross-page |
| **Percy** (BrowserStack) | SaaS | Cloud | Alternativa a Chromatic |
| **Loki** | OSS | Self-host | Storybook sin presupuesto SaaS |
| **Argos CI** | OSS/SaaS | Ambos | Alternativa barata a Chromatic |
| **@storybook/native + Chromatic** | SaaS | Cloud | React Native con Storybook |
| **Detox + screenshots** | OSS | Self-host | React Native e2e + VR |

**Tradeoff:** SaaS = UX, escalabilidad, review UI vs $. OSS = control + self-host costoso (storage, CI, UI propia).

**Default Educabot:**
- **Web:** Storybook + Chromatic para componentes + Playwright para flujos cross-page
- **React Native:** Detox screenshots (o Storybook Native + Chromatic si ya hay Storybook)

## 3. Setup: Storybook + Chromatic (web)

```bash
# Storybook si no está
npx storybook@latest init

# Chromatic
npm i -D chromatic
npx chromatic --project-token=xxx
```

Primer run establece **baseline**. Siguientes runs comparan. Approve/reject diffs en Chromatic UI.

`.github/workflows/chromatic.yml`:

```yaml
name: Chromatic
on: pull_request
jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          onlyChanged: true
          exitZeroOnChanges: false
```

`onlyChanged: true` → TurboSnap, solo re-snappea stories afectadas por el diff (rápido + barato).

## 4. Setup: Playwright (cross-page flows)

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: 'http://localhost:5173',
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  projects: [
    { name: 'mobile',  use: { ...devices['iPhone 13'] } },
    { name: 'tablet',  use: { viewport: { width: 768,  height: 1024 } } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 800  } } },
  ],
  workers: 4,
});
```

Test ejemplo:

```ts
import { test, expect } from '@playwright/test';

test('login page', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => (document as any).fonts.ready);
  await expect(page).toHaveScreenshot('login.png', {
    maxDiffPixelRatio: 0.01,
    mask: [page.locator('.timestamp')],
  });
});
```

Baselines se guardan en `__screenshots__/` y se commitean al repo (o S3 bucket si son muchos).

## 5. Handling flakiness

**Sources:** fonts loading, animations, timestamps, random data, cursors, carousels, charts con data real, lazy-loaded images.

**Mitigaciones:**

```ts
// Antes de cada screenshot
await page.waitForLoadState('networkidle');
await page.evaluate(() => (document as any).fonts.ready);
```

Disable animations globalmente (`global.css` de test o `addStyleTag`):

```css
*, *::before, *::after {
  transition: none !important;
  animation: none !important;
  caret-color: transparent !important;
}
```

Respetar `prefers-reduced-motion` en la app ayuda acá.

**Mock datos:** seed fijo en faker, stub `Date.now()`, fixtures deterministas.

**Masking** (ocultar áreas volátiles sin fallar):

```ts
await expect(page).toHaveScreenshot({
  mask: [page.locator('.timestamp'), page.locator('[data-volatile]')],
});
```

## 6. Viewports, themes, browsers

**Viewports:** `375` (mobile) + `768` (tablet) + `1280` (desktop). En Storybook usar `@storybook/addon-viewport` + parameter por story.

**Dark mode:** si el sitio soporta, capturar ambos temas. En Chromatic usar `modes`:

```ts
export const parameters = {
  chromatic: {
    modes: {
      light: { theme: 'light' },
      dark:  { theme: 'dark'  },
    },
  },
};
```

**Browsers:** Chromium por default. Firefox/WebKit opcional — rendering diffs (antialiasing, fonts) son costosos de triagear. Habilitar solo si hay bugs browser-specific recurrentes.

## 7. Thresholds

Default: `maxDiffPixelRatio: 0.01` (1%). Ajustar por componente si hay anti-aliasing conocido. **No subir a 0.5%+ globalmente** → oculta bugs reales.

```ts
await expect(locator).toHaveScreenshot({ maxDiffPixelRatio: 0.02 }); // solo acá
```

## 8. CI integration y approval workflow

**PR con cambio de UI:**
1. CI corre VR (Chromatic action o Playwright job)
2. Si hay diffs → check falla, bloquea merge
3. Reviewer abre Chromatic UI (o Playwright HTML report)
4. Por cada diff: **Accept** (intencional) o **Deny** (regresión → fix)
5. Al aprobar → baseline se actualiza en esa branch
6. Merge a main → baseline de main se actualiza

**Regla de equipo:** diseñador/PM aprueba cambios de componentes shared del design system. Dev aprueba cambios de features propias.

## 9. Storage de baselines

- **Chromatic:** auto, versionado por branch. No commitear.
- **Playwright OSS:** commitear `__screenshots__/` (o subir a S3 y usar `updateSnapshots` remoto). Cuidado con branch drift si no se rebasean bien.

## 10. Performance

- Paralelizar: Chromatic auto-escala; Playwright `workers: 4+`
- **Solo stories cambiadas:** Chromatic TurboSnap (`onlyChanged: true`), Playwright `--only-changed`
- No correr full suite en cada commit → solo en PR y antes de release
- Cachear `node_modules` y browsers en CI

## 11. Cost (Educabot)

- **Chromatic:** free tier limitado (5k snapshots/mes). Plan **educativo / OSS** disponible — Educabot puede calificar. Confirmar con el equipo.
- **Percy:** free tier más generoso pero UX inferior.
- **Playwright:** gratis, paga solo CI minutes + storage.
- **Argos CI:** tier gratuito decente, alternativa barata.

## 12. Accessibility visual

VR detecta regresiones de:
- Contraste (si cambia un color token)
- Focus outlines (si se rompe `:focus-visible`)
- Tamaños de touch targets

**No reemplaza** axe-core / pa11y, pero los complementa.

## 13. Integración con Figma

Chromatic tiene **Figma integration** — en el mismo review ves diseño + implementación lado a lado. Útil para validar que el dev respetó el handoff. Ver skill `/design-handoff`.

## 14. React Native

**Opción A — Storybook Native + Chromatic:**
```bash
npx sb init --type react_native
# publish via chromatic-react-native
```

**Opción B — Detox + screenshots:**
```ts
await element(by.id('login-screen')).takeScreenshot('login');
// comparar con pixelmatch o reg-cli en CI
```

Menos UX que web, pero funcional para pantallas críticas.

## Anti-patterns

- ❌ VR sin handle de animations/fonts → flaky, nadie confía, terminás ignorando diffs
- ❌ Threshold alto (0.5%+) global → oculta regresiones reales
- ❌ Baselines no versionadas con el código → branch drift, merges con baseline incorrecto
- ❌ Correr full suite en cada commit → lento + caro. Usar changed-stories / TurboSnap
- ❌ Aprobar diff masivo sin revisar (click "Accept all") → se cuela regresión
- ❌ Mutear diffs flaky en vez de fixear la flakiness → el test pierde valor
- ❌ VR como único test UI → no testea behavior, solo apariencia. Combinar con RTL / Playwright e2e
- ❌ Mocks rotos → data real en screenshots → flaky + PII de alumnos expuesta en CI logs
- ❌ Ignorar dark mode / mobile viewport → regresiones silenciosas en 50% del tráfico

## Checklist

- [ ] Tool elegido según stack (Storybook? → Chromatic. Sin Storybook? → Playwright)
- [ ] Animations disabled en entorno de test
- [ ] Fonts loaded antes de screenshot (`document.fonts.ready`)
- [ ] `networkidle` wait antes de capturar
- [ ] Datos mockeados con seed fijo, `Date.now` estable
- [ ] Masking de áreas volátiles (timestamps, avatares random)
- [ ] Viewports: mobile + tablet + desktop
- [ ] Dark mode capturado si aplica
- [ ] Threshold razonable (`maxDiffPixelRatio: 0.01`)
- [ ] CI job bloquea merge si hay diffs sin aprobar
- [ ] TurboSnap / `onlyChanged` activado
- [ ] Baselines versionadas correctamente (Chromatic auto / repo / S3)
- [ ] Approval workflow documentado en CONTRIBUTING.md
- [ ] Budget / tier confirmado (Chromatic educativo si aplica)

## Output ✅

```
✅ Visual regression setup listo
Tool: Storybook + Chromatic (web) + Detox screenshots (RN)
Viewports: 375 / 768 / 1280
Themes: light + dark
Threshold: maxDiffPixelRatio 0.01
CI: bloquea merge con diffs sin aprobar
TurboSnap: on (solo stories cambiadas)
Baselines: Chromatic cloud (web) + __screenshots__/ (Playwright)
Approval: diseño valida shared components; dev valida features
```

## Delegación

- Design system, tokens, componentes shared → `/design-system`
- Handoff Figma → código y validación visual → `/design-handoff`
- Figma → código production-ready → `/figma-to-code`
- Quality gate general (lint, tests, security) → `/check`
- Auditoría de UI/UX completa → `ui-ux-pro-max`
