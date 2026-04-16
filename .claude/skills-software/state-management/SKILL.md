---
name: state-management
description: Estrategia de state management para React/React Native en Educabot. Clasifica tipos de estado (server/URL/form/UI) y elige la herramienta correcta. Zustand como default, TanStack Query para server state. Usar cuando se mencione state, store, Redux, Zustand, Context, global state, estado compartido, rerenders, o decisiones de arquitectura de estado frontend.
---

# State Management — Educabot Frontend

Stack: React + Vite + TypeScript (SPA, **NO Next.js**) y React Native. Español para comunicación, inglés para código.

## Cuándo usar esta skill

- Diseñar la capa de estado de una app nueva (React/RN).
- Decidir entre Redux / Zustand / Jotai / Context / React Query.
- Refactorizar un store que creció mal (rerenders, acoplamiento, PII en localStorage).
- Elegir dónde vive un dato: ¿server, URL, form, UI global o UI local?

## Cuándo NO usar

- Problemas puros de validación de formularios → usar `/form-validation`.
- Estrategia de auth/tokens → usar `/jwt-strategy`.
- Performance de render no relacionada a state → profiling de React DevTools.
- Proyectos Next.js → Educabot no usa Next (ignorar patrones SSR/hydration).

---

## 1. Regla 1 — No metas todo en state global

Antes de tocar un store, preguntá: **¿qué tipo de estado es esto?**

| Tipo | Dónde vive | Herramienta |
|---|---|---|
| **Server state** (data del API: cursos, usuarios, reportes) | Cache de red | **TanStack Query** / SWR |
| **URL state** (filtros, page, search, tab activo) | URL | `useSearchParams` / React Router |
| **Form state** (inputs, validación, dirty, touched) | Form lib | **React Hook Form** (`/form-validation`) |
| **UI state shared** (theme, sidebar open, auth user, tenant) | Store global | **Zustand** |
| **UI state local** (modal open, hover, acordeón) | Componente | `useState` / `useReducer` |

Si todo lo metés en Redux/Zustand, terminás con un store gigante desincronizado del servidor. **El 80% de lo que antes iba a Redux hoy va a TanStack Query.**

---

## 2. Elección de librería (state manager global)

```
Zustand       ✅ DEFAULT EDUCABOT — mínima, sin boilerplate, TS excelente, bundle ~1KB
Jotai            — atomic, útil para grafos de derivación densos
Redux Toolkit    — maduro, devtools top, boilerplate mayor. Solo si el equipo lo pide o app muy grande
Recoil        ❌ abandonado por Meta (2024), no usar en proyectos nuevos
MobX             — paradigma diferente (reactivo/mutable), válido pero minoritario en Educabot
Context API      — solo valores casi-estáticos (theme, i18n). NO como store (rerenders explosivos)
```

**Default:** Zustand + TanStack Query. Así arranca toda app nueva de Educabot.

---

## 3. Zustand — patrón base (auth store)

```ts
// src/stores/useAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = { id: string; email: string; tenantId: string };

type AuthStore = {
  user: User | null;
  tenantId: string | null;
  setUser: (u: User | null) => void;
  logout: () => void;
};

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      tenantId: null,
      setUser: (user) => set({ user, tenantId: user?.tenantId ?? null }),
      logout: () => set({ user: null, tenantId: null }),
    }),
    {
      name: 'auth-storage',
      // ⚠️ NO persistir user completo: PII en localStorage expuesta a XSS
      partialize: (s) => ({ tenantId: s.tenantId }),
    },
  ),
);
```

Tokens JWT → **cookies httpOnly**, no localStorage (ver `/jwt-strategy`).

---

## 4. Server state con TanStack Query

```ts
import { useQuery } from '@tanstack/react-query';

const { data, error, isLoading } = useQuery({
  queryKey: ['courses', tenantId],
  queryFn: () => api.get(`/courses?tenant=${tenantId}`),
  staleTime: 5 * 60_000, // 5 min fresh
});
```

Reemplaza Redux thunks/sagas, reducers de loading/error, y el 80% del boilerplate tradicional. Cache, dedupe, refetch, invalidación vienen gratis.

---

## 5. Selectors — evitar re-renders

```ts
// ❌ mal: re-render ante cualquier cambio del store
const auth = useAuth();

// ✅ bien: solo re-render si cambia user
const user = useAuth((s) => s.user);

// ✅ varios slices con shallow compare
import { shallow } from 'zustand/shallow';
const { user, tenantId } = useAuth((s) => ({ user: s.user, tenantId: s.tenantId }), shallow);
```

---

## 6. Slices por dominio

Preferir **múltiples stores chicas** a una gigante:

```
src/stores/
  useAuth.ts      // user, tenantId, login/logout
  useUI.ts        // sidebar, theme, toasts
  useCart.ts      // carrito/compra (si aplica)
```

Un store por dominio de UI. Server data NO va acá — va a TanStack Query.

---

## 7. Persistencia — cuidado con PII

