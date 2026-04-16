---
name: scaffold-react-native
description: "Scaffold de app mobile con React Native + Expo + TypeScript. Stack mobile oficial de Educabot. Usar para nuevas apps mobile, POCs de mobile o migraciones desde web."
---

# scaffold-react-native — React Native Mobile Scaffolder

Genera una app mobile **React Native** (con Expo managed workflow) production-ready. Stack mobile oficial en Educabot.

## Cuándo usar

- Nueva app mobile (iOS + Android)
- POC mobile rápido
- Compañera mobile de un web app existente (Alizia/Tuni mobile)

## Stack por defecto

- **React Native 0.74+** via **Expo SDK 51+** (managed workflow)
- **TypeScript** strict mode
- **Expo Router** (file-based routing, tipado)
- **TanStack Query v5** (server state)
- **Zustand** (client state)
- **React Hook Form** + **Zod**
- **NativeWind** (Tailwind para RN) o **Tamagui** si querés design system completo
- **Expo SecureStore** (tokens) + **AsyncStorage** (cache)
- **Axios** o **ky** para HTTP
- **Jest** + **React Native Testing Library** (unit)
- **Maestro** o **Detox** (e2e)
- **EAS Build + Submit** para CI/CD y stores
- **Sentry** para crash reporting
- **ESLint** + **Prettier** + **Husky**

## Por qué Expo (vs bare React Native)

- OTA updates con EAS Update
- Build en la nube sin Xcode/Android Studio local obligatorio
- APIs nativas wrapped (camera, location, notifications, secure store)
- Router tipado out-of-the-box
- Para Educabot: velocidad de iteración > máximo control nativo

Si necesitás módulos nativos custom → Expo dev-client (sigue siendo managed).

## Preguntas previas

1. **Nombre de la app** (kebab-case + display name)
2. **Bundle identifiers**: `com.educabot.<app>` (iOS + Android)
3. **Backend que consume**: URL + auth scheme
4. **Features nativas**: camera / notifications push / biometrics / deep links / maps / offline-first
5. **Styling**: NativeWind (default, Tailwind-like) / Tamagui / StyleSheet puro
6. **Target platforms**: iOS + Android / solo una / + web (react-native-web)

## Estructura generada

```
<app>/
├── app/                        # expo-router (file-based)
│   ├── _layout.tsx
│   ├── index.tsx               # home
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── home.tsx
│       └── profile.tsx
├── src/
│   ├── components/
│   │   ├── ui/
│   │   └── features/
│   ├── hooks/
│   │   └── queries/
│   ├── lib/
│   │   ├── api.ts
│   │   ├── storage.ts          # SecureStore wrapper
│   │   └── utils.ts
│   ├── stores/                 # zustand
│   ├── types/
│   └── constants/
├── assets/
│   ├── images/
│   ├── fonts/
│   └── icons/
├── __tests__/
├── e2e/                        # Maestro flows
├── .env.example
├── app.json                    # Expo config
├── eas.json                    # EAS build profiles
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Pasos de scaffolding

### 1. Crear app
```bash
npx create-expo-app@latest <app> -t default
cd <app>
```

### 2. Deps core
```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar \
  expo-secure-store expo-font expo-splash-screen expo-updates \
  @react-navigation/native \
  react-native-safe-area-context react-native-screens react-native-gesture-handler \
  @tanstack/react-query \
  zustand axios \
  react-hook-form @hookform/resolvers zod \
  nativewind tailwindcss@3 \
  @sentry/react-native
```

### 3. Dev deps
```bash
npm i -D typescript @types/react @types/jest \
  jest jest-expo @testing-library/react-native \
  eslint eslint-config-expo prettier prettier-plugin-tailwindcss \
  husky lint-staged
