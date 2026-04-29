# scaffold-react-vite — Dependency Baseline

## Runtime

react, react-dom, react-router-dom, @tanstack/react-query, @tanstack/react-query-devtools, zustand, axios (or ky), react-hook-form, @hookform/resolvers, zod, lucide-react, class-variance-authority, clsx, tailwind-merge

## Dev

tailwindcss, postcss, autoprefixer, vitest, @vitest/ui, @vitejs/plugin-react, jsdom, @testing-library/{react,jest-dom,user-event}, @playwright/test, eslint, eslint-config-prettier, prettier, prettier-plugin-tailwindcss, husky, lint-staged, @types/node

## UI (shadcn/ui)

Init + base components: button, card, input, form, label, dialog, dropdown-menu, toast, table

## Tooling Checklist

- [ ] TS `strict: true` + `noUncheckedIndexedAccess: true`, path aliases in tsconfig + vite
- [ ] ESLint (react-hooks, react-refresh) + Prettier (tailwindcss plugin)
- [ ] Husky + lint-staged pre-commit
- [ ] Vitest (jsdom + setup file) + Playwright (dev server baseURL)

**Optional (per-project):** i18n, charts (Recharts/nivo), TanStack Table, analytics (Posthog/Plausible), Sentry, Storybook
