---
name: state-management
description: "State management decision guide: classify state types, Zustand for client, TanStack Query for server, anti-patterns."
category: "frontend"
argument-hint: "[feature or screen name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task
---
# State Management — Decision Guide

Stack: React + Vite + TypeScript (SPA) and React Native.
Use when: designing state layer, choosing libs, refactoring overgrown stores.
Skip when: form validation (`/form-validation`), auth tokens (`/jwt-strategy`), render perf unrelated to state.

## State Category Table

| Category | Tool |
|---|---|
| **Server state** (API data) | **TanStack Query** |
| **URL state** (filters, page, tab) | `useSearchParams` / React Router |
| **Form state** (inputs, validation) | **React Hook Form** |
| **UI shared** (theme, sidebar, auth user) | **Zustand** |
| **UI local** (modal, hover) | `useState` / `useReducer` |

~80% of what used to go in Redux belongs in TanStack Query. Server data in Zustand = desynchronized store.

## Library Selection

| Library | Verdict |
|---|---|
| **Zustand** | DEFAULT — minimal, ~1KB, excellent TS |
| **TanStack Query** | DEFAULT for server state — cache, dedupe, refetch |
| Jotai | Case-by-case — atomic model for dense derivations |
| Redux Toolkit | Only if team requests — mature, more boilerplate |
| Context API | Static values only — theme, i18n, flags, DI |
| Recoil | DO NOT USE — abandoned (2024) |

## Zustand Design

**Split by domain:** `useAuth`, `useUI`, `useCart` — never one giant store. Split on: update frequency, consumers, persistence needs.
**Selectors:** specific slices (`s => s.user`), `shallow` for objects. Never read whole store.
**Derived state:** getter or `useMemo`. Never persist derived values.
**Persistence:** `persist` + `partialize`. NEVER persist full user, tokens, PII. Rule: if localStorage exposure concerns you, skip it. RN: AsyncStorage non-sensitive, SecureStore for secrets.
**Devtools:** `devtools` middleware in dev.

## TanStack Query Strategy

**Keys:** structured arrays `['courses', tenantId]` — hierarchy enables granular invalidation.
**Stale time:** rarely changing 5-10min, frequent 10-30sec, static `Infinity`.
**Invalidation:** `onSuccess` in mutations → `invalidateQueries`.
Never copy query data into Zustand — TanStack Query IS the cache.

## Context API

Valid: theme, i18n, flags, DI (rarely changing). Invalid: frequent updates (re-renders subtree).

## Anti-patterns

- Redux/Zustand for server state — use TanStack Query
- Context as global store — subtree re-renders
- Persisting full `user` / tokens in localStorage — PII/XSS risk
- Multiple sources of truth — server + local copy
- State manager for URL state — use `useSearchParams`
- Monolithic store, whole-store selectors without shallow
- Direct mutation (`state.x = y`) — use `set` or immer
- `useEffect` to sync server→store — TanStack Query handles this

## Checklist

- [ ] Every datum classified: server / URL / form / UI-global / UI-local
- [ ] Server state in TanStack Query, URL state in router
- [ ] Stores split by domain, specific selectors with shallow
- [ ] `partialize` set — no PII/tokens persisted
- [ ] Context only for static values
- [ ] (RN) SecureStore for secrets, AsyncStorage for non-sensitive
