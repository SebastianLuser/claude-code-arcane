---
name: api-design
description: "Diseño de APIs para apps Educabot: REST con convenciones consistentes, OpenAPI spec, versioning, paginación, errores, GraphQL cuando tiene sentido, contratos tipados end-to-end (Zod/TS, gen desde OpenAPI). Usar para: api design, rest, graphql, openapi, swagger, endpoint, contract."
---

# api-design — REST & GraphQL Design

Guía de diseño de APIs para backends Educabot (Go + TS). Favorece **REST + OpenAPI** por default; GraphQL solo con justificación.

## Cuándo usar

- Diseñar API nueva (nuevo producto/feature)
- Review de API existente antes de exponerla a terceros
- Refactor para unificar convenciones entre servicios
- Definir contrato antes de empezar código

## Cuándo NO usar

- Endpoints internos efímeros (cron jobs, workers) — no necesitan OpenAPI completo
- RPC puro (usar gRPC si es service-to-service con latencia crítica)

---

## 1. REST vs GraphQL — decisión

| Criterio | REST | GraphQL |
|----------|------|---------|
| Shape de datos | Estable, conocido | Variable, cliente decide |
| Clients | 1-2 (web + mobile) | Múltiples con necesidades distintas |
| Over/under-fetch | Aceptable | Problema real (resuelto por GQL) |
| Caching HTTP | Nativo (Cache-Control) | Complejo |
| Tooling | Maduro (OpenAPI, Postman) | Decente (Apollo, urql) |
| Equipo experto | Sí | Requiere ramp-up |

**Default Educabot: REST.** Usar GraphQL solo si:
1. Múltiples clientes con shapes muy distintas
2. Pantallas con muchas relaciones anidadas (ej. dashboard Alizia)
3. El equipo tiene experiencia

---

## 2. REST — convenciones

### URLs
```
✅ /api/v1/courses                       # recurso plural
✅ /api/v1/courses/{courseId}
✅ /api/v1/courses/{courseId}/students
✅ /api/v1/courses/{courseId}/students/{studentId}

❌ /api/v1/getCourse?id=123              # verbos en URL
❌ /api/v1/course                        # singular inconsistente
❌ /api/v1/students-by-course?id=123     # no-resource
```

### Verbos HTTP
| Método | Uso | Body | Idempotente | Safe |
|--------|-----|------|-------------|------|
| GET | Leer | No | Sí | Sí |
| POST | Crear | Sí | No | No |
| PUT | Reemplazar entero | Sí | Sí | No |
| PATCH | Update parcial | Sí | No¹ | No |
| DELETE | Borrar | No | Sí | No |

¹ PATCH puede ser idempotente si el cliente envía el estado completo deseado.

### Status codes
```
200 OK              — GET, PUT, PATCH, DELETE exitoso
201 Created         — POST que creó recurso (+ Location header)
202 Accepted        — async aceptado pero no completado
204 No Content      — DELETE sin body de respuesta
400 Bad Request     — input mal formado
401 Unauthorized    — sin auth (o auth inválida)
403 Forbidden       — auth OK pero sin permisos
404 Not Found       — recurso no existe
409 Conflict        — estado inconsistente (duplicado, version stale)
422 Unprocessable   — input bien formado pero lógicamente inválido
429 Too Many Requests — rate limited
5xx                 — problema del server, no del cliente
```

### Errores — RFC 9457 (Problem Details)
```json
{
  "type": "https://errors.educabot.com/course/not-found",
  "title": "Course not found",
  "status": 404,
  "detail": "Course with id abc123 does not exist or you lack access",
  "instance": "/api/v1/courses/abc123",
  "traceId": "7f3c8a2b-..."
}
```

Header: `Content-Type: application/problem+json`

### Respuestas exitosas
```json
// single
{
  "data": { "id": "abc", "name": "Math 101" }
}

// list
{
  "data": [ { "id": "abc" }, { "id": "def" } ],
  "pagination": {
    "cursor": "eyJpZCI6ImRlZiJ9",
    "hasMore": true,
    "total": 127
  }
}
```

Wrapper `data` facilita agregar metadata sin breaking change.

### Paginación — cursor > offset
```
✅ GET /courses?limit=20&cursor=eyJpZCI6ImRlZiJ9
❌ GET /courses?page=5&pageSize=20     # degrada con tablas grandes
```

Cursor opaco (base64 de `{id, sortKey}`). `total` solo si es barato calcularlo.

### Filtros, sort, fields
```
GET /courses?filter[status]=active&filter[teacherId]=t_123
GET /courses?sort=-createdAt,name           # - = desc
GET /courses?fields=id,name,studentCount    # sparse fieldset
```

