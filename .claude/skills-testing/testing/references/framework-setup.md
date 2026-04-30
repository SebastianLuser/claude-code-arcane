# Framework Setup & Directory Layout

## Setup Checklist

**Vitest:** extend `vite.config.ts` for shared aliases | `setupFiles` for Testing Library cleanup | `coverage.provider: 'v8'` | `environment: 'jsdom'` | path aliases match `tsconfig.json`

**Playwright:** `baseURL` from env | `webServer` auto-starts dev server | chromium minimum | `testDir` = `e2e/` | retries 1-2 CI, 0 local

**CI:** unit+integration on every push/PR | e2e on PR-to-main only (cost gate) | coverage artifact | Playwright report on failure

## Directory Layout

`tests/` — `setup/` (render wrapper), `helpers/` (factories), `mocks/` (MSW), `fixtures/` (JSON), `unit/`, `integration/` | `e2e/` — Playwright (separate root, not inside `tests/`)

## What to Test per Module

| Module | Layer | Assert |
|---|---|---|
| Zustand stores | Unit | State transitions, selectors, action side-effects |
| TanStack Query hooks | Integration | Cache keys, refetch triggers, error/loading states |
| React Hook Form + Zod | Unit + Integration | Schema rules; submit/error rendering |
| shadcn/ui compositions | Integration | a11y roles, keyboard nav, conditional rendering |
| Router guards/loaders | Integration | Redirects, loader data shape, error boundaries |
| API client functions | Unit | Request shaping, response mapping, error normalization |
| Utility/pure functions | Unit | Edge cases, boundary values, error throws |
