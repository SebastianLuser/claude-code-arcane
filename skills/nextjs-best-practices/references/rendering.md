# 6. Rendering Performance (MEDIUM)

## 6.2 CSS content-visibility for Long Lists — HIGH
```css
.row { content-visibility: auto; contain-intrinsic-size: 0 80px; }
```
Difiere render y paint de lo off-screen.

## 6.8 Use defer or async on Script Tags — HIGH
`defer`/`async` para no bloquear el render durante el parsing.

## 6.10 Use React DOM Resource Hints — HIGH
```ts
import { preload, preconnect } from 'react-dom';
preconnect('https://cdn.example.com');
preload('/hero.jpg', { as: 'image' });
```

## 6.5 Prevent Hydration Mismatch Without Flickering — MEDIUM
Script inline síncrono que actualiza el DOM antes de hidratar (ej: theme).

## 6.7 Use Activity Component for Show/Hide — MEDIUM
`<Activity>` preserva estado y DOM para componentes que togglean visibilidad seguido.

## 6.6 Suppress Expected Hydration Mismatches — LOW-MEDIUM
`suppressHydrationWarning` solo para diferencias server/client intencionales (fechas, IDs).

## 6.1 Animate SVG Wrapper Instead of SVG Element — LOW
Envolver el SVG en un div y animar el wrapper → aceleración por hardware.

## 6.3 Hoist Static JSX Elements — LOW
JSX estático fuera del componente → no se recrea en cada render.

## 6.4 Optimize SVG Precision — LOW
Reducir precisión de coordenadas SVG → menor tamaño, sin impacto visual.

## 6.9 Use Explicit Conditional Rendering — LOW
Ternario en vez de `&&` → evita renderizar `0` u otros falsy.
```tsx
{count > 0 ? <Badge n={count}/> : null}  // no {count && ...}
```

## 6.11 Use useTransition Over Manual Loading States — LOW
`useTransition` da pending state automático en vez de `useState` manual.

_Ref: https://developer.mozilla.org/docs/Web/CSS/content-visibility · https://react.dev/reference/react-dom/preload_
