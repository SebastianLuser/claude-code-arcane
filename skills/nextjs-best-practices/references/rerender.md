# 5. Re-render Optimization (MEDIUM)

## 5.4 Don't Define Components Inside Components — HIGH
Definirlos inline los remonta en cada render (pierde estado y DOM). Definir a nivel módulo o extraer.
```tsx
// ✗ function Parent(){ function Row(){...}; return <Row/> }
// ✓ Row a nivel módulo, fuera de Parent
```

## 5.1 Calculate Derived State During Rendering — MEDIUM
Computar de props/state durante el render, no guardarlo en `useState` (se desincroniza).
```tsx
const fullName = `${first} ${last}`; // ✓  no useState + useEffect
```

## 5.11 Use Functional setState Updates — MEDIUM
`setCount(c => c + 1)` — opera sobre el último valor, callbacks estables.

## 5.12 Use Lazy State Initialization — MEDIUM
`useState(() => expensiveInit())` — no recomputa en cada render.

## 5.13 Use Transitions for Non-Urgent Updates — MEDIUM
`startTransition(() => setFilter(x))` — mantiene la UI responsiva.

## 5.14 useDeferredValue for Expensive Derived Renders — MEDIUM
Mantiene el input responsivo difiriendo el resultado pesado.

## 5.15 Use useRef for Transient Values — MEDIUM
Valores que cambian seguido y no son UI → `useRef`, no re-render.

## 5.2 Defer State Reads to Usage Point — MEDIUM
Leer state dinámico dentro del callback, no suscribirse en render time.

## 5.5 Extract Default Non-primitive Values — MEDIUM
Defaults objeto/función a constantes a nivel módulo → preserva memoización.

## 5.6 Extract to Memoized Components — MEDIUM
Aislar trabajo caro en componentes memoizados con early returns.

## 5.8 Put Interaction Logic in Event Handlers — MEDIUM
Side effects de interacción van en handlers, no en `useEffect`.

## 5.9 Split Combined Hook Computations — MEDIUM
Separar hooks con dependencias distintas → no recomputar lo independiente.

## 5.10 Subscribe to Derived State — MEDIUM
Suscribirse a un booleano derivado, no al valor continuo → menos renders.

## 5.3 Don't Wrap Simple Expressions in useMemo — LOW-MEDIUM
El overhead del hook supera el cómputo de un primitivo.

## 5.7 Narrow Effect Dependencies — LOW
Dependencias primitivas, no objetos enteros.

_Ref: https://react.dev/reference/react/useTransition · https://react.dev/learn/you-might-not-need-an-effect_
