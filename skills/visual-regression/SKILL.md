---
name: visual-regression
description: "Visual regression testing: before/after screenshot comparison. Chromatic, Percy, Playwright. React+Vite, React Native."
category: "testing"
argument-hint: "[setup|run|update-baseline]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Visual Regression Testing

Detect **unintended** visual changes by comparing before/after screenshots. Complements (doesn't replace) behavior tests.

**Flow:** run the suite → compare against the baseline → a human approves (intended) or rejects (regression) → baseline updated.

## When to use / NOT use

| Use | Do NOT use |
|------|---------|
| PRs that touch CSS/components/tokens/layouts | Behavior/logic testing |
| Design system refactors | Semantic accessibility (use axe) |
| Validating an upgrade (React, Vite, Tailwind) | Performance (use Lighthouse) |
| Gatekeeping merges with visual changes | Unstable features without a frozen design |
| Detecting focus/contrast/dark mode regressions | Prototypes/MVPs (overkill) |

## Tools

| Tool | Type | When |
|------|------|--------|
| **Chromatic** | SaaS | Default if you use Storybook |
| **Playwright screenshots** | OSS | Default without Storybook, cross-page flows |
| Percy | SaaS | Alternative to Chromatic |
| Loki / Argos CI | OSS | Storybook without a SaaS budget |
| Detox + screenshots | OSS | React Native e2e + VR |

**Educabot default:** Web: Storybook + Chromatic (components) + Playwright (cross-page). RN: Detox screenshots.

## Setup

**Chromatic:** `npm i -D chromatic` → `npx chromatic --project-token=xxx`. CI: `chromaui/action@latest` with `onlyChanged: true` (TurboSnap) + `exitZeroOnChanges: false`.

**Playwright:** config with `maxDiffPixelRatio: 0.01`, projects for mobile (375), tablet (768), desktop (1280). Baselines in `__screenshots__/`, committed or in S3.

## Flakiness

Sources: fonts, animations, timestamps, random data, cursors, lazy images.

Mitigations: `waitForLoadState('networkidle')` + `document.fonts.ready` + disable animations globally (transition/animation/caret none) + fixed seed in faker + stub `Date.now` + mask volatile areas with `mask: [locator]`.

## Viewports, themes, browsers

- Viewports: 375 + 768 + 1280
- Dark mode: capture both themes (Chromatic `modes` parameter)
- Browsers: Chromium by default. Firefox/WebKit only for recurring browser-specific bugs

## CI & Approval

PR with a UI change → CI runs VR → diffs block the merge → reviewer accepts/rejects in the Chromatic UI → baseline is updated on the branch → merge updates main's baseline.

Rule: the designer/PM approves shared components; the dev approves their own features. Default threshold: `maxDiffPixelRatio: 0.01` (adjust per component, never raise it globally).

## Anti-patterns

- No handling of animations/fonts → flaky → nobody trusts it
- High global threshold (0.5%+) → hides regressions
- Unversioned baselines → branch drift
- Full suite on every commit → slow + expensive (use TurboSnap)
- "Accept all" without reviewing → a regression slips in
- Muting flaky diffs instead of fixing them → the test loses value
- VR as the only UI test → doesn't test behavior
- Broken mocks → real data + PII in CI logs
- Ignoring dark mode/mobile → silent regressions on 50% of traffic

## Checklist

- [ ] Tool chosen per stack (Storybook → Chromatic, without → Playwright)
- [ ] Animations disabled in the test env
- [ ] Fonts loaded + networkidle before the screenshot
- [ ] Mocked data with a fixed seed, stable Date.now
- [ ] Volatile areas masked
- [ ] Viewports: mobile + tablet + desktop
- [ ] Dark mode captured if applicable
- [ ] Threshold 0.01, CI blocks unapproved merges
- [ ] TurboSnap / onlyChanged enabled
- [ ] Versioned baselines (Chromatic auto / repo / S3)
- [ ] Approval workflow documented
- [ ] Budget/tier confirmed (Chromatic education plan if applicable)
