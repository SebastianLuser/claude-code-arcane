# 5. Re-render Optimization (MEDIUM)

## 5.4 Don't Define Components Inside Components — HIGH
Defining them inline remounts them on every render (loses state and DOM). Define them at module level or extract them.
```tsx
// ✗ function Parent(){ function Row(){...}; return <Row/> }
// ✓ Row at module level, outside Parent
```

## 5.1 Calculate Derived State During Rendering — MEDIUM
Compute from props/state during render, do not store it in `useState` (it gets out of sync).
```tsx
const fullName = `${first} ${last}`; // ✓  no useState + useEffect needed
```

## 5.11 Use Functional setState Updates — MEDIUM
`setCount(c => c + 1)` — operates on the latest value, stable callbacks.

## 5.12 Use Lazy State Initialization — MEDIUM
`useState(() => expensiveInit())` — not recomputed on every render.

## 5.13 Use Transitions for Non-Urgent Updates — MEDIUM
`startTransition(() => setFilter(x))` — keeps the UI responsive.

## 5.14 useDeferredValue for Expensive Derived Renders — MEDIUM
Keeps the input responsive by deferring the heavy result.

## 5.15 Use useRef for Transient Values — MEDIUM
Values that change often and are not UI → `useRef`, no re-render.

## 5.2 Defer State Reads to Usage Point — MEDIUM
Read dynamic state inside the callback, do not subscribe at render time.

## 5.5 Extract Default Non-primitive Values — MEDIUM
Object/function defaults into module-level constants → preserves memoization.

## 5.6 Extract to Memoized Components — MEDIUM
Isolate expensive work in memoized components with early returns.

## 5.8 Put Interaction Logic in Event Handlers — MEDIUM
Interaction side effects go in handlers, not in `useEffect`.

## 5.9 Split Combined Hook Computations — MEDIUM
Split hooks with different dependencies → do not recompute what is independent.

## 5.10 Subscribe to Derived State — MEDIUM
Subscribe to a derived boolean, not the continuous value → fewer renders.

## 5.3 Don't Wrap Simple Expressions in useMemo — LOW-MEDIUM
The hook overhead exceeds the computation of a primitive.

## 5.7 Narrow Effect Dependencies — LOW
Primitive dependencies, not whole objects.

_Ref: https://react.dev/reference/react/useTransition · https://react.dev/learn/you-might-not-need-an-effect_
