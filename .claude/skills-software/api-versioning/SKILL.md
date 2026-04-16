---
name: api-versioning
description: Estrategias de versionado de APIs (REST/GraphQL) para backends Educabot. Define cuándo crear v2, cómo deprecar v1, breaking vs non-breaking changes, deprecation headers, ventanas de soporte y patrones por stack (Go/Gin, NestJS, Fastify, GraphQL). Usar cuando se mencione: versionar API, v2, breaking change, deprecar endpoint, sunset, backwards compatibility, API version, mobile force update.
---

# API Versioning

Guía para versionar APIs en backends Educabot (Go + TypeScript) consumidas por web (React+Vite+TS) y mobile (React Native).

## Cuándo usar

- Vas a introducir un breaking change en un endpoint existente.
- Necesitás soportar clientes viejos (mobile sin actualizar) en paralelo a clientes nuevos.
- Estás diseñando una API pública o consumida por terceros.
- Tenés que deprecar endpoints o campos.
- Querés definir política de soporte (cuánto tiempo mantenemos v1 viva).

## Cuándo NO usar

- Cambios non-breaking (agregar campo opcional, nuevo endpoint) — no requieren bump de versión.
- APIs internas single-consumer donde podés deployar back+front juntos atómicamente.
- Webhooks salientes y endpoints de auth — generalmente no se versionan (manejar con feature flags).
- GraphQL — no usa versionado clásico, ver sección 9.

---

## 1. Estrategias de versionado (comparativa)

| Estrategia | Ejemplo | Pros | Contras | Veredicto |
|---|---|---|---|---|
| **URL path** | `GET /v1/users` | Visible, cacheable, fácil de rutear, fácil de probar en browser | "No RESTful puro" (a quién le importa) | ✅ **Default Educabot** |
| **Header** | `API-Version: 2026-01-15` | URLs limpias, permite date-based pinning fino | Invisible, difícil de cachear, fricción para devs | Usar como complemento opcional |
| **Query param** | `/users?version=2` | Simple | Ensucia URLs, problemas de caché, fácil de olvidar | ❌ Evitar |
| **Content negotiation** | `Accept: application/vnd.educabot.v2+json` | "Correcto" según HTTP spec | Verboso, frágil, mala DX | ❌ Evitar (over-engineering) |

### Default Educabot

- **Major version en URL path**: `/v1/`, `/v2/`.
- **Date-based pinning opcional via header**: `API-Version: 2026-01-15` para clientes que quieran congelar comportamiento dentro de una major.
- Lo mejor de ambos mundos: simpleza por defecto, precisión cuando se necesita.

---

## 2. Semver aplicado a APIs

```
MAJOR.MINOR.PATCH
  │     │     └─ Bug fix sin cambio de contrato (no afecta clientes).
  │     └─────── Cambios additivos: nuevo endpoint, campo opcional nuevo, nuevo enum value.
  └───────────── Breaking change: requiere migración del cliente.
```

**Solo MAJOR cambia la versión visible en la URL** (`/v1` → `/v2`). MINOR y PATCH son transparentes.

---

## 3. Breaking vs Non-breaking changes

### Non-breaking ✅ (no requiere v2)

- Agregar un campo **opcional** en request body.
- Agregar un campo nuevo en response.
- Agregar un nuevo endpoint.
- Agregar un nuevo enum value (**solo si** documentaste que clientes deben tolerar valores desconocidos).
- Relajar validaciones (aceptar más cosas).
- Hacer un campo required → opcional.

### Breaking ❌ (requiere v2 o feature flag)

- Remover un campo de response.
- Cambiar tipo de un campo (`string` → `number`).
- Renombrar un campo o endpoint.
- Cambiar status codes (`200` → `201`).
- Volver un campo opcional → required.
- Cambiar formato de fechas, IDs, paginación.
- Cambiar significado/semántica de un campo aunque el tipo sea igual.
- Endurecer validaciones (rechazar cosas que antes pasaban).

---

## 4. Deprecation flow

Pasos cuando vas a sunsettear un endpoint o versión:

1. **Anunciar** — changelog, email a consumidores, ticket de migración.
2. **Marcar en runtime** con headers en cada response del endpoint deprecado:
   ```http
   Deprecation: true
   Sunset: Sat, 31 Dec 2026 23:59:59 GMT
   Link: <https://docs.educabot.com/api/migration-v2>; rel="deprecation"
   Warning: 299 - "Endpoint deprecated, migrate to /v2/users by 2026-12-31"
   ```
3. **Monitorear uso** — log de cada hit a endpoints deprecados con `user-agent` + `client_id`. Dashboard de quién todavía usa v1.
4. **Recordatorios** a consumidores que aún la usan (1 mes y 1 semana antes del sunset).
5. **Apagar** — devolver `410 Gone` con body explicativo apuntando a docs de migración.

