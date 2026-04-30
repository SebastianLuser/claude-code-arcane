---
name: scaffold-react-native
description: "Scaffold production-ready React Native + Expo + TypeScript mobile app with standard tooling."
category: "frontend"
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

## Workflow & Navigation Decisions

> → Read references/workflow-and-navigation.md for Expo Managed vs Dev Client vs Bare RN comparison, and Expo Router vs React Navigation decision tables

**Defaults:** Expo managed workflow + Expo Router. Dev-client when custom native code needed. Bare RN only for deep native requirements from day one.

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

## Conventions, Publishing & Anti-patterns

> → Read references/conventions.md for platform handling rules, publishing setup, and 7 anti-patterns
