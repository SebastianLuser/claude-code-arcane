---
name: perf-profile
description: "Performance profiling workflow: identify bottlenecks, measure against budgets, prioritize optimizations."
argument-hint: "[system-name or 'full']"
user-invocable: true
agent: performance-analyst
allowed-tools: Read, Glob, Grep, Bash
---

## Scope

System name argument → profile that system. `full` → all systems.

## Performance Budgets

Load from design docs or CLAUDE.md. Typical targets:

| Metric | Mobile (RN) | Web | Notes |
|--------|-------------|-----|-------|
| JS thread | <16.67ms/frame | — | 60fps budget |
| TTI | <3s | <2s | Time to interactive |
| Memory | <200MB | — | Per-app on device |
| Bundle size | <10MB OTA | <200KB initial | Compressed |
| Core Web Vitals | — | LCP<2.5s, FID<100ms, CLS<0.1 | Web only |

## Tool Selection

| Scenario | Tool | When to use |
|----------|------|-------------|
| React re-renders | React DevTools Profiler | Unnecessary renders, slow components |
| JS thread bottlenecks | Flipper / Hermes profiler | Frame drops, slow interactions |
| Native iOS perf | Xcode Instruments | Memory leaks, CPU spikes, energy |
| Native Android perf | Android Studio Profiler | Memory, CPU, network on-device |
| Web performance | Lighthouse + Chrome DevTools | CWV, bundle analysis, network |
| Bundle bloat | `npx expo-doctor`, source-map-explorer | Large dependencies, tree-shaking |

## What to Profile

**CPU:** nested loops over large collections, string ops in hot paths, per-frame allocations, expensive bridge calls
**Memory:** data structure growth, leaked refs, image/asset footprint, caches without eviction
**Rendering:** overlapping views (overdraw), non-virtualized lists, animations not on UI thread, unoptimized images
**I/O:** sync storage on main thread, network waterfalls, large payload serialization

## Common Bottlenecks — Decision Table

| Symptom | Likely cause | Fix approach |
|---------|-------------|--------------|
| Choppy scrolling | Non-virtualized list or heavy row render | FlatList/FlashList + memo rows |
| Slow navigation | Heavy screen mount + data fetch | Prefetch + lazy load |
| Memory climbs over time | Listener/subscription leaks | Cleanup in useEffect returns |
| Large bundle | Unused deps or unshaken imports | Bundle analysis + code splitting |
| Slow startup | Too much sync init work | Defer non-critical init, lazy imports |
| Bridge spam | Frequent native↔JS calls | Batch operations, use JSI where possible |

## Report Sections

1. **Budget vs Actual** — table with OK / WARNING / OVER status
2. **Hotspots** — location, issue, estimated impact, fix effort (S/M/L)
3. **Recommendations** — priority-ordered with expected gain and risk
4. **Quick Wins** — fixable in <1 hour
5. **Needs Runtime Profiling** — static analysis cannot confirm

For M/L effort hotspots, ask user: **Implement now** | **Reduce scope** (`/scope-check`) | **Defer** | **Escalate** (`/architecture-decision`)

## Anti-Patterns

- Optimizing without measuring — gut feelings are unreliable
- Profiling in dev mode — always use production/release builds
- Ignoring memory leaks — they compound and cause OOM crashes
- Recommendations without estimated impact — "make it faster" is not actionable
- Profiling only on simulator — always validate on real target hardware
- Premature optimization — profile first, optimize the proven bottleneck
