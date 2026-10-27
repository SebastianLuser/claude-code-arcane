# 4. Client-Side Data Fetching (MEDIUM-HIGH)

## 4.3 Use SWR for Automatic Deduplication — MEDIUM-HIGH
Request dedup, caching and revalidation across component instances.
```ts
const { data } = useSWR(`/api/user/${id}`, fetcher); // same key = 1 request
```

## 4.2 Use Passive Event Listeners for Scrolling — MEDIUM
```ts
el.addEventListener('touchstart', handler, { passive: true }); // immediate scroll
```

## 4.4 Version and Minimize localStorage Data — MEDIUM
Version prefix on the keys (`app:v2:prefs`) and store only the needed fields → avoids conflicts and reduces size.

## 4.1 Deduplicate Global Event Listeners — LOW
Share global listeners across instances with a `Map` + `useSWRSubscription()` instead of one per component.

_Ref: https://swr.vercel.app_
