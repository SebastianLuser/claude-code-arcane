# 2. Bundle Size Optimization (CRITICAL)

## 2.1 Avoid Barrel File Imports — CRITICAL
Barrels (`index.ts` files that re-export everything) drag in thousands of unused modules.
```ts
// ✗ import { debounce } from 'lodash';   (all of lodash)
// ✓ import debounce from 'lodash/debounce';
```
Configure `optimizePackageImports` in `next.config.js` for large libs.

## 2.4 Dynamic Imports for Heavy Components — CRITICAL
```tsx
const Chart = dynamic(() => import('./Chart'), { ssr: false, loading: () => <Skeleton/> });
```
For charts, rich text editors, modals, maps — everything not needed on the first render.

## 2.5 Prefer Statically Analyzable Paths — HIGH
Imports with literal paths/explicit maps, not built at runtime → enables tree-shaking.

## 2.2 Conditional Module Loading — HIGH
Load large data/modules only when the feature is activated.

## 2.6 Preload Based on User Intent — MEDIUM
Preload the heavy bundle on hover/focus, before it is needed.
```tsx
<button onMouseEnter={() => import('./HeavyModal')}>Open</button>
```

## 2.3 Defer Non-Critical Third-Party Libraries — MEDIUM
Analytics, logging, error tracking → load after hydration, do not block the initial bundle (`next/script` with `strategy="afterInteractive"` or `lazyOnload`).

_Ref: https://nextjs.org/docs/app/api-reference/components/script · https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports_
