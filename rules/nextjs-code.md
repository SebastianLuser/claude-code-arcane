---
paths:
  - "app/**"
  - "src/app/**"
  - "pages/**"
  - "src/pages/**"
  - "**/*.tsx"
  - "**/route.ts"
  - "next.config.*"
---

# Next.js Code Rules

Performance and architecture rules for the Next.js App Router (RSC, data fetching, caching). Ordered by impact. Full catalog + examples: the `nextjs-best-practices` skill.

## CRITICAL — Eliminate waterfalls

- **Server Components by default.** `'use client'` only when you need interactivity/state/effects/browser APIs. Push the client boundary as far down the tree as possible.
- **Parallel fetch, not sequential.** Independent operations with `Promise.all()`. Never `await` serially when there is no dependency between calls.
- **Start promises early, await late.** In route handlers and RSC, fire the independent fetch at the start and await it only where the data is used.
- **Composition for parallel fetch.** Restructure components so independent fetches run at the same time; dependent fetches nest inside each item's promise, not in a global series.
- **Strategic Suspense boundaries.** Wrap subtrees in `<Suspense>` to show a fast shell while the content streams.

## CRITICAL — Bundle size

- **No barrel imports.** Import straight from the source file (`lodash/debounce`, not `lodash`); barrels (`index.ts` files that re-export everything) drag in thousands of unused modules.
- **`next/dynamic` for heavy components** not needed in the initial render (charts, editors, modals).
- **Defer non-critical third-party libs** (analytics, logging, error tracking) until after hydration; do not block the initial bundle.
- **Statically analyzable paths.** Imports with literal paths/explicit maps, not built dynamically.

## HIGH — Server

- **Authenticate every Server Action like an API route.** Check auth/authz inside the action, do not rely on middleware alone.
- **No module-level mutable state for request data.** Keep request data local to the render tree; module-level variables are shared between requests → data leaks.
- **Minimize serialization at RSC→Client boundaries.** Pass only the fields the client actually uses, not the whole object.
- **`React.cache()` for per-request dedupe**; an LRU cache for data shared between requests within a time window.
- **`after()` for non-blocking work** (logging, analytics, cleanup) that runs after the response is sent.
- **Hoist static I/O to module level** to avoid redundant reads on every request.

## HIGH — Rendering & data

- **`generateMetadata` for all SEO** (title, description, OG, canonical). Never manual tags in the body.
- **Always `next/image`** — explicit width/height, `priority` for LCP, modern formats.
- **Explicit caching.** Know and declare the `fetch` cache (`force-cache` / `no-store` / `revalidate`), `revalidatePath`/`revalidateTag` for invalidation.
- **`content-visibility: auto`** for long off-screen lists.
- **Resource hints** (`preload`, `preconnect`) for critical resources.

## Anti-Patterns

- `'use client'` at the root of the tree (kills all the benefit of RSC)
- `useEffect` + `fetch` on the client for data that could have come from the server
- Cascading fetches (each component needlessly waits for its parent)
- `export *` barrel files in internal libs
- Passing raw DB objects as props to Client Components
- Hardcoding `revalidate`/cache without understanding the strategy
- Secrets or sensitive logic in code that crosses into `'use client'`

---

_Derived from [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (react-best-practices, MIT). Condensed into the Arcane format._
