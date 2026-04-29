# Conventions & Platform Handling

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
