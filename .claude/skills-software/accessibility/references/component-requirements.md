# Component Accessibility Requirements

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
