---
name: scaffold-react-vite
description: "Scaffold de proyecto frontend estilo Alizia/Tuni: React + Vite + TypeScript, TanStack Query, React Router, shadcn/ui, Vitest, Playwright. Usar para nuevos frontends en Educabot."
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# scaffold-react-vite — React+Vite Frontend Scaffolder

Genera un proyecto frontend estilo **Alizia/Tuni**: React 18+ con Vite, TypeScript strict, routing client-side, data fetching con TanStack Query, UI con shadcn/ui + Tailwind.

## Cuándo usar

- Nuevo frontend para Educabot (Alizia, Tuni, o nuevos productos)
- SPA que consume un backend Go/TS
- POC frontend rápido con buena base

## Stack (alineado con Alizia/Tuni)

- **React 18+** con hooks + Suspense
- **Vite 5+** (build + dev server)
- **TypeScript** strict mode
- **React Router v6** (data routers, loaders)
- **TanStack Query v5** (server state)
- **Zustand** (client state cuando hace falta)
- **Tailwind CSS v3+** + **shadcn/ui**
- **React Hook Form** + **Zod**
- **Axios** o **ky** (HTTP client)
- **Vitest** (unit) + **Playwright** (e2e) + **Testing Library**
- **ESLint** + **Prettier** + **Husky** + **lint-staged**

## Preguntas previas

1. **Nombre del proyecto** (kebab-case)
2. **Backend que va a consumir** (Go? TS? URL base?)
3. **Auth**: JWT / Session cookies / OAuth
4. **i18n**: react-i18next / ninguno
5. **Design system**: shadcn/ui (default) / sistema propio existente

## Estructura generada

```
<project>/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/
│   │   ├── index.tsx         # router config
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── dashboard/
│   ├── components/
│   │   ├── ui/               # shadcn
│   │   └── features/
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   └── queries/          # TanStack Query hooks
│   ├── lib/
│   │   ├── api.ts            # axios/ky instance
│   │   ├── utils.ts
│   │   └── validations/      # Zod schemas
│   ├── stores/               # Zustand stores
│   ├── types/
│   ├── styles/
│   │   └── globals.css
│   └── assets/
├── tests/
│   ├── unit/
│   └── e2e/
├── public/
├── .env.example
├── .env.development
├── .eslintrc.cjs
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── package.json
```

## Pasos de scaffolding

### 1. Crear proyecto base
```bash
npm create vite@latest <project> -- --template react-ts
cd <project>
npm install
```

### 2. Deps core
```bash
npm i react-router-dom @tanstack/react-query @tanstack/react-query-devtools \
  zustand axios \
  react-hook-form @hookform/resolvers zod \
  lucide-react class-variance-authority clsx tailwind-merge
```

### 3. Dev deps
```bash
npm i -D tailwindcss postcss autoprefixer \
  vitest @vitest/ui @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  @playwright/test \
  eslint-config-prettier prettier prettier-plugin-tailwindcss \
  husky lint-staged \
  @types/node
```

### 4. Tailwind init
```bash
npx tailwindcss init -p
```

### 5. shadcn/ui
```bash
npx shadcn@latest init
npx shadcn@latest add button card input form label dialog dropdown-menu toast table
```

### 6. Configuración de `vite.config.ts`
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: { port: 5173, host: true },
});
```

### 7. `tsconfig.json` con strict + paths
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### 8. Setup router
`src/routes/index.tsx` con `createBrowserRouter` + data routers.

### 9. Setup TanStack Query
`src/main.tsx` envuelve App en `QueryClientProvider` con devtools.

### 10. API client
`src/lib/api.ts`:
```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      // redirect login
    }
    return Promise.reject(err);
  },
);
```

### 11. Env vars
`.env.example`:
```
VITE_API_URL=http://localhost:8080
VITE_APP_ENV=development
```

Vite solo expone vars con prefix `VITE_`.

### 12. Tests
- `vitest.config.ts` con jsdom + setup file
- `playwright.config.ts` con baseURL de dev server
- Scripts: `test`, `test:ui`, `test:e2e`, `test:coverage`

### 13. Linting
ESLint config con `react-hooks`, `react-refresh`, Prettier compat. Husky pre-commit → lint-staged → `eslint --fix` + `prettier --write`.

### 14. Scripts `package.json`
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "test": "vitest",
    "test:e2e": "playwright test",
    "format": "prettier --write src/"
  }
}
```

## Convenciones (estilo Alizia/Tuni)

- **Componentes**: PascalCase, un componente por archivo
- **Hooks**: `use-*` kebab-case
- **Queries**: en `hooks/queries/use-<resource>.ts` retornando `useQuery`/`useMutation`
- **Stores Zustand**: solo para UI state que trasciende componentes (ej. sidebar abierto, toast queue). Para server state usar TanStack Query siempre.
- **Tipos**: co-located o en `types/` si son compartidos
- **Barrel exports** solo cuando simplifica, no por default
- **Path alias** `@/` para todo

## Output final

```
✅ Proyecto creado en ./<project>
✅ Vite + React + TS configurado
✅ shadcn/ui listo (9 componentes base)
✅ Router + Query + Auth scaffolding listos
✅ Tests configurados (Vitest + Playwright)

Próximos pasos:
  cd <project>
  cp .env.example .env.development
  npm run dev  # http://localhost:5173
```

## Integraciones opcionales

Preguntar si sumar:
- **i18n**: react-i18next
- **Charts**: Recharts / nivo
- **Tables**: TanStack Table
- **Forms complejos**: multi-step wizard helpers
- **Analytics**: Posthog / Plausible
- **Monitoring**: Sentry
- **Storybook** para UI library

## Delegación

**Coordinar con:** `frontend-architect`, `ui-lead`, `design-system-lead`
**Reporta a:** `vp-engineering`
