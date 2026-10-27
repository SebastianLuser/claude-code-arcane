# 3. Server-Side Performance (HIGH)

## 3.1 Authenticate Server Actions Like API Routes — CRITICAL
Every Server Action checks auth/authz inside, it does not just trust middleware.
```ts
'use server';
export async function deletePost(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  if (!canDelete(session.user, id)) throw new Error('Forbidden');
  // ...
}
```

## 3.7 Parallel Data Fetching with Component Composition — CRITICAL
Compose so independent fetches run at the same time (each in its own `<Suspense>`).

## 3.8 Parallel Nested Data Fetching — CRITICAL
Chain dependent fetches inside each item's promise → one slow item does not block the others.

## 3.3 Avoid Shared Module State for Request Data — HIGH
Mutable module-level variables are shared across requests → data leaks. Keep request data local to the render tree.

## 3.5 Hoist Static I/O to Module Level — HIGH
Static reads (config, files) at module level, not on every request.

## 3.6 Minimize Serialization at RSC Boundaries — HIGH
Pass only the fields the client uses, not the whole object.

## 3.4 Cross-Request LRU Caching — HIGH
LRU cache for data shared across requests within a time window.

## 3.9 Per-Request Deduplication with React.cache() — MEDIUM
```ts
export const getUser = cache(async (id) => db.user.find(id)); // dedups the same arg within the request
```

## 3.10 Use after() for Non-Blocking Operations — MEDIUM
```ts
import { after } from 'next/server';
after(() => logAnalytics(event)); // runs after the response is sent
```

## 3.2 Avoid Duplicate Serialization in RSC Props — LOW
Transform on the client when it avoids duplicating serialized references.

_Ref: https://nextjs.org/docs/app/building-your-application/data-fetching · https://react.dev/reference/react/cache_
