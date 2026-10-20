# Animation patterns

Examples use Motion for React (`import { motion, AnimatePresence } from "motion/react"`). Every file that uses it in the Next.js App Router needs `"use client"`. Durations and springs come from your tokens file.

## Button feedback

```tsx
<motion.button whileTap={{ scale: 0.97 }} transition={{ duration: tokens.fast }}>
  Save
</motion.button>
```

Plain CSS is enough when no library is installed: `button:active { transform: scale(0.97); transition: transform 100ms ease-out; }`.

## List enter with stagger

```tsx
const list = { show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

<motion.ul variants={list} initial="hidden" animate="show">
  {items.map((i) => <motion.li key={i.id} variants={item}>{i.name}</motion.li>)}
</motion.ul>
```

Keep the stagger short (30–50 ms) and cap it: a list of 100 items should not take 4 seconds to appear. Only animate the first visible items.

## Modal

```tsx
<AnimatePresence>
  {open && (
    <motion.div key="modal" role="dialog" aria-modal="true"
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: tokens.fast } }}>
      …
    </motion.div>
  )}
</AnimatePresence>
```

Animation is the easy part: the dialog must move focus inside on open, trap it, close on Escape and return focus to the trigger on close. Prefer a dialog primitive (the native `<dialog>`, Radix, React Aria) and animate it, rather than building one.

## Toasts

Enter from the edge they live on, exit faster, never steal focus. Use `aria-live="polite"` on the container so screen readers announce them, and pause the auto-dismiss timer while hovered or focused.

## Page transitions

- Next.js App Router: the View Transitions API (where the browser and the Next.js version support it), or a `template.tsx` with an enter animation. Exit animations between routes are fragile in the App Router; keep transitions to an enter fade if they cause trouble.
- Keep them under ~300 ms, and never delay the new page's content to finish the old page's exit.

## Scroll reveal

```tsx
<motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} />
```

`once: true`: elements that re-animate on every scroll become noise. Content must still be readable when JS fails: do not ship it hidden in the HTML.

## Expanding content (accordion)

Animate height with the library's `layout` or `animate={{ height: "auto" }}` on the wrapper, or in CSS a grid row from `0fr` to `1fr`. The trigger is a `<button>` with `aria-expanded` and `aria-controls`.

## Drag and swipe

```tsx
<motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
  onDragEnd={(_, info) => { if (info.offset.x < -100 || info.velocity.x < -500) onDismiss(); }} />
```

Every gesture needs a non-gesture alternative (a visible button) for keyboard and assistive technology users.

## Loading states

- A spinner or skeleton only after a short delay (~300 ms), so fast responses do not flash.
- Skeletons match the final layout to avoid shift; shimmer is decoration and stops under reduced motion.
- A button in progress keeps its width (no layout jump) and is disabled against double submits.

## Infinite or decorative loops

Pause them when off-screen (`IntersectionObserver`) and when the tab is hidden (`visibilitychange`), and do not run them at all under reduced motion.
