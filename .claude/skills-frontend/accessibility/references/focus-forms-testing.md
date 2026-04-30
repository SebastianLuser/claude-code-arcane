# Focus, Forms & Testing — Accessibility

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
