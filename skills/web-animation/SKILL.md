---
name: web-animation
description: "Web UI animation that helps instead of decorating: when to animate, motion tokens, reduced motion, transform/opacity only, CSS vs the Motion library (motion/react), and patterns for feedback, lists, modals, page transitions, scroll and gestures. Add or review animation."
category: "frontend"
argument-hint: "[add <component> | review]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Web Animation

Motion has to guide attention, communicate state or keep spatial continuity. If it does none of those, remove it. Responsiveness beats smoothness: an animation that delays input is worse than none.

## Phase 1: Scope

| Mode | Does |
|---|---|
| `add <component>` | Adds motion to a component following the rules below |
| `review` | Audits existing animation and gives a verdict |

Detect the stack first: framework (React, Next.js App Router, Vue), styling (CSS modules, Tailwind), and whether `motion` (formerly Framer Motion) is already installed. Do not add the library for something CSS can do.

## Phase 2: Rules

1. **Animate `transform` and `opacity` only.** Never `width`, `height`, `top`, `left`, `margin` or `padding`: they trigger layout on every frame. For size changes, use the library's `layout` animation or a `grid-template-rows: 0fr → 1fr` transition.
2. **Reduced motion wins.** Under `prefers-reduced-motion: reduce`, drop movement (translate, scale, parallax, auto-playing loops) and keep at most a short opacity fade. In React with Motion: `useReducedMotion()`, or `<MotionConfig reducedMotion="user">` at the root.
3. **Tokens, not magic numbers.** Durations, easings and spring presets live in one file and components import them.
4. **Interruptible.** A user action mid-animation must take effect immediately; never block input until an animation ends.
5. **No layout shift.** Entering content reserves its space; animations must not push content the user is reading.
6. **SSR-safe.** The first client render matches the server HTML: an `initial` state of hidden content that only becomes visible after hydration hides content when JS is slow, and hurts LCP.

## Phase 3: Choosing the tool

| Need | Use |
|---|---|
| Hover, focus, press, color, simple enter | CSS transitions |
| Looping or keyframed decoration | CSS `@keyframes` (paused when off-screen or hidden) |
| Element entering or leaving the DOM, layout changes, shared elements, gestures, springs | Motion for React (`motion/react`), or the framework's equivalent |
| Page-to-page transitions | The View Transitions API where supported, or the library's presence animations |
| Scroll-linked effects | CSS scroll-driven animations where supported (check browser support), else `IntersectionObserver` or the library's `useScroll`; never a raw `scroll` listener |

## Phase 4: Durations and easing

| Token | Duration | For |
|---|---|---|
| `instant` | ~100 ms | Tooltips, focus, small state flips |
| `fast` | ~150–200 ms | Button feedback, toggles, icon swaps |
| `normal` | ~250–300 ms | Modals, panels, cards entering |
| `slow` | ~400–500 ms | Large surfaces, page transitions |

Enter with ease-out (fast start, gentle stop), exit faster than enter, and keep frequent interactions short: something users trigger a hundred times a day should barely animate.

> → Read references/patterns.md for code patterns (button feedback, stagger lists, modals with focus handling, toasts, page transitions, scroll reveal, accordions, drag and swipe, loading states) and their accessibility notes

## Phase 5: Verify

- Toggle reduced motion in the OS or DevTools rendering panel: nothing moves except short fades.
- Record a Performance trace while the animation runs: no layout or long tasks per frame, and input stays responsive.
- On a throttled mobile CPU (DevTools 4× slowdown) it still feels instant.
- Playwright screenshots of the final states, as `frontend-code` asks.

## Phase 6: Verdict (review mode)

| Verdict | When |
|---|---|
| **PASS** | Every animation has a purpose, respects reduced motion, animates transform/opacity, uses tokens |
| **CONCERNS** | Hardcoded timings, decorative motion without purpose, long durations on frequent actions |
| **FAIL** | Ignores reduced motion, animates layout properties in a hot path, blocks input, or hides content until hydration |

## Protocol

- Ask before installing a dependency or writing files ("May I write these?").
- Prefer removing an animation to tuning one that has no purpose.

## Next steps

- `/ui-polish` for the static finish of the same screen.
- `/accessibility` for focus management in modals and menus.
- `/performance` when animations compete with heavy rendering.