---

## 5. Ventanas de soporte

- **Mínimo**: 6 meses entre anuncio de deprecation y sunset.
- **Ideal**: 12 meses para APIs consumidas externamente.
- **Mobile (React Native)**: 18+ meses. Los usuarios no actualizan apps, no podés forzarlos sin un mecanismo de minimum-version (ver sección 10).
- **Solo backend interno**: podés ser más agresivo (semanas) si coordinás deploys.

Política Educabot recomendada:
- 2 majors vivas en paralelo, máximo. Nunca 3+ (backport hell).
- Web (React): 6 meses.
- Mobile (RN): 12 meses + minimum-version forcing.

---

## 6. Implementación Go (Gin via team-ai-toolkit)

```go
// router.go
func SetupRouter(r *gin.Engine, h *handlers.Handlers) {
    api := r.Group("/api")

    v1 := api.Group("/v1")
    {
        v1.GET("/users/:id", h.V1.GetUser)
        v1.POST("/users", h.V1.CreateUser)
    }

    v2 := api.Group("/v2")
    v2.Use(middleware.DeprecationHeaders()) // si v2 también está siendo deprecada
    {
        v2.GET("/users/:id", h.V2.GetUser)
        v2.POST("/users", h.V2.CreateUser)
    }
}

// middleware/deprecation.go
func DeprecationHeaders() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("Deprecation", "true")
        c.Header("Sunset", "Sat, 31 Dec 2026 23:59:59 GMT")
        c.Header("Link", `<https://docs.educabot.com/api/migration-v3>; rel="deprecation"`)
        c.Next()
    }
}
```

**Estructura de carpetas**:
```
internal/
  handlers/
    v1/users.go
    v2/users.go
  domain/          # ← shared, sin versión
  service/         # ← shared, sin versión
  dto/
    v1/user_dto.go
    v2/user_dto.go
```

---

## 7. Implementación TypeScript

### NestJS

```ts
// main.ts
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});

// users.controller.ts
@Controller({ path: 'users', version: '1' })
export class UsersV1Controller {
  @Get(':id')
  findOne(@Param('id') id: string) { /* ... */ }
}

@Controller({ path: 'users', version: '2' })
export class UsersV2Controller {
  @Get(':id')
  findOne(@Param('id') id: string) { /* ... */ }
}
```

### Fastify (plugin por versión)

```ts
// v1/index.ts
export default async function v1Routes(fastify: FastifyInstance) {
  fastify.get('/users/:id', getUserV1);
  fastify.post('/users', createUserV1);
}

// server.ts
await app.register(v1Routes, { prefix: '/v1' });
await app.register(v2Routes, { prefix: '/v2' });
```

---

## 8. Código compartido (anti-corruption layer)

Patrón clave: **dominio sin versión, controllers/DTOs por versión**.

```
┌─────────────┐    ┌─────────────┐
│  v1 Handler │    │  v2 Handler │   ← versionados
└──────┬──────┘    └──────┬──────┘
       │ DTOv1            │ DTOv2
       ▼                  ▼
   ┌────────────────────────────┐
   │   Service (sin versión)    │   ← lógica de negocio shared
   └────────────┬───────────────┘
                ▼
   ┌────────────────────────────┐
   │   Domain entities          │   ← modelo canónico
   └────────────────────────────┘
