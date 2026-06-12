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

Reglas de re-render, rendering y micro-optimización JS para React. Ordenadas por impacto. Catálogo completo (64 reglas) + ejemplos: skill `nextjs-best-practices`.

## HIGH — Estructura de componentes

- **No definir componentes dentro de componentes.** Definir a nivel módulo o extraer; definirlos inline los remonta en cada render (pierde estado, mata performance).
- **`content-visibility: auto`** para listas largas — difiere render y paint de lo que está off-screen.
- **`defer`/`async` en `<script>`** para no bloquear el render durante el parsing.
- **Resource hints de React DOM** (`preload`, `preconnect`, `prefetchDNS`) para recursos críticos.

## MEDIUM — Re-render optimization

- **Calcular derived state durante el render**, no guardarlo en `useState` (se desincroniza y genera renders extra).
- **Leer state dinámico en el callback**, no suscribirse en render time cuando solo se usa en un handler.
- **Functional `setState`** (`setX(prev => ...)`) para operar sobre el último valor y crear callbacks estables.
- **Lazy state init**: pasar función a `useState(() => expensive())` para no recomputar en cada render.
- **`useTransition` para updates no urgentes**; `useDeferredValue` para mantener inputs responsivos durante cómputo pesado.
- **`useRef` para valores transitorios** (no-UI) que cambian seguido y no deben disparar render.
- **Extraer defaults no-primitivos** de componentes memoizados a constantes a nivel módulo (preserva la memoización).
- **Side effects de interacción van en event handlers**, no en `useEffect`.
- **Dependencias de effect primitivas y estrechas**, no objetos enteros.

## LOW-MEDIUM — useMemo / JS

- **No envolver expresiones simples en `useMemo`** — el overhead del hook supera el cómputo.
- **Index maps (`Map`) para lookups repetidos** en vez de `.find()`/`.includes()` en loops → O(1).
- **`.flatMap()`** en lugar de `.map().filter(Boolean)`; combinar iteraciones múltiples de array en un solo loop.
- **Hoist de `RegExp`** a nivel módulo (no recrear en cada render).
- **Early return** cuando el resultado ya está determinado; chequear `length` antes de operaciones caras (sort).
- **`.toSorted()`** en vez de `.sort()` para inmutabilidad.

## Hydration

- Evitar mismatch sin flicker con scripts inline síncronos cuando se actualiza el DOM antes de hidratar.
- `suppressHydrationWarning` solo para diferencias server/client intencionales (fechas, IDs).
- Conditional rendering explícito con ternario, no `&&` (evita renderizar `0` u otros falsy).

## Anti-Patterns

- Componentes definidos dentro del render de otro componente
- `useMemo`/`useCallback` por default "por las dudas" sin medir
- `useEffect` para lógica que pertenece a un event handler
- Guardar en state lo que se puede derivar de props/state existentes
- `.find()` dentro de `.map()` (O(n²)) sobre listas grandes

---

_Derivado de [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (react-best-practices, MIT). Condensado al formato Arcane._
