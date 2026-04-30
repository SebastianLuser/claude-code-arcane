# Anti-Patterns — Accessibility

- `outline: none` without focus replacement
- Placeholder as label; icon buttons without accessible name
- Modal without focus trap; `<div onClick>` instead of `<button>`
- `tabindex > 0`; ARIA contradicting semantics
- Color-only indicators; touch targets < 24px
- Toast vanishing before SR reads it; animations ignoring `prefers-reduced-motion`
- Validated only with axe — missing real AT testing
