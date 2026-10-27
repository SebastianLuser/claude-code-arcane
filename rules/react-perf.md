---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "src/components/**"
  - "src/hooks/**"
  - "components/**"
  - "hooks/**"
---

# React Performance Rules

Re-render, rendering and JS micro-optimization rules for React. Ordered by impact. Full catalog (64 rules) + examples: the `nextjs-best-practices` skill.

## HIGH — Component structure

- **Do not define components inside components.** Define them at module level or extract them; defining them inline remounts them on every render (loses state, kills performance).
- **`content-visibility: auto`** for long lists — defers render and paint of what is off-screen.
- **`defer`/`async` on `<script>`** so render is not blocked during parsing.
- **React DOM resource hints** (`preload`, `preconnect`, `prefetchDNS`) for critical resources.

## MEDIUM — Re-render optimization

- **Compute derived state during render**, do not store it in `useState` (it gets out of sync and causes extra renders).
- **Read dynamic state in the callback**, do not subscribe at render time when it is only used in a handler.
- **Functional `setState`** (`setX(prev => ...)`) to operate on the latest value and create stable callbacks.
- **Lazy state init**: pass a function to `useState(() => expensive())` so it is not recomputed on every render.
- **`useTransition` for non-urgent updates**; `useDeferredValue` to keep inputs responsive during heavy computation.
- **`useRef` for transient values** (non-UI) that change often and must not trigger a render.
- **Extract non-primitive defaults** from memoized components into module-level constants (preserves memoization).
- **Interaction side effects go in event handlers**, not in `useEffect`.
- **Narrow, primitive effect dependencies**, not whole objects.

## LOW-MEDIUM — useMemo / JS

- **Do not wrap simple expressions in `useMemo`** — the hook overhead exceeds the computation.
- **Index maps (`Map`) for repeated lookups** instead of `.find()`/`.includes()` in loops → O(1).
- **`.flatMap()`** instead of `.map().filter(Boolean)`; combine multiple array iterations into a single loop.
- **Hoist `RegExp`** to module level (do not recreate it on every render).
- **Early return** when the result is already determined; check `length` before expensive operations (sort).
- **`.toSorted()`** instead of `.sort()` for immutability.

## Hydration

- Avoid mismatches without flicker using synchronous inline scripts when the DOM is updated before hydration.
- `suppressHydrationWarning` only for intentional server/client differences (dates, IDs).
- Explicit conditional rendering with a ternary, not `&&` (avoids rendering `0` or other falsy values).

## Anti-Patterns

- Components defined inside another component's render
- `useMemo`/`useCallback` by default "just in case" without measuring
- `useEffect` for logic that belongs in an event handler
- Storing in state what can be derived from existing props/state
- `.find()` inside `.map()` (O(n²)) over large lists

---

_Derived from [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (react-best-practices, MIT). Condensed to the Arcane format._
