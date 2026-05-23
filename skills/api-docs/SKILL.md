---
name: api-docs
description: "Generate or update API docs from source code. Scans endpoints, extracts methods, routes, params, responses. Trigger: API docs, swagger."
category: "api"
argument-hint: "[path to scan, default .]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# API Documentation Generator

Escanea el código fuente para generar documentación de API.

## Process

### 1. Detectar framework y rutas

| Framework | Dónde buscar rutas |
|-----------|-------------------|
| Gin (Go) | `engine.GET/POST/PUT/DELETE`, `Group()` |
| Echo (Go) | `e.GET/POST/PUT/DELETE`, `Group()` |
| Express (Node) | `router.get/post/put/delete`, `app.use()` |
| Fastify (Node) | `fastify.get/post`, route schemas |
| FastAPI (Python) | `@app.get/post`, Pydantic models |
| Django REST | `urlpatterns`, ViewSets |
| NestJS | `@Get/@Post` decorators, DTOs |

### 2. Para cada endpoint extraer

- **Método HTTP** (GET, POST, PUT, DELETE, PATCH)
- **Ruta** con params (`:id`, `{id}`)
- **Middleware/Guards** (auth, roles requeridos)
- **Request body** (struct/DTO/schema)
- **Query params**
- **Response** (struct de respuesta, status codes)
- **Descripción** (del comentario o nombre del handler)

### 3. Generar documentación

```markdown
# API Documentation — [Proyecto]
**Base URL:** `[detectado de config o .env]`
**Auth:** [Bearer JWT / API Key / etc.]
**Última actualización:** [fecha]

---

## [Módulo/Grupo]

### [METHOD] /api/v1/path/:param

**Descripción:** [qué hace]
**Auth:** [requerido/público] | **Roles:** [admin, coordinator]

**Path params:**
| Param | Tipo | Descripción |
|-------|------|-------------|

**Query params:**
| Param | Tipo | Required | Default | Descripción |
|-------|------|----------|---------|-------------|

**Request body:**
```json
{
  "field": "type — descripción"
}
```

**Responses:**
| Status | Descripción | Body |
|--------|-------------|------|
| 200 | Éxito | `{ ... }` |
| 400 | Validación | `{ "error": "..." }` |
| 401 | No autenticado | |
| 404 | No encontrado | |

---
```

### 4. Tabla resumen

```markdown
## Resumen de endpoints

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| GET | /api/v1/users | Si | admin | Listar usuarios |
| POST | /api/v1/users | Si | admin | Crear usuario |
```

### 5. Output

- Mostrar en pantalla
- Guardar en `docs/API.md` si el usuario lo pide

## Rules
- Seguir la estructura real del código, no inventar endpoints
- Si hay OpenAPI/Swagger existente → leerlo y actualizarlo en vez de crear uno nuevo
- Agrupar endpoints por módulo/recurso
- En español para descripciones
- Incluir ejemplos de request/response cuando sea posible inferirlos del código
