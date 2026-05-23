---
name: testing
description: "Test strategy, framework setup, and helper patterns for web projects (Go/TS/React/RN)."
category: "testing"
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

> → Read references/framework-setup.md for setup checklist, directory layout, and what-to-test-per-module table

> → Read references/helper-patterns.md for test helper patterns (render wrapper, factories, MSW, fixtures)

> → Read references/anti-patterns.md for common testing anti-patterns and what to do instead

> → Read references/coverage-strategy.md for per-category coverage thresholds and enforcement strategy
