# 2. Bundle Size Optimization (CRITICAL)

## 2.1 Avoid Barrel File Imports — CRITICAL
Los barrels (`index.ts` que re-exportan todo) arrastran miles de módulos sin usar.
```ts
// ✗ import { debounce } from 'lodash';   (todo lodash)
// ✓ import debounce from 'lodash/debounce';
```
Configurar `optimizePackageImports` en `next.config.js` para libs grandes.

## 2.4 Dynamic Imports for Heavy Components — CRITICAL
```tsx
const Chart = dynamic(() => import('./Chart'), { ssr: false, loading: () => <Skeleton/> });
```
Para charts, editores de texto rico, modales, mapas — todo lo no necesario en el primer render.

## 2.5 Prefer Statically Analyzable Paths — HIGH
Imports con paths literales/mapas explícitos, no construidos en runtime → permite tree-shaking.

## 2.2 Conditional Module Loading — HIGH
Cargar data/módulos grandes solo cuando la feature se activa.

## 2.6 Preload Based on User Intent — MEDIUM
Precargar el bundle pesado en hover/focus, antes de que se necesite.
```tsx
<button onMouseEnter={() => import('./HeavyModal')}>Abrir</button>
```

## 2.3 Defer Non-Critical Third-Party Libraries — MEDIUM
Analytics, logging, error tracking → cargar después de hydration, no bloquear el bundle inicial (`next/script` con `strategy="afterInteractive"` o `lazyOnload`).

_Ref: https://nextjs.org/docs/app/api-reference/components/script · https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports_
