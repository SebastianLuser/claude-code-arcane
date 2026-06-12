# 1. Eliminating Waterfalls (CRITICAL)

El factor #1 de TTFB lento. Operaciones que esperan en serie cuando podrían correr en paralelo.

## 1.5 Promise.all() for Independent Operations — CRITICAL
```ts
// ✗ secuencial: 300ms + 300ms
const user = await getUser(id);
const posts = await getPosts(id);
// ✓ paralelo: 300ms
const [user, posts] = await Promise.all([getUser(id), getPosts(id)]);
```

## 1.4 Prevent Waterfall Chains in API Routes — CRITICAL
Iniciar operaciones independientes inmediatamente, await recién al usarlas.
```ts
const userP = getUser(id);          // arranca ya
const settingsP = getSettings(id);  // arranca ya
return { user: await userP, settings: await settingsP };
```

## 1.3 Dependency-Based Parallelization — CRITICAL
Cuando hay dependencias parciales, arrancar cada tarea en el momento más temprano posible (libs como `better-all` lo automatizan). No serializar todo por una sola dependencia.

## 1.7/3.7 Parallel Data Fetching with Component Composition — CRITICAL
Reestructurar componentes para que fetches independientes corran simultáneamente en vez de anidados.

## 1.6 Strategic Suspense Boundaries — HIGH
```tsx
<Suspense fallback={<Skeleton/>}>
  <SlowData />   {/* streamea; el shell se muestra ya */}
</Suspense>
```

## 1.1 Check Cheap Conditions Before Async Flags — HIGH
Evaluar guards síncronos antes de operaciones async para saltar trabajo en cold paths.

## 1.2 Defer Await Until Needed — HIGH
Mover el `await` a la rama donde realmente se usa, no bloquear ramas que no lo necesitan.

_Ref: https://react.dev/reference/react/Suspense_
