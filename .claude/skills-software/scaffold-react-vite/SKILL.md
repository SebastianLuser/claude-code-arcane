---
name: scaffold-react-vite
description: "React+Vite project scaffold decision guide: structure, tooling, config decisions, dependency baseline, anti-patterns."
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# scaffold-react-vite — Project Scaffold Decision Guide

React 18+ with Vite, TypeScript strict, client-side SPA consuming Go/TS backend.

## Pre-scaffold Questions

1. Project name (kebab-case)
2. Backend (Go? TS? Base URL?)
3. Auth: JWT / session cookies / OAuth
4. i18n: react-i18next / none
5. Design system: shadcn/ui (default) / existing custom

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

## Dependency Baseline

**Runtime:** react, react-dom, react-router-dom, @tanstack/react-query, @tanstack/react-query-devtools, zustand, axios (or ky), react-hook-form, @hookform/resolvers, zod, lucide-react, class-variance-authority, clsx, tailwind-merge

**Dev:** tailwindcss, postcss, autoprefixer, vitest, @vitest/ui, @vitejs/plugin-react, jsdom, @testing-library/{react,jest-dom,user-event}, @playwright/test, eslint, eslint-config-prettier, prettier, prettier-plugin-tailwindcss, husky, lint-staged, @types/node

**UI:** shadcn/ui init + base: button, card, input, form, label, dialog, dropdown-menu, toast, table

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

## Tooling Checklist

- [ ] TS `strict: true` + `noUncheckedIndexedAccess: true`, path aliases in tsconfig + vite
- [ ] ESLint (react-hooks, react-refresh) + Prettier (tailwindcss plugin)
- [ ] Husky + lint-staged pre-commit
- [ ] Vitest (jsdom + setup file) + Playwright (dev server baseURL)

**Optional (per-project):** i18n, charts (Recharts/nivo), TanStack Table, analytics (Posthog/Plausible), Sentry, Storybook

## Anti-patterns

- TS without strict mode — defeats purpose
- Missing path aliases — `../../../` unmanageable
- No env validation — cryptic runtime failures
- No Husky/lint-staged — broken code in PRs
- Barrel exports everywhere — circular deps, hurts tree-shaking
- Server state in Zustand — use TanStack Query
- No `.env.example` — new devs blocked
