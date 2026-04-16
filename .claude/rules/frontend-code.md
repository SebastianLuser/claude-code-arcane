---
paths:
  - "src/components/**"
  - "src/pages/**"
  - "src/app/**"
  - "src/views/**"
  - "src/features/**"
  - "src/hooks/**"
  - "app/**"
  - "pages/**"
---

# Frontend Code Rules

- Components are pure when possible — same props → same output. Side effects go in hooks / effect systems, not render.
- Props are typed. No `any`. Prefer a single discriminated union over multiple optional flags (`{ state: 'loading' } | { state: 'ready', data: X }` not `{ loading?, data? }`).
- State lives at the lowest level that needs it. Lift only when a sibling needs it. Global stores (Redux / Zustand / Pinia) are a last resort.
- Server state is separate from UI state — use React Query / SWR / TanStack Query / equivalent. Don't `useState` server data.
- No API calls from components directly. Route through a data-access hook or query client.
- Accessibility is mandatory, not optional: semantic HTML, keyboard navigation, focus management, `aria-*` where semantics aren't enough. Test with a screen reader at least once per feature.
- All user-facing strings go through i18n — never hardcoded in JSX. Placeholders for interpolation, no string concatenation.
- All forms have client-side validation AND trust server validation — client is UX, server is truth.
- Loading / empty / error states are designed, not afterthoughts. Every data-fetching component shows all three.
- CSS: use the project's styling system consistently (Tailwind classes, CSS Modules, styled-components). No inline styles except for dynamic values.
- No secrets in frontend code. API keys meant for backend never reach the bundle. Public keys (Stripe publishable, analytics) are explicitly marked.
- Bundle awareness: avoid importing entire libraries for one function (`import { debounce } from 'lodash'` not `import _ from 'lodash'`). Check bundle size on new deps.
- Performance: memoize expensive renders (`React.memo`, `useMemo`) only with evidence of a problem — premature memoization is its own anti-pattern.

## Anti-Patterns

- `useEffect` with external data fetch when a data-fetching library is already in the project
- Deep component nesting passing props through 5+ layers (prop drilling) — lift to context or compose differently
- Unmanaged re-renders triggered by new object/array literals in parent render
- DOM manipulation via `document.querySelector` inside a component
- Inline handlers defined in JSX for components that memoize
