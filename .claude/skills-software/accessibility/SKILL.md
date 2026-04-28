---
name: accessibility
description: "Web/mobile accessibility decision guide: WCAG 2.2 AA, ARIA, keyboard nav, focus management, contrast, testing. Use for: a11y, accessibility, wcag, aria, screen reader, keyboard, contrast."
argument-hint: "[audit|fix] [path]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
metadata:
  category: quality
  sources:
    - WCAG 2.1 AA (W3C Web Content Accessibility Guidelines)
    - ARIA Authoring Practices Guide (w3.org/WAI/ARIA/apg)
    - WebAIM (webaim.org)
    - Deque axe-core documentation
---
# accessibility — Decision Guide

Target: **WCAG 2.2 AA**. Stack: React + Vite + shadcn/ui (web), React Native (mobile).

## WCAG 2.2 AA — Essential Criteria

| ID | Criterion | Common Failure |
|---|---|---|
| 1.1.1 | Alt text on informative images | `<img>` without alt |
| 1.3.1 | Semantic structure | `<div onClick>` instead of `<button>` |
| 1.4.3 | Contrast 4.5:1 text / 3:1 large | Light gray on white |
| 1.4.10 | Reflow at 320px, no horizontal scroll | Fixed-width layout |
| 1.4.11 | Contrast 3:1 on UI components/icons | Pale border on inputs |
| 2.1.1 | Full keyboard accessibility | Dropdown only on hover |
| 2.4.3 | Logical focus order | Tab order jumps randomly |
| 2.4.7 | Visible focus indicator | `outline: none` with no replacement |
| 2.4.11 | Focus not obscured by sticky elements | Navbar covers focused button |
| 2.5.8 | Touch target min 24x24 (AA), ideal 44x44 | 16px icon buttons on mobile |
| 3.3.1 | Errors identifiable | Generic "error" with no specifics |
| 3.3.2 | Labels on form inputs | Input without label |
| 4.1.2 | Correct roles/states | Toggle without `aria-pressed` |

## Component Accessibility Requirements

| Component | Required ARIA / Behavior |
|---|---|
| Button | Native `<button>`, Enter + Space activation |
| Link | Native `<a href>`, Enter activation |
| Modal | `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap, Escape, focus restore |
| Tabs | `role="tablist/tab/tabpanel"`, Arrow keys, roving tabindex |
| Combobox | `role="combobox"`, `aria-expanded`, `aria-activedescendant`, Arrow + Escape |
| Menu | `role="menu/menuitem"`, Arrow nav, Escape, focus restore |
| Live content | `aria-live="polite"` (notifications) or `role="alert"` (errors) |
| Form input | Associated `<label>`, `aria-invalid`, `aria-describedby` for errors |
| Icon button | Visually-hidden text or `aria-label` |

Use **shadcn/ui** (Radix-based) for complex widgets — never hand-roll combobox, datepicker, or tree.

## Color & Contrast

- Normal text (<18pt): **4.5:1**. Large text (>=18pt / >=14pt bold): **3:1**. UI components: **3:1**
- Never convey info by color alone — pair with icon, text, or pattern
- Design contrast for light and dark themes independently

## Focus Management

| Scenario | Action |
|---|---|
| Modal opens | Trap focus, move to first focusable or heading |
| Modal closes | Restore focus to trigger element |
| Route change | Move focus to main heading or skip link |
| Dynamic content | `aria-live` region, do not steal focus |
| Inline error | `role="alert"` + `aria-describedby` |

Never use `tabindex > 0`. Never `outline: none` without `:focus-visible` replacement. Add skip link. Respect `prefers-reduced-motion`.

## Forms Checklist

- [ ] Every input has `<label>` (not placeholder as label)
- [ ] `autoComplete` with correct tokens; `inputmode` for mobile keyboards
- [ ] Errors: `role="alert"` + linked via `aria-describedby`
- [ ] Required: visual (*) AND `required` attribute
- [ ] Specific messages ("Invalid email" not "Error 400")

## Testing

| Method | When |
|---|---|
| axe-core (jest-axe) | Every PR — CI gate |
| Lighthouse a11y (>=95) | CI on main |
| Keyboard walkthrough | Every UI PR (manual) |
| Screen reader (NVDA/VoiceOver) | New flows, once per release |
| Zoom 200% + monochrome | Every UI PR / design review |

## Anti-Patterns

- `outline: none` without focus replacement
- Placeholder as label; icon buttons without accessible name
- Modal without focus trap; `<div onClick>` instead of `<button>`
- `tabindex > 0`; ARIA contradicting semantics
- Color-only indicators; touch targets < 24px
- Toast vanishing before SR reads it; animations ignoring `prefers-reduced-motion`
- Validated only with axe — missing real AT testing
