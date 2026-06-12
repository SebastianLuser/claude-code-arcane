# 3. Server-Side Performance (HIGH)

## 3.1 Authenticate Server Actions Like API Routes — CRITICAL
Cada Server Action verifica auth/authz adentro, no solo confía en middleware.
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
Componer para que fetches independientes corran a la vez (cada uno en su `<Suspense>`).

## 3.8 Parallel Nested Data Fetching — CRITICAL
Encadenar fetches dependientes dentro de la promesa de cada item → un item lento no bloquea a los demás.

## 3.3 Avoid Shared Module State for Request Data — HIGH
Variables mutables a nivel módulo se comparten entre requests → data leaks. Mantener datos de request locales al árbol de render.

## 3.5 Hoist Static I/O to Module Level — HIGH
Lecturas estáticas (config, archivos) a nivel módulo, no en cada request.

## 3.6 Minimize Serialization at RSC Boundaries — HIGH
Pasar solo los campos que el cliente usa, no el objeto entero.

## 3.4 Cross-Request LRU Caching — HIGH
LRU cache para datos compartidos entre requests dentro de una ventana de tiempo.

## 3.9 Per-Request Deduplication with React.cache() — MEDIUM
```ts
export const getUser = cache(async (id) => db.user.find(id)); // dedup mismo arg en el request
```

## 3.10 Use after() for Non-Blocking Operations — MEDIUM
```ts
import { after } from 'next/server';
after(() => logAnalytics(event)); // corre tras enviar la respuesta
```

## 3.2 Avoid Duplicate Serialization in RSC Props — LOW
Transformar en el cliente cuando evita duplicar referencias serializadas.

_Ref: https://nextjs.org/docs/app/building-your-application/data-fetching · https://react.dev/reference/react/cache_
