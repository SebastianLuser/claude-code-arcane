# 6. Rendering Performance (MEDIUM)

## 6.2 CSS content-visibility for Long Lists — HIGH
```css
.row { content-visibility: auto; contain-intrinsic-size: 0 80px; }
```
Defers render and paint of what is off-screen.

## 6.8 Use defer or async on Script Tags — HIGH
`defer`/`async` so render is not blocked during parsing.

## 6.10 Use React DOM Resource Hints — HIGH
```ts
import { preload, preconnect } from 'react-dom';
preconnect('https://cdn.example.com');
preload('/hero.jpg', { as: 'image' });
```

## 6.5 Prevent Hydration Mismatch Without Flickering — MEDIUM
A synchronous inline script that updates the DOM before hydration (e.g. theme).

## 6.7 Use Activity Component for Show/Hide — MEDIUM
`<Activity>` preserves state and DOM for components that toggle visibility often.

## 6.6 Suppress Expected Hydration Mismatches — LOW-MEDIUM
`suppressHydrationWarning` only for intentional server/client differences (dates, IDs).

## 6.1 Animate SVG Wrapper Instead of SVG Element — LOW
Wrap the SVG in a div and animate the wrapper → hardware acceleration.

## 6.3 Hoist Static JSX Elements — LOW
Static JSX outside the component → not recreated on every render.

## 6.4 Optimize SVG Precision — LOW
Reduce SVG coordinate precision → smaller size, no visual impact.

## 6.9 Use Explicit Conditional Rendering — LOW
Ternary instead of `&&` → avoids rendering `0` or other falsy values.
```tsx
{count > 0 ? <Badge n={count}/> : null}  // not {count && ...}
```

## 6.11 Use useTransition Over Manual Loading States — LOW
`useTransition` gives automatic pending state instead of a manual `useState`.

_Ref: https://developer.mozilla.org/docs/Web/CSS/content-visibility · https://react.dev/reference/react-dom/preload_
