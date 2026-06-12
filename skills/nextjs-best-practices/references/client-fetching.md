# 4. Client-Side Data Fetching (MEDIUM-HIGH)

## 4.3 Use SWR for Automatic Deduplication — MEDIUM-HIGH
Dedup de requests, caching y revalidación entre instancias de componente.
```ts
const { data } = useSWR(`/api/user/${id}`, fetcher); // mismo key = 1 request
```

## 4.2 Use Passive Event Listeners for Scrolling — MEDIUM
```ts
el.addEventListener('touchstart', handler, { passive: true }); // scroll inmediato
```

## 4.4 Version and Minimize localStorage Data — MEDIUM
Prefijo de versión en las keys (`app:v2:prefs`) y guardar solo campos necesarios → evita conflictos y reduce tamaño.

## 4.1 Deduplicate Global Event Listeners — LOW
Compartir listeners globales entre instancias con un `Map` + `useSWRSubscription()` en vez de uno por componente.

_Ref: https://swr.vercel.app_