```ts
persist(
  (set) => ({ /* ... */ }),
  {
    name: 'ui-storage',
    partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }),
    // NO persistas: tokens, user completo, datos de alumnos, emails, etc.
  },
)
```

Regla: **si alguien lee el localStorage y eso te preocupa, no lo persistas.**

---

## 8. React Native

- Zustand funciona idéntico.
- Storage adapter: **AsyncStorage** para cosas no sensibles, **SecureStore** (Expo) / Keychain para secrets.
- Nunca guardes tokens en AsyncStorage.

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

persist(/* ... */, {
  name: 'ui-storage',
  storage: createJSONStorage(() => AsyncStorage),
});
```

---

## 9. Devtools

```ts
import { devtools } from 'zustand/middleware';

export const useAuth = create<AuthStore>()(
  devtools(persist(/* ... */), { name: 'AuthStore' }),
);
```

Se engancha al Redux DevTools Extension. Útil en dev, apagalo en prod.

---

## 10. Derived state

```ts
// Opción A: getter en el store
isAuthenticated: () => get().user !== null

// Opción B: useMemo en el componente
const isAdmin = useMemo(() => user?.role === 'admin', [user]);
```

No dupliques estado derivado como propiedad persistida — va a desincronizarse.

---

## 11. Testing

Zustand se testea como funciones puras:

```ts
import { useAuth } from './useAuth';

beforeEach(() => {
  useAuth.setState({ user: null, tenantId: null }, true); // replace = true
});

test('setUser actualiza tenantId', () => {
  useAuth.getState().setUser({ id: '1', email: 'a@b.com', tenantId: 't1' });
  expect(useAuth.getState().tenantId).toBe('t1');
});
```

`getState()` / `setState()` funcionan fuera de React — ideal para unit tests.

---

## 12. Context API — uso válido

Sí va Context para:
- **Theme provider** (cambia 1 vez, lo leen todos).
- **i18n provider** (idioma activo).
- **Feature flags** provider.
- **Inyección de dependencias** (http client, logger).

NO va Context para:
- Estado que cambia seguido (re-render de todo el subárbol).
- Listas, filtros, carritos, cualquier cosa que se actualice frecuentemente.

---

## Anti-patterns

- ❌ **Redux para todo** incluyendo server state — existe TanStack Query.
- ❌ **Context como global store** — rerenders masivos del subárbol.
- ❌ **Persistir `user` completo** en localStorage — PII expuesta a XSS.
- ❌ **Múltiples sources of truth** — server state + copia local desincronizada.
- ❌ **State manager para URL state** — usá router (`useSearchParams`).
- ❌ **Un store gigante** cuando podés partir por dominio.
- ❌ **Selectors sin shallow compare** al leer objetos → re-renders innecesarios.
- ❌ **Mutar state directo** en Zustand (`state.user.name = 'x'`) → usá `set` o middleware `immer`.
- ❌ **`useEffect` para sync server → store** → usá TanStack Query.
- ❌ **Recoil** en proyectos nuevos 2026+ — abandonado.
- ❌ **Tokens JWT en localStorage/AsyncStorage** — cookies httpOnly / SecureStore.

---

## Checklist antes de mergear

- [ ] Clasifiqué cada dato: server / URL / form / UI-global / UI-local.
- [ ] Server state está en TanStack Query, no en Zustand/Redux.
- [ ] URL state (filtros, page) está en `useSearchParams`, no en store.
- [ ] Form state usa React Hook Form.
- [ ] Store global dividido por dominio (`useAuth`, `useUI`, …).
- [ ] Selectors específicos (`s => s.x`) en lugar de leer el store entero.
- [ ] `partialize` configurado — no persisto PII ni tokens.
- [ ] Tokens JWT NO están en localStorage/AsyncStorage.
- [ ] Devtools activos en dev, sin info sensible en nombres de action.
- [ ] Tests de stores resetean estado en `beforeEach`.
- [ ] No uso Context para state que cambia seguido.
- [ ] (RN) AsyncStorage solo para no-sensibles; SecureStore para secrets.

---

## Output esperado ✅

Al terminar el diseño/refactor de estado:

1. **Diagrama/tabla** de qué dato vive dónde (server/URL/form/UI global/UI local).
2. **Stores Zustand** por dominio, tipadas, con `persist` + `partialize` cuando aplica.
3. **TanStack Query** configurado con `QueryClientProvider`, `staleTime` sensato.
4. **Selectors** documentados en los componentes críticos.
5. **Tests unitarios** de cada store (reset + acciones clave).
6. **Checklist** anterior verificada.

---

## Delegación a otras skills

- Validación de inputs y formularios → `/form-validation`.
- Auth tokens, refresh, storage seguro → `/jwt-strategy`.
- Performance de render → profiling con React DevTools (fuera de skill).
- Arquitectura general del proyecto → `/scaffold-go` (BE) o scaffolding React específico.
- Revisión de calidad post-implementación → `/check` o `/audit-dev`.
