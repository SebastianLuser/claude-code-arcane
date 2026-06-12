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

Reglas de performance y arquitectura para Next.js App Router (RSC, data fetching, caching). Ordenadas por impacto. Catálogo completo + ejemplos: skill `nextjs-best-practices`.

## CRITICAL — Eliminar waterfalls

- **Server Components por defecto.** `'use client'` solo cuando se necesita interactividad/estado/efectos/browser APIs. Empujar el boundary client lo más abajo posible en el árbol.
- **Fetch paralelo, no secuencial.** Operaciones independientes con `Promise.all()`. Nunca `await` en serie cuando no hay dependencia entre llamadas.
- **Iniciar promesas temprano, await tarde.** En route handlers y RSC, disparar el fetch independiente al inicio y await recién donde se usa el dato.
- **Composición para fetch paralelo.** Reestructurar componentes para que fetches independientes corran simultáneamente; fetches dependientes se anidan dentro de la promesa de cada item, no en serie global.
- **Suspense boundaries estratégicos.** Envolver subárboles con `<Suspense>` para mostrar shell rápido mientras streamea el contenido.

## CRITICAL — Bundle size

- **No barrel imports.** Importar directo del archivo fuente (`lodash/debounce`, no `lodash`); los barrels (`index.ts` que re-exportan todo) arrastran miles de módulos sin usar.
- **`next/dynamic` para componentes pesados** no necesarios en el render inicial (charts, editores, modales).
- **Diferir libs third-party no críticas** (analytics, logging, error tracking) a post-hydration; no bloquear el bundle inicial.
- **Paths estáticamente analizables.** Imports con paths literales/mapas explícitos, no construidos dinámicamente.

## HIGH — Server

- **Autenticar cada Server Action como un API route.** Verificar auth/authz dentro de la action, no confiar solo en middleware.
- **No module-level mutable state para datos de request.** Mantener datos de request locales al árbol de render; las variables a nivel módulo se comparten entre requests → data leaks.
- **Minimizar serialización en boundaries RSC→Client.** Pasar solo los campos que el cliente realmente usa, no el objeto entero.
- **`React.cache()` para dedupe por request**; LRU cache para datos compartidos entre requests dentro de una ventana de tiempo.
- **`after()` para trabajo no bloqueante** (logging, analytics, cleanup) que corre después de enviar la respuesta.
- **Hoist I/O estático a nivel módulo** para evitar lecturas redundantes en cada request.

## HIGH — Rendering & data

- **`generateMetadata` para todo el SEO** (title, description, OG, canonical). Nunca tags manuales en el body.
- **`next/image` siempre** — width/height explícitos, `priority` para LCP, formatos modernos.
- **Caching explícito.** Conocer y declarar `fetch` cache (`force-cache` / `no-store` / `revalidate`), `revalidatePath`/`revalidateTag` para invalidación.
- **`content-visibility: auto`** para listas largas off-screen.
- **Resource hints** (`preload`, `preconnect`) para recursos críticos.

## Anti-Patterns

- `'use client'` en la raíz del árbol (mata todo el beneficio de RSC)
- `useEffect` + `fetch` en el cliente para datos que podían venir del server
- Fetches en cascada (cada componente espera al padre sin necesidad)
- `export *` barrel files en libs internas
- Pasar objetos de DB crudos como props a Client Components
- Hardcodear `revalidate`/cache sin entender la estrategia
- Secrets o lógica sensible en código que cruza a `'use client'`

---

_Derivado de [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (react-best-practices, MIT). Condensado al formato Arcane._
