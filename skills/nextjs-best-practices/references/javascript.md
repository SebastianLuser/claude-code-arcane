# 7. JavaScript Performance (LOW-MEDIUM)

Micro-optimizations. Apply only on hot paths confirmed by profiling — not preventively.

## 7.8 Early Length Check for Array Comparisons — MEDIUM-HIGH
Compare `length` before expensive operations (sort/deep-compare).

## 7.1 Avoid Layout Thrashing — MEDIUM
Batch style writes, then read layout once → avoids forced synchronous reflows.

## 7.4 Cache Repeated Function Calls — MEDIUM
`Map` to memoize results of repeated calls with the same inputs.

## 7.7 Defer Non-Critical Work with requestIdleCallback — MEDIUM
Analytics, logging, prefetch during browser idle periods.

## 7.2 Build Index Maps for Repeated Lookups — LOW-MEDIUM
`Map` for O(1) instead of multiple `.find()` calls.

## 7.3 Cache Property Access in Loops — LOW-MEDIUM
Cache `obj.prop` before the loop.

## 7.5 Cache Storage API Calls — LOW-MEDIUM
Cache `localStorage`/`sessionStorage` reads in memory.

## 7.6 Combine Multiple Array Iterations — LOW-MEDIUM
Merge multiple `.filter()`/`.map()` calls into a single loop.

## 7.9 Early Return from Functions — LOW-MEDIUM
Return as soon as the result is determined.

## 7.10 Hoist RegExp Creation — LOW-MEDIUM
`RegExp` at module level, do not recreate it on every call/render.

## 7.11 Use flatMap to Map and Filter in One Pass — LOW-MEDIUM
`.flatMap(x => cond ? [f(x)] : [])` instead of `.map().filter(Boolean)`.

## 7.13 Use Set/Map for O(1) Lookups — LOW
`Set.has()` instead of repeated `.includes()`/`.indexOf()`.

## 7.12 Use Loop for Min/Max Instead of Sort — LOW
O(n) loop for min/max instead of an O(n log n) sort.

## 7.14 Use toSorted() Instead of sort() — LOW
`.toSorted()` for immutability (does not mutate the original).

_Ref: https://developer.mozilla.org/docs/Web/API/Window/requestIdleCallback_
