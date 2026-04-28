---
name: scaffold-react-native
description: "Scaffold production-ready React Native + Expo + TypeScript mobile app with standard tooling."
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---

## When to Use

New mobile app (iOS+Android), rapid mobile POC, or mobile companion to an existing web app.

## MANDATORY WORKFLOW

**Antes de generar cualquier código, completar estos pasos en orden.**

### Step 0: Gather Requirements

Clarificar (o inferir del contexto si ya fue especificado):

1. **App name** (kebab-case + display name)
2. **Bundle IDs:** `com.educabot.<app>` (iOS + Android)
3. **Backend:** URL + auth scheme
4. **Native features:** camera / push / biometrics / deep links / maps / offline-first
5. **Styling:** NativeWind (default) / Tamagui / plain StyleSheet
6. **Platforms:** iOS + Android / single / + web

Si el usuario ya especificó estos valores, saltar directamente al Step 1.

### Step 1: Implementar

Seguir: Workflow Decision → Navigation Decision → Dependency Baseline → Project Structure → Conventions.

### Step 2: Verificar

```bash
npx expo start          # dev server arriba sin errores
npx expo run:android    # compila (si hay emulador)
npm run test            # Vitest/RNTL pasa
```

## Workflow Decision

| Criteria | Expo Managed | Expo Dev Client | Bare RN |
|----------|-------------|-----------------|---------|
| Custom native modules | No | Yes | Yes |
| OTA updates | Yes | Yes | Manual |
| Cloud builds (no Xcode) | Yes | Yes | No |
| Iteration speed | Fastest | Fast | Slow |

**Default:** Expo managed. Dev-client when a dep needs custom native code. Bare RN only for deep native requirements from day one.

## Navigation Decision

| Criteria | Expo Router | React Navigation |
|----------|-------------|------------------|
| File-based + typed routes | Yes | No |
| Deep linking | Automatic | Manual |
| Custom navigators | Limited | Full control |

**Default:** Expo Router. React Navigation only for deeply custom navigator behavior.

## Dependency Baseline

**Core:** React Native 0.76+, Expo SDK 52+, TypeScript strict, Expo Router, TanStack Query v5, Zustand, React Hook Form + Zod, Axios
**UI:** NativeWind or Tamagui | **Storage:** SecureStore (tokens), AsyncStorage (cache)
**Quality:** ESLint (eslint-config-expo), Prettier, Husky + lint-staged
**Testing:** Vitest + RNTL (unit), Maestro or Detox (e2e)
**Infra:** EAS Build + Submit, Sentry, expo-updates

## Project Structure

`app/` — Expo Router screens: `_layout.tsx`, `index.tsx`, `(auth)/`, `(tabs)/`
`src/components/{ui,features}/` — reusable components
`src/hooks/queries/` — TanStack Query hooks
`src/lib/` — api.ts, storage.ts, utils.ts
`src/stores/` — Zustand stores | `src/types/` | `src/constants/`
`assets/` — images, fonts, icons | `e2e/` — Maestro/Detox flows
Root: app.json, eas.json, tsconfig.json, package.json

## Conventions & Platform Handling

- **TanStack Query** for ALL server state — never useEffect + fetch
- **Zustand** only for client UI state (theme, modals)
- **SecureStore** for tokens — NEVER AsyncStorage for secrets
- **`EXPO_PUBLIC_` prefix** required for all exposed env vars
- **Accessibility**: `accessibilityLabel` + `accessibilityRole` on all interactive elements
- **No inline styles** — NativeWind classes or StyleSheet.create
- SafeAreaProvider from day one; KeyboardAvoidingView with platform-specific behavior
- Request permissions at point of use, not on launch
- Handle Android back button via navigation, not hardware listener
- Configure app icons + splash in app.json before first build

## Publishing

Apple Developer ($99/yr) + Google Play Console ($25 one-time). EAS profiles: development, preview, production. OTA updates (EAS Update) for JS-only hotfixes without store review. Native changes require new build + review.

## Anti-Patterns

- **No strict TypeScript** — enable from the start, not later
- **Wrong navigation choice** — Expo Router unless custom navigators are truly needed
- **Ignoring native module needs** — audit deps before choosing managed workflow
- **Secrets in AsyncStorage** — always SecureStore for auth tokens
- **useEffect for data fetching** — TanStack Query handles caching and dedup
- **Skipping EAS config** — configure early; retrofitting is painful
- **No crash reporting** — Sentry in root layout before first deploy
