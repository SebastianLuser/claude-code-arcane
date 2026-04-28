---
name: testing
description: "Test strategy, framework setup, and helper patterns for web projects. DO NOT TRIGGER when: correr tests existentes, debugging de un test roto, fix de un test flaky (usar test-flakiness)."
argument-hint: "[unit|integration|e2e|helpers|all]"
user-invocable: true
allowed-tools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep"]
---

# Testing

Test strategy, framework setup, and helper patterns. Stack: React + Vite + TS, Vitest, Playwright.

---

## Test Layer Decision Table

| Layer | Tool | Use When | Skip When |
|---|---|---|---|
| Unit | Vitest | Pure functions, hooks, Zustand stores, Zod schemas, utils | Thin wrapper with no logic |
| Integration | Vitest + Testing Library | Component interactions, form flows, TanStack Query cache behavior | Already covered by unit + e2e |
| E2E | Playwright | Critical user journeys, auth flows, multi-page navigation | Fast feedback needed; flaky env |

**Heuristic:** Bug loses money or blocks users = e2e. Bug confuses developers = unit. Neither = skip.

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

---

## Framework Setup Checklist

**Vitest:** extend `vite.config.ts` for shared aliases | `setupFiles` for Testing Library cleanup | `coverage.provider: 'v8'` | `environment: 'jsdom'` | path aliases match `tsconfig.json`

**Playwright:** `baseURL` from env | `webServer` auto-starts dev server | chromium minimum | `testDir` = `e2e/` | retries 1-2 CI, 0 local

**CI:** unit+integration on every push/PR | e2e on PR-to-main only (cost gate) | coverage artifact | Playwright report on failure

---

## Test Helper Patterns

| Helper | Purpose | Key Rule |
|---|---|---|
| Custom render wrapper | Wraps `render()` with all providers (Router, QueryClient, Theme) | Every integration test uses this, never raw `render` |
| Factories | Return valid domain objects with defaults + overrides | Prevents brittle tests when types gain required fields |
| MSW handlers | Centralized API mocks in `tests/mocks/handlers.ts` | Never mock `fetch` directly; override per-test for errors |
| Test QueryClient | Fresh `QueryClient` per test, `retry: false`, short `gcTime` | Shared clients leak state between tests |
| Fixtures | Reusable JSON payloads in `tests/fixtures/` | Single source of truth for API response shapes |

---

## Anti-Patterns

| Anti-Pattern | Problem | Do Instead |
|---|---|---|
| Testing implementation details | Breaks on refactor, passes on bugs | Test user actions and visible outcomes |
| Snapshot overuse | Noise; reviewers rubber-stamp diffs | Assert structure explicitly; snapshot only small serializable config |
| Flaky selectors (`div > span:nth-child(3)`) | Breaks on markup change | `getByRole`, `getByLabelText`, `data-testid` as last resort |
| `waitFor` without assertion | Hides timing bugs | Always assert inside `waitFor` callback |
| Shared mutable state | Order-dependent failures | Reset stores, QueryClient, MSW in `beforeEach` |
| Mocking third-party internals | Couples to library impl | Mock at the boundary (API layer) |
| 100% coverage target | Incentivizes testing trivial code | Use per-category thresholds (below) |

---

## Coverage Strategy

| Category | Threshold | Rationale |
|---|---|---|
| Utils / pure logic | 90%+ | High value, easy to test |
| State management | 80%+ | Core app behavior |
| API client layer | 80%+ | Error handling matters |
| UI components | 60-70% | Diminishing returns on presentational code |
| E2E critical paths | Count journeys | Track covered user journeys, not line % |

Measure **branch coverage**, not just lines. Enforce via `coverage.thresholds` on changed files only.

## Directory Layout

`tests/` — `setup/` (render wrapper), `helpers/` (factories), `mocks/` (MSW), `fixtures/` (JSON), `unit/`, `integration/` | `e2e/` — Playwright (separate root, not inside `tests/`)
