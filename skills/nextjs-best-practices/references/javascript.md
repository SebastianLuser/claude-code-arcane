# 7. JavaScript Performance (LOW-MEDIUM)

Micro-optimizaciones. Aplicar solo en hot paths comprobados por profiling — no preventivamente.

## 7.8 Early Length Check for Array Comparisons — MEDIUM-HIGH
Comparar `length` antes de operaciones caras (sort/deep-compare).

## 7.1 Avoid Layout Thrashing — MEDIUM
Agrupar escrituras de estilo, luego leer layout una vez → evita reflows síncronos forzados.

## 7.4 Cache Repeated Function Calls — MEDIUM
`Map` para memoizar resultados de llamadas repetidas con mismos inputs.

## 7.7 Defer Non-Critical Work with requestIdleCallback — MEDIUM
Analytics, logging, prefetch en periodos idle del browser.

## 7.2 Build Index Maps for Repeated Lookups — LOW-MEDIUM
`Map` para O(1) en vez de múltiples `.find()`.

## 7.3 Cache Property Access in Loops — LOW-MEDIUM
Cachear `obj.prop` antes del loop.

## 7.5 Cache Storage API Calls — LOW-MEDIUM
Cachear lecturas de `localStorage`/`sessionStorage` en memoria.

## 7.6 Combine Multiple Array Iterations — LOW-MEDIUM
Fusionar `.filter()`/`.map()` múltiples en un solo loop.

## 7.9 Early Return from Functions — LOW-MEDIUM
Retornar apenas el resultado está determinado.

## 7.10 Hoist RegExp Creation — LOW-MEDIUM
`RegExp` a nivel módulo, no recrear en cada llamada/render.

## 7.11 Use flatMap to Map and Filter in One Pass — LOW-MEDIUM
`.flatMap(x => cond ? [f(x)] : [])` en vez de `.map().filter(Boolean)`.

## 7.13 Use Set/Map for O(1) Lookups — LOW
`Set.has()` en vez de `.includes()`/`.indexOf()` repetidos.

## 7.12 Use Loop for Min/Max Instead of Sort — LOW
Loop O(n) para min/max en vez de sort O(n log n).

## 7.14 Use toSorted() Instead of sort() — LOW
`.toSorted()` para inmutabilidad (no muta el original).

_Ref: https://developer.mozilla.org/docs/Web/API/Window/requestIdleCallback_
