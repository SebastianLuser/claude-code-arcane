---
name: nextjs-best-practices
description: "React + Next.js performance: 64 rules in 8 categories (waterfalls, bundle, server, client fetching, re-render, rendering, JS, advanced) prioritized by impact, from Vercel Engineering. Use when writing/optimizing React or Next.js."
category: "frontend"
argument-hint: "[waterfalls|bundle|server|rerender|rendering|js|all]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# nextjs-best-practices — Performance prioritized by impact

64 performance optimization rules for React and Next.js, from Vercel Engineering, organized into 8 categories prioritized from **CRITICAL** to **LOW**. Per-category detail in `references/`.

## MANDATORY WORKFLOW

**Metrics-driven diagnosis, do not apply the 64 rules blindly** (this is the `vercel-optimize` approach: measure first, optimize only what the metrics point to).

### Step 0: Measure / locate

1. **Are there metrics?** Lighthouse, Web Vitals (LCP/INP/CLS), bundle analyzer, Vercel traces.
2. **What is the dominant symptom?** High TTFB → waterfalls/server. Large bundle / TBT → bundle size. Interaction jank → re-render. Layout shift → rendering.
3. Identify the concrete routes/components the metrics point to. Optimize **those**, not everything.

### Step 1: Prioritize by impact

| Priority | Category | Impact | Reference |
|-----------|-----------|---------|-----------|
| 1 | Eliminating Waterfalls | CRITICAL | `references/waterfalls.md` |
| 2 | Bundle Size Optimization | CRITICAL | `references/bundle-size.md` |
| 3 | Server-Side Performance | HIGH | `references/server.md` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `references/client-fetching.md` |
| 5 | Re-render Optimization | MEDIUM | `references/rerender.md` |
| 6 | Rendering Performance | MEDIUM | `references/rendering.md` |
| 7 | JavaScript Performance | LOW-MEDIUM | `references/javascript.md` |
| 8 | Advanced Patterns | LOW | `references/advanced.md` |

### Step 2: Apply + measure again

Apply the rule, re-measure. If the metric did not improve, revert and move up a category — do not pile up micro-optimizations without measurable impact.

### Step 3: Closing checklist

- [ ] Independent fetches in parallel (`Promise.all`), not in a cascade
- [ ] Server Components by default; `'use client'` pushed down the tree
- [ ] No barrel imports on the critical path; heavy components with `next/dynamic`
- [ ] Server Actions authenticated individually
- [ ] No components defined inside components
- [ ] `next/image` + `generateMetadata` + resource hints where appropriate
- [ ] Re-measure Web Vitals after the changes

If the whole checklist passes → optimization **COMPLETE**. Before writing significant changes, confirm the approach with the user (Question → Decision → Approval).

## Symptom → category table

| Bad metric | Category |
|--------------|-----------|
| TTFB / server response time | Waterfalls, Server |
| First Load JS / high TBT | Bundle Size |
| INP / interaction jank | Re-render, JS |
| LCP | Rendering, Bundle, Server |
| CLS / hydration flicker | Rendering |

---

_Adapted from [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (react-best-practices, MIT, © Vercel). 64 rules prioritized by impact, reorganized into Arcane's skill+references format._