```

Cada handler convierte DTO ↔ entidad de dominio. La versión nunca filtra al dominio. Si v2 necesita un campo nuevo que el dominio no tiene, agregalo al dominio (es additivo).

---

## 9. OpenAPI / Swagger

- Un spec por major version: `openapi-v1.yaml`, `openapi-v2.yaml`.
- Schemas versionados: `UserV1`, `UserV2` (no compartir si difieren).
- Servir docs en `/docs/v1` y `/docs/v2`.
- En cada endpoint deprecado, marcar `deprecated: true` en el spec.

---

## 10. GraphQL: NO se versiona

GraphQL evoluciona aditivamente, no por versiones:

```graphql
type User {
  id: ID!
  name: String!
  email: String! @deprecated(reason: "Use contactEmail. Removed 2026-12-31.")
  contactEmail: String!
}
```

- **Nuevos campos**: agregar libremente, clientes viejos los ignoran.
- **Deprecación**: directiva `@deprecated` con `reason` que incluya fecha de sunset.
- **Breaking change real**: crear campo nuevo (`userV2`) o endpoint nuevo (`/graphql/v2`) como último recurso.
- Monitorear uso de campos deprecados con tracing (Apollo Studio, GraphQL Hive).

---

## 11. Mobile specific (React Native)

Las apps móviles no se actualizan automáticamente. Necesitás un canal para forzar updates.

### Endpoint de versión mínima

```http
GET /minimum-version
→ 200 OK
{
  "ios":     { "min": "2.3.0", "recommended": "2.5.0" },
  "android": { "min": "2.3.0", "recommended": "2.5.0" }
}
```

La app:
1. Llama a `/minimum-version` al iniciar.
2. Si su versión < `min` → pantalla de bloqueo "actualizá la app" con link a store.
3. Si su versión < `recommended` → banner soft "hay una nueva versión".

Esto te da escape hatch para apagar v1 con seguridad: forzás update antes del sunset.

---

## 12. Feature negotiation (alternativa a versioning)

En lugar de versiones, el cliente declara qué capabilities entiende:

```http
GET /users/123
X-Client-Capabilities: paginated-comments, rich-profile, oauth-v2
```

El servidor adapta la response. Útil cuando tenés muchos clientes heterogéneos y los cambios son ortogonales. **Más complejo de mantener** — usar solo si el versionado lineal no escala.

---

## 13. Testing: contract tests

- Usar **Pact** (o similar) entre frontend y backend por cada versión.
- Los contract tests viven en el repo del consumidor y se publican al broker.
- En CI del backend, verificar que ningún cambio rompe contratos publicados.
- Tests de regresión específicos para v1 mientras esté viva.

---

## Anti-patterns

- ❌ **Breaking change sin nueva versión** — te van a odiar y con razón.
- ❌ **Mantener v1, v2, v3, v4 vivas eternamente** — backport hell, code rot. Máximo 2 majors en paralelo.
- ❌ **Versión en el body JSON** (`{"version": 2, "data": ...}`) — rompe routing y caché.
- ❌ **Sin `Deprecation`/`Sunset` headers** — los consumidores no se enteran del sunset hasta el `410`.
- ❌ **Versionar internals**: auth endpoints, healthchecks, métricas, webhooks salientes generalmente NO se versionan.
- ❌ **Bumpear major por cambios non-breaking** — inflación de versiones, fricción innecesaria.
- ❌ **No monitorear uso de v1** — apagás a ciegas y rompés a un cliente que no sabías que existía.
- ❌ **Documentación única para todas las versiones** — confunde, mantené specs separados.
- ❌ **Changelog inexistente o incompleto** — los consumidores no pueden migrar a ciegas.

---

## Checklist al introducir v2

- [ ] ¿Es realmente breaking? Confirmar contra la lista de la sección 3.
- [ ] ¿Se puede resolver con un campo opcional o un endpoint nuevo en v1? (preferible)
- [ ] Crear `/v2/...` paralelo a `/v1/...`, no in-place.
- [ ] Reusar dominio/service, duplicar solo handlers + DTOs.
- [ ] OpenAPI spec separado para v2.
- [ ] Definir fecha de sunset de v1 (mínimo 6 meses, 12 si hay mobile).
- [ ] Agregar headers `Deprecation` + `Sunset` + `Link` en v1.
- [ ] Logging de hits a v1 con `user-agent`/`client_id`.
- [ ] Dashboard de uso de v1 vs v2.
- [ ] Guía de migración v1 → v2 publicada antes del anuncio.
- [ ] Anunciar a consumidores (changelog, email, Slack).
- [ ] Contract tests de v1 siguen pasando hasta el sunset.
- [ ] Para mobile: subir `min` en `/minimum-version` antes del sunset.
- [ ] Plan de rollback si v2 explota en producción.

---

## Output esperado ✅

Cuando esta skill se ejecuta, debe entregar:

1. **Diagnóstico**: ¿el cambio propuesto es breaking? Justificación.
2. **Recomendación**: nueva major / campo opcional en current / endpoint nuevo / feature flag.
3. **Plan de implementación** específico al stack del proyecto (Go-Gin / NestJS / Fastify).
4. **Timeline de deprecation** con fechas concretas (anuncio, sunset, kill).
5. **Snippets** de routing, headers de deprecation y migración de DTOs.
6. **Lista de consumidores afectados** (web, mobile, integraciones externas) con plan por cada uno.

---

## Delegación a otras skills

- **`/doc-rfc`** — Cuando el cambio amerita un RFC formal con épicas/HUs (versionado mayor de API pública).
- **`/api-docs`** — Para regenerar OpenAPI specs versionados desde el código.
- **`/changelog`** — Para generar release notes del bump de versión.
- **`/deploy-check`** — Antes de deployar v2 (verificar migrations, env vars, rollback plan).
- **`/deps-audit`** — Si el bump implica actualizar SDKs/clientes generados.
- **`/incident`** — Si un sunset rompió a un consumidor en producción.
- **`/scaffold-go`** / **`/scaffold-unity`** — Para nuevos proyectos, definir estrategia de versionado desde el día 0.
