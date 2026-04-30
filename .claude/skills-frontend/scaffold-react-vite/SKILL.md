---
name: scaffold-react-vite
description: "React+Vite project scaffold decision guide: structure, tooling, config decisions, dependency baseline, anti-patterns."
category: "frontend"
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# scaffold-react-vite — Project Scaffold Decision Guide

React 18+ with Vite, TypeScript strict, client-side SPA consuming Go/TS backend.

## MANDATORY WORKFLOW

**Antes de generar cualquier código, completar estos pasos en orden.**

### Step 0: Gather Requirements

Clarificar (o inferir del contexto si ya fue especificado):

1. **Project name** (kebab-case)
2. **Backend:** Go / TS — Base URL del API
3. **Auth:** JWT / Session cookies / OAuth
4. **i18n:** react-i18next / ninguna
5. **Design system:** shadcn/ui (default) / custom existente

Si el usuario ya especificó estos valores, saltar directamente al Step 1.

### Step 1: Implementar

Seguir: Project Structure → Dependency Baseline → Vite Config Decisions.

### Step 2: Verificar

```bash
npm run build    # tsc + vite build sin errores
npm run test     # vitest pasa
npm run lint     # ESLint sin warnings
```

## Project Structure

```
src/
├── main.tsx, App.tsx
├── routes/              # Router config, layouts, pages
├── components/ui/       # shadcn primitives
├── components/features/ # Domain components
├── hooks/queries/       # TanStack Query hooks (use-<resource>.ts)
├── hooks/use-*.ts       # Custom hooks
├── lib/api.ts           # Axios/ky with interceptors
├── lib/validations/     # Zod schemas
├── stores/              # Zustand (UI state only)
├── types/               # Shared TS types
├── styles/, assets/
tests/unit/, tests/e2e/
```

**Conventions:** Components PascalCase (one per file), hooks `use-*` kebab-case, query hooks return `useQuery`/`useMutation`, types co-located or in `types/` if shared, barrel exports only when helpful, path alias `@/` → `src/`.

## Vite Config Decisions

| Decision | Guidance |
|---|---|
| Dev proxy | `server.proxy` → forward `/api` to backend, avoids CORS |
| Env variables | `VITE_` prefix. `.env.example` required. Validate at startup |
| Build target | `esnext` default; `es2020` only for older browser support |
| Port | 5173, `host: true` for network access |
| Path alias | `"@"` → `src/` in vite.config.ts and tsconfig.json |

Env baseline: `VITE_API_URL`, `VITE_APP_ENV`
Scripts: `dev`, `build` (tsc + vite build), `preview`, `lint`, `test`, `test:e2e`, `format`

> → Read references/dependency-baseline.md for full dependency list (runtime, dev, UI) and tooling checklist

> → Read references/anti-patterns.md for common anti-patterns to avoid
