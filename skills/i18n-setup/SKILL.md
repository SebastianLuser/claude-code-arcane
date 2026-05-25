---
name: i18n-setup
description: "i18n decision guide: library choice, namespaces, key conventions, LatAm locales, lazy loading, anti-patterns."
category: "frontend"
argument-hint: "[stack: react|rn|go|ts]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# i18n-setup — Internationalization Decision Guide

Markets: **ES (AR/MX/CO/CL)**, **PT (BR)**, **EN**. ES is source-of-truth locale.
Use when: >1 country/language, backend content needs translation, local formats required.
Skip when: monolingual MVP without multi-country roadmap, or user-generated content.

## Library Choice

| Layer | Library |
|---|---|
| Web (React+Vite) | i18next + react-i18next |
| Mobile (RN/Expo) | i18next + react-i18next + expo-localization |
| Backend Go | go-i18n/v2 (nicksnyder) |
| Backend TS | i18next server-side or intl-messageformat |
| Formatting | Native Intl.* (DateTimeFormat, NumberFormat) — no external deps |

Rejected: react-intl (verbose), lingui (large teams only), next-intl (Next.js only).

## Namespace Strategy

Split by feature: `common`, `auth`, `courses`, `notifications`. One JSON per namespace per locale.
Split when: 50+ keys, route-specific loading, separate team ownership.
Keep shared UI (buttons, labels) in `common`.

## Key Naming

Pattern: `feature.component.element` or `feature.action.state`
Good: `courses.list.empty`, `courses.create.error.duplicate` | Bad: `button1`, `text_here`

## Pluralization, Interpolation, and Formatting

- CLDR plural suffixes: `_zero`, `_one`, `_other` (auto-handles all CLDR rules)
- Interpolation (`{{name}}`) — never concatenate translated strings
- HTML in translations: `<Trans>` with component mappings, never raw HTML in `t()`
- Use native `Intl.*` exclusively for dates/numbers/currency
- Currency: AR→ARS, BR→BRL, MX→MXN, Intl→USD
- DB: store `amount` (integer minor units) + `currency` (ISO 4217)
- RN: enable Hermes intl (`jsEngine: "hermes"` + `intl: true`)

## LatAm Considerations

- `es-AR` ≠ `es-MX` for currency/dates — always full BCP47 (`pt-BR`, not `pt_br`)
- Voseo/tuteo differs by country — locale-specific strings
- Portuguese tends longer — test for UI overflow

## Detection, Lazy Loading, and Workflow

**Detection order:** 1. Query param 2. User pref (DB) 3. Cookie/localStorage 4. Browser locale 5. Fallback `es`. Persist on change, sync to backend on login.
**Lazy loading:** web — always per route (i18next-http-backend); mobile — bundle if <50KB, dynamic otherwise; CDN with versioned cache.
**Workflow:** dev adds ES key → i18next-parser in CI → Crowdin/Lokalise → auto-PR. CI fails on missing keys.
**Security:** never interpolate user HTML in `t()`, validate locale against allowlist, log key+locale not rendered text.

## Anti-patterns

- Hardcoded strings mixed with `t()` — breaks extraction
- Concatenating translations — use interpolation
- Skipping pluralization — "1 cursos"
- Manual date/currency formatting instead of `Intl`
- No fallback language — missing key = broken UI
- Language change not persisted — lost on reload
- Assuming 1 language = 1 locale (es-AR ≠ es-MX)

## Checklist

- [ ] Library chosen per layer
- [ ] Namespaces by feature, lazy-loaded by route
- [ ] Plural keys use `_one`/`_other`/`_zero`
- [ ] Formatting via native Intl APIs
- [ ] Detection + persistence configured
- [ ] CI extraction, missing keys fail build
- [ ] ES as source-of-truth, translation platform integrated