```

### 4. Expo Router setup
Editar `package.json`:
```json
{ "main": "expo-router/entry" }
```

`app.json`:
```json
{
  "expo": {
    "scheme": "<app>",
    "plugins": ["expo-router", "expo-secure-store", "expo-font"],
    "experiments": { "typedRoutes": true }
  }
}
```

### 5. NativeWind + Tailwind
```bash
npx tailwindcss init
```

`tailwind.config.js`:
```js
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};
```

Crear `global.css` con directives de Tailwind e importar en `app/_layout.tsx`.

### 6. API client — `src/lib/api.ts`
```ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("auth-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### 7. Storage wrapper — `src/lib/storage.ts`
```ts
import * as SecureStore from "expo-secure-store";

export const storage = {
  async get(key: string) { return SecureStore.getItemAsync(key); },
  async set(key: string, value: string) { return SecureStore.setItemAsync(key, value); },
  async remove(key: string) { return SecureStore.deleteItemAsync(key); },
};
```

### 8. Root layout — `app/_layout.tsx`
```tsx
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
```

### 9. EAS setup
```bash
npm i -g eas-cli
eas login
eas build:configure
```

`eas.json` con profiles `development`, `preview`, `production`.

### 10. Env vars
Expo solo expone vars con prefix `EXPO_PUBLIC_`.

`.env.example`:
```
EXPO_PUBLIC_API_URL=https://api-dev.educabot.com
EXPO_PUBLIC_SENTRY_DSN=
```

### 11. Tests
`jest.config.js` con preset `jest-expo`. Ejemplo en `__tests__/App.test.tsx` con RNTL.

### 12. Scripts `package.json`
```json
{
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "android": "expo run:android",
    "web": "expo start --web",
    "build:dev": "eas build --profile development",
    "build:prod": "eas build --profile production",
    "submit:ios": "eas submit -p ios",
    "submit:android": "eas submit -p android",
    "test": "jest",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

### 13. Sentry init
En `app/_layout.tsx` (top level):
```ts
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableAutoSessionTracking: true,
});
```

## Convenciones

- **File-based routing** con Expo Router — no react-navigation manual
- **Screens en `app/`**, componentes reutilizables en `src/components/`
- **TanStack Query** para TODO el server state (nada de useEffect + fetch)
- **Zustand** solo para UI client state (theme, sidebar)
- **SecureStore** para tokens, nunca AsyncStorage para secrets
- **Hooks custom** para lógica reusable: `useAuth`, `useNotifications`
- **No inline styles** — siempre NativeWind o StyleSheet.create
- **Accessibility**: `accessibilityLabel` + `accessibilityRole` en todo interactivo

## Publicación a stores

### iOS (App Store)
1. Apple Developer account ($99/año)
2. `eas build -p ios --profile production`
3. `eas submit -p ios`
4. TestFlight review → Production review (1-3 días)

### Android (Play Store)
1. Google Play Console ($25 one-time)
2. `eas build -p android --profile production`
3. `eas submit -p android`
4. Internal testing → Closed → Production

### OTA Updates
Para hotfixes sin review:
```bash
eas update --branch production --message "fix: crash on login"
```
Solo funciona para cambios JS/assets, no nativo.

## Output final

```
✅ App creada en ./<app>
✅ Expo + TypeScript + NativeWind listos
✅ Router tipado configurado
✅ TanStack Query + Zustand + SecureStore
✅ EAS configurado
✅ Sentry listo (falta DSN)

Próximos pasos:
  cd <app>
  cp .env.example .env
  npm start
  # Scanneá QR con Expo Go en tu celu, o:
  # npm run ios / npm run android (requiere simuladores)
```

## Integraciones opcionales

- **Push notifications**: expo-notifications + OneSignal
- **Analytics**: Posthog / Amplitude / Mixpanel
- **Feature flags**: LaunchDarkly / GrowthBook
- **Offline-first**: WatermelonDB / Legend State
- **Maps**: react-native-maps / Mapbox
- **Auth con biometrics**: expo-local-authentication

## Delegación

**Coordinar con:** `mobile-lead`, `frontend-architect`, `ui-lead`
**Reporta a:** `vp-engineering`