### Versioning
Preferido: **URL path** (`/v1`, `/v2`). Simple, cacheable, grep-friendly.
Alternativa: header (`Accept: application/vnd.educabot.v2+json`) — más "puro" pero molesto en cliente.

**Nunca** breaking change sin bump de versión. Mantener v1 activo ≥ 6 meses después de publicar v2.

### Idempotencia (POST)
```
POST /api/v1/payments
Idempotency-Key: 9e8d7c6b-...
```
Server guarda (key, result) por 24h. Reintentos retornan el mismo resultado.

### Rate limiting — headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1712345678
Retry-After: 30         # solo en 429
```

---

## 3. OpenAPI spec

### Estructura
```yaml
openapi: 3.1.0
info:
  title: Alizia API
  version: 1.4.0
  description: |
    API de Alizia (LMS Educabot).
    Auth: Bearer JWT via /auth/login.
servers:
  - url: https://api.educabot.com/v1
    description: Production
  - url: https://staging-api.educabot.com/v1
    description: Staging

security:
  - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Course:
      type: object
      required: [id, name, teacherId, createdAt]
      properties:
        id: { type: string, example: "c_abc123" }
        name: { type: string, minLength: 1, maxLength: 200 }
        teacherId: { type: string }
        studentCount: { type: integer, minimum: 0 }
        createdAt: { type: string, format: date-time }

    Error:
      type: object
      required: [type, title, status]
      properties:
        type: { type: string, format: uri }
        title: { type: string }
        status: { type: integer }
        detail: { type: string }
        traceId: { type: string }

paths:
  /courses:
    get:
      summary: List courses
      parameters:
        - in: query
          name: limit
          schema: { type: integer, default: 20, maximum: 100 }
        - in: query
          name: cursor
          schema: { type: string }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/Course' }
                  pagination:
                    $ref: '#/components/schemas/Pagination'
```

### Tooling
- **Editor:** [Swagger Editor](https://editor.swagger.io/) o [Stoplight Studio](https://stoplight.io/)
- **Lint:** `spectral lint openapi.yaml` (Stoplight Spectral)
- **Mock server:** `prism mock openapi.yaml`
- **Docs:** `redocly build-docs openapi.yaml` o Scalar

### Publicar docs
```ts
// Fastify
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

await app.register(swagger, { mode: 'static', specification: { path: './openapi.yaml' } });
await app.register(swaggerUi, { routePrefix: '/docs' });
```

```go
// Go + Gin + swaggo
// @title Alizia API
// @version 1.4.0
// @BasePath /v1
import _ "docs"  // generado por `swag init`
import ginSwagger "github.com/swaggo/gin-swagger"
r.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
```

---

## 4. Contratos tipados end-to-end

### Opción A — Schema-first (recomendado)
1. Escribir `openapi.yaml` a mano o con Stoplight
2. Generar types de cliente:
```bash
# TS
npx openapi-typescript openapi.yaml -o src/api/types.gen.ts

# Go
oapi-codegen -generate types,client -package api openapi.yaml > api/gen.go
```
3. Frontend y backend comparten tipos vía `types.gen.ts`.

### Opción B — Code-first con Zod (Fastify)
```ts
import { z } from 'zod';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const CourseSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  teacherId: z.string(),
});

export const coursesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/courses/:id', {
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: z.object({ data: CourseSchema }) },
    },
  }, async (req) => {
    const course = await getCourse(req.params.id);
    return { data: course };
  });
};
```

Exportar OpenAPI desde runtime: `fastify-swagger` lo infiere de los schemas.

### Share con frontend
Monorepo con `packages/api-types` que re-exporta Zod schemas → import desde React app.

---

## 5. GraphQL — cuando aplica

### Schema
```graphql
type Query {
  course(id: ID!): Course
  courses(
    filter: CourseFilter
    first: Int = 20
    after: String
  ): CourseConnection!
}

type Mutation {
  createCourse(input: CreateCourseInput!): CreateCoursePayload!
}

type Course {
  id: ID!
  name: String!
  teacher: User!
  students(first: Int, after: String): StudentConnection!
  createdAt: DateTime!
}

