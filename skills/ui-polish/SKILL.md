---
name: ui-polish
description: "The finish pass that makes a web interface feel built, not generated: a design direction backed by real content, every state designed (loading, empty, error, long content), and details like concentric radii, optical alignment, text wrapping, shadows, hit areas and focus. Polish or review a screen."
category: "frontend"
argument-hint: "[polish <screen> | review]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# UI Polish

The difference between "it works" and "it feels right" is a list of small decisions. This pass makes them on purpose. It complements the Visual Quality section of the `frontend-code` rule; it does not replace the design system.

## Phase 1: Scope

| Mode | Does |
|---|---|
| `polish <screen>` | Applies the passes below to one screen or component |
| `review` | Checks a screen against them and gives a verdict |

Read the design tokens (Tailwind config, CSS variables, theme file) and the components the screen uses first. Fix tokens and shared components, not one-off overrides on a page.

## Phase 2: Direction and real content

- **One direction per product**, written in two or three lines (for example "calm, dense, for daily use by teachers") and visible in type, spacing and color choices. Defaults of a component kit with no decisions on top read as a template.
- **Design with real content:** real names, long titles, real numbers, the language the users speak (Spanish text runs longer than English). Lorem ipsum hides every wrapping and overflow problem.
- **One primary action per screen**, with clear hierarchy below it.

## Phase 3: Every state

For each data-driven area, design and build:

| State | Must show |
|---|---|
| **Loading** | A skeleton matching the final layout, after a short delay; no layout shift when data arrives |
| **Empty** | What this area is for and the action that fills it, not just "No data" |
| **Error** | What failed in plain words, what the user can do, a retry |
| **Partial / long** | Long names truncated with the full value available (title, tooltip), many items paginated or virtualized |
| **Permission** | What the user cannot do and why, instead of a broken or hidden control |

## Phase 4: Details

| Detail | Rule |
|---|---|
| **Concentric radius** | Nested rounded surfaces: outer radius = inner radius + padding |
| **Optical alignment** | Icons, play triangles and arrows often need a small offset to look centered; fix the SVG first |
| **Shadows and borders** | Borders for separation and focus; soft, layered, low-opacity shadows for elevation; both readable in light and dark |
| **Text wrapping** | `text-wrap: balance` on headings and short titles, `text-wrap: pretty` on short body text; `font-variant-numeric: tabular-nums` on prices, counters, timers and table columns |
| **Images** | Fixed aspect ratio, `object-fit`, a subtle inset outline so edges do not melt into the background |
| **Hit areas** | At least 24×24 px (44×44 on touch targets), extended with padding or a pseudo-element when the icon is smaller |
| **Focus** | A visible, designed focus ring on every interactive element (`:focus-visible`), never removed without a replacement |
| **Transitions** | Only on the properties that change (never `transition: all`), short, and respecting reduced motion (`/web-animation`) |
| **Dark mode** | Designed, not inverted: elevation by lighter surfaces, less saturated colors, images and shadows checked |

## Phase 5: Rendered check

Polish is judged on the screen, not in the code. Take Playwright screenshots at 320, 768, 1024 and 1440 px in each theme (the check in `frontend-code`), with real data and in each state from Phase 3, and look at them before calling it done.

## Phase 6: Verdict (review mode)

| Verdict | When |
|---|---|
| **PASS** | Direction visible, all states built, details applied, screenshots checked |
| **CONCERNS** | Missing empty or error states, inconsistent radii or spacing, `transition: all`, small hit areas |
| **FAIL** | No visible focus, layout breaks with real content or at 320 px, errors shown as raw messages or not at all |

## Protocol

- Change shared tokens and components before page-level overrides; ask before changing tokens other screens use.
- Ask "May I write these?" before editing files.

## Next steps

- `/web-animation` for motion on the same screen.
- `/accessibility` for a full accessibility audit.
- `/click-path-audit` to check that every control does what its label says.
