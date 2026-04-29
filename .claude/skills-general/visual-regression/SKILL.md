---
name: visual-regression
description: "Visual regression testing: screenshot comparison antes/después. Chromatic, Percy, Playwright. React+Vite, React Native."
category: "testing"
argument-hint: "[setup|run|update-baseline]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Visual Regression Testing

Detectar cambios visuales **no intencionales** comparando screenshots antes/después. Complementa (no reemplaza) tests de behavior.

**Flujo:** correr suite → comparar contra baseline → humano aprueba (intencional) o rechaza (regresión) → baseline actualizado.

## Cuándo usar / NO usar

| Usar | NO usar |
|------|---------|
| PRs que tocan CSS/componentes/tokens/layouts | Testing de behavior/lógica |
| Refactors de design system | Accesibilidad semántica (usar axe) |
| Validar upgrade (React, Vite, Tailwind) | Performance (usar Lighthouse) |
| Gatekeeping merges con cambios visuales | Features inestables sin diseño congelado |
| Detectar regresiones focus/contraste/dark mode | Prototipos/MVPs (overkill) |

## Tools

| Tool | Tipo | Cuándo |
|------|------|--------|
| **Chromatic** | SaaS | Default si usás Storybook |
| **Playwright screenshots** | OSS | Default sin Storybook, flujos cross-page |
| Percy | SaaS | Alternativa a Chromatic |
| Loki / Argos CI | OSS | Storybook sin presupuesto SaaS |
| Detox + screenshots | OSS | React Native e2e + VR |

**Default Educabot:** Web: Storybook + Chromatic (componentes) + Playwright (cross-page). RN: Detox screenshots.

## Setup

**Chromatic:** `npm i -D chromatic` → `npx chromatic --project-token=xxx`. CI: `chromaui/action@latest` con `onlyChanged: true` (TurboSnap) + `exitZeroOnChanges: false`.

**Playwright:** config con `maxDiffPixelRatio: 0.01`, projects para mobile (375), tablet (768), desktop (1280). Baselines en `__screenshots__/` committeadas o en S3.

## Flakiness

Sources: fonts, animations, timestamps, random data, cursors, lazy images.

Mitigaciones: `waitForLoadState('networkidle')` + `document.fonts.ready` + disable animations globalmente (transition/animation/caret none) + seed fijo en faker + stub `Date.now` + mask áreas volátiles con `mask: [locator]`.

## Viewports, themes, browsers

- Viewports: 375 + 768 + 1280
- Dark mode: capturar ambos temas (Chromatic `modes` parameter)
- Browsers: Chromium default. Firefox/WebKit solo si bugs browser-specific recurrentes

## CI & Approval

PR con cambio UI → CI corre VR → diffs bloquean merge → reviewer acepta/rechaza en Chromatic UI → baseline se actualiza en branch → merge actualiza baseline de main.

Regla: diseñador/PM aprueba shared components; dev aprueba features propias. Threshold default: `maxDiffPixelRatio: 0.01` (ajustar por componente, nunca subir globalmente).

## Anti-patterns

- Sin handle de animations/fonts → flaky → nadie confía
- Threshold alto global (0.5%+) → oculta regresiones
- Baselines no versionadas → branch drift
- Full suite en cada commit → lento + caro (usar TurboSnap)
- "Accept all" sin revisar → se cuela regresión
- Mutear diffs flaky en vez de fixear → test pierde valor
- VR como único test UI → no testea behavior
- Mocks rotos → data real + PII en CI logs
- Ignorar dark mode/mobile → regresiones silenciosas en 50% tráfico

## Checklist

- [ ] Tool elegido según stack (Storybook → Chromatic, sin → Playwright)
- [ ] Animations disabled en test env
- [ ] Fonts loaded + networkidle antes de screenshot
- [ ] Datos mockeados con seed fijo, Date.now estable
- [ ] Masking áreas volátiles
- [ ] Viewports: mobile + tablet + desktop
- [ ] Dark mode capturado si aplica
- [ ] Threshold 0.01, CI bloquea merge sin aprobar
- [ ] TurboSnap / onlyChanged activado
- [ ] Baselines versionadas (Chromatic auto / repo / S3)
- [ ] Approval workflow documentado
- [ ] Budget/tier confirmado (Chromatic educativo si aplica)