type CourseConnection {
  edges: [CourseEdge!]!
  pageInfo: PageInfo!
  totalCount: Int
}
```

### Principios GraphQL
- **Cursor pagination (Relay spec)** por default
- **Mutation payloads** incluyen el objeto modificado + `clientMutationId`
- **Union types** para errores de dominio (vs throw):
  ```graphql
  union CreateCoursePayload = CreateCourseSuccess | ValidationError | NotAuthorizedError
  ```
- **DataLoader** para N+1
- **Persisted queries** en prod (no arbitrary queries del cliente)
- **Depth limit + complexity limit** en runtime

### Stack recomendado
- Server: Apollo Server / Mercurius (Fastify) / gqlgen (Go)
- Client: urql (más simple) o Apollo Client
- Codegen: `graphql-codegen` para types de cliente

---

## 6. Auth patterns

### JWT Bearer
```
Authorization: Bearer eyJhbGciOi...
```
Ver `/security-hardening` §6 para reglas de JWT.

### API keys (integraciones B2B)
```
X-API-Key: educabot_live_...
```
Scoped por client. Separados de user JWTs. Ver gitleaks rule en `/security-hardening`.

### Scopes / RBAC en endpoints
```yaml
paths:
  /courses/{id}:
    delete:
      security:
        - bearerAuth: [courses:write]
```

---

## 7. Webhooks (out-bound)

Cuando la API **notifica** a un cliente:

- **Firma HMAC** del payload:
  ```
  X-Educabot-Signature: sha256=abc123...
  ```
- **Timestamp** anti-replay (rechazar > 5min):
  ```
  X-Educabot-Timestamp: 1712345678
  ```
- **Retry con exponential backoff** (ej: 1m, 5m, 30m, 2h, 12h)
- **Idempotency key** en headers
- **Endpoint de prueba** para que el cliente valide su handler
- **Dashboard** para ver fails y reintentar

---

## 8. Checklist de review de API

```markdown
## API design review

### Resources
- [ ] URLs plurales, kebab-case
- [ ] No verbos en URL
- [ ] Nesting coherente (≤ 2 niveles)

### HTTP
- [ ] Verbos correctos (no GET con side-effects)
- [ ] Status codes correctos (no 200 con body de error)
- [ ] Headers estándar (Cache-Control, ETag cuando aplica)

### Errores
- [ ] Formato consistente (Problem Details)
- [ ] `traceId` para debugging
- [ ] No leak de stack traces

### Responses
- [ ] Wrapper `data` + `pagination` / `meta`
- [ ] Paginación cursor
- [ ] Fechas ISO 8601 UTC
- [ ] IDs opacos (no auto-increment expuestos)

### Contratos
- [ ] OpenAPI spec actualizada
- [ ] Lint pasa (spectral)
- [ ] Types generados y usados en cliente
- [ ] Breaking changes → bump de versión

### Seguridad
- [ ] Auth documentada
- [ ] Scopes/permisos por endpoint
- [ ] Rate limit headers
- [ ] Input validation (Zod/validator)
- [ ] No PII innecesaria en responses

### Observabilidad
- [ ] Logs con request_id/trace_id
- [ ] Métricas RED por endpoint
- [ ] Errores en Sentry
```

---

## 9. Anti-patterns

- ❌ Verbos en URLs (`/getUser`, `/deleteCourse`)
- ❌ Status 200 con `{"error": "..."}`
- ❌ Offset pagination en tablas grandes
- ❌ Breaking change sin bump de versión
- ❌ Stack trace en response de prod
- ❌ IDs auto-increment expuestos (enum + scraping)
- ❌ Fechas en formato no-ISO (`"13/04/2026"`)
- ❌ Endpoints que retornan el schema cambiado según query param sin tipado
- ❌ GraphQL sin depth/complexity limits → DoS trivial
- ❌ Webhooks sin firma → spoofing
- ❌ OpenAPI mantenida a mano que drifta del código

---

## 10. Decisión rápida — qué usar

| Caso | Recomendado |
|------|-------------|
| API pública B2B | REST + OpenAPI |
| Backend de app web (1 cliente) | REST + OpenAPI + types generados |
| Backend con web + mobile + partners | REST (o GraphQL si mucho over-fetch) |
| Service-to-service interno low-latency | gRPC |
| Dashboard con muchas relaciones | GraphQL |
| Admin panel CRUD | REST simple, sin OpenAPI formal |
| Webhooks outbound | REST + HMAC |

---

## Output final

```
✅ API design completada — <service> v1
   📄 OpenAPI spec: docs/openapi.yaml (lint ✅)
   🔗 Docs: https://api.educabot.com/docs
   🧬 Types generados: packages/api-types/
   🔒 Auth: Bearer JWT + scopes

Próximos pasos:
  1. Review con frontend-lead (contrato)
  2. Mock server en CI para tests de cliente
  3. Versioning policy documentada en RFC
```

## Delegación

**Coordinar con:** `backend-architect`, `frontend-architect`, `product-manager`
**Reporta a:** `backend-architect`, `cto`

**Skills relacionadas:**
- `/security-hardening` — auth, rate limit, validation
- `/observability-setup` — métricas RED por endpoint
- `/doc-rfc` — documentar decisiones de diseño
- `/performance-test` — validar thresholds definidos en OpenAPI examples
