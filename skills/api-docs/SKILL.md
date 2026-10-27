---
name: api-docs
description: "Generate or update API docs from source code. Scans endpoints, extracts methods, routes, params, responses. Trigger: API docs, swagger."
category: "api"
argument-hint: "[path to scan, default .]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# API Documentation Generator

Scans the source code to generate API documentation.

## Process

### 1. Detect the framework and routes

| Framework | Where to look for routes |
|-----------|-------------------|
| Gin (Go) | `engine.GET/POST/PUT/DELETE`, `Group()` |
| Echo (Go) | `e.GET/POST/PUT/DELETE`, `Group()` |
| Express (Node) | `router.get/post/put/delete`, `app.use()` |
| Fastify (Node) | `fastify.get/post`, route schemas |
| FastAPI (Python) | `@app.get/post`, Pydantic models |
| Django REST | `urlpatterns`, ViewSets |
| NestJS | `@Get/@Post` decorators, DTOs |

### 2. For each endpoint, extract

- **HTTP method** (GET, POST, PUT, DELETE, PATCH)
- **Route** with params (`:id`, `{id}`)
- **Middleware/Guards** (auth, required roles)
- **Request body** (struct/DTO/schema)
- **Query params**
- **Response** (response struct, status codes)
- **Description** (from the comment or the handler name)

### 3. Generate the documentation

```markdown
# API Documentation — [Project]
**Base URL:** `[detected from config or .env]`
**Auth:** [Bearer JWT / API Key / etc.]
**Last updated:** [date]

---

## [Module/Group]

### [METHOD] /api/v1/path/:param

**Description:** [what it does]
**Auth:** [required/public] | **Roles:** [admin, coordinator]

**Path params:**
| Param | Type | Description |
|-------|------|-------------|

**Query params:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|

**Request body:**
```json
{
  "field": "type — description"
}
```

**Responses:**
| Status | Description | Body |
|--------|-------------|------|
| 200 | Success | `{ ... }` |
| 400 | Validation | `{ "error": "..." }` |
| 401 | Not authenticated | |
| 404 | Not found | |

---
```

### 4. Summary table

```markdown
## Endpoint summary

| Method | Route | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | /api/v1/users | Yes | admin | List users |
| POST | /api/v1/users | Yes | admin | Create user |
```

### 5. Output

- Show it on screen
- Save it to `docs/API.md` if the user asks for it

## Rules
- Follow the real structure of the code, do not invent endpoints
- If there is an existing OpenAPI/Swagger → read it and update it instead of creating a new one
- Group endpoints by module/resource
- Write descriptions in the user's language
- Include request/response examples when they can be inferred from the code
