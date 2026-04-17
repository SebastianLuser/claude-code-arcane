---
name: jira-tickets
description: |
  LEER SIEMPRE ANTES de gestionar Jira. Usar cuando el usuario mencione: Jira, ticket, issue, tarea, crear issue, sprint, reporte, avance, board, o cualquier gestión de tareas en Jira. Proyectos: Alizia (ALZ), Tich (TICH), TUNI, Vigía (VIA). Opera via curl + REST API v3 (NO usa MCP). Tiene IDs cacheados de proyectos, estados, transiciones, tipos de issue y usuarios.
argument-hint: "[create|search|update|transition] <args>"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Jira Tickets CLI — Educabot

Skill para gestionar issues en Jira (aula-educabot.atlassian.net) via **curl + REST API v3**. Opera directamente desde Bash, sin MCP.

## Credenciales

Almacenadas en `~/.config/jira/credentials`. Cargar al inicio de cada operación:

```bash
source ~/.config/jira/credentials
```

Todas las llamadas usan:
```bash
curl -s -X METHOD \
  -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  "$JIRA_BASE_URL/rest/api/3/..."
```

## Configuración

### Conexión

```
site: aula-educabot.atlassian.net
base_url: https://aula-educabot.atlassian.net
```

Para armar links a issues: `https://aula-educabot.atlassian.net/browse/{KEY}-{NUM}`

### Usuario actual

```
name: Juan Mateos Galante
account_id: 712020:98d3a4a5-6a5a-4aeb-9562-99b23026769c
email: juan.mateos@educabot.com
```

Cuando el usuario diga "asigname" o "para mí" → usar este `account_id`.

### Directorio de usuarios del equipo (account IDs cacheados)

Usar estos IDs directamente. **NO llamar a la API de búsqueda de usuarios** a menos que se necesite alguien que no esté en esta lista.

| Nombre | account_id | Email | Aliases |
|--------|-----------|-------|---------|
| Juan Mateos Galante | `712020:98d3a4a5-6a5a-4aeb-9562-99b23026769c` | juan.mateos@educabot.com | "juan", "para mí", "asigname" |
| Alejo Bonadeo | `712020:f1ac8489-822d-4d13-9ec6-87cdbe0ccad4` | alejo.bonadeo@educabot.com | "alejo", "bonadeo" |
| Leonardo Cano | `712020:0d30fcc7-8a2c-41fd-b5ac-f6684246caa8` | leonardo.cano@educabot.com | "leo", "cano", "leonardo" |
| Rocío Etchebarne | `712020:2308197a-ffa9-4ee4-92e0-a1c6d1709337` | rocio.etchebarne@educabot.com | "rocio", "etchebarne" |
| Francisco Conte | `712020:7319b298-7da2-43b8-b6b7-b32a0fec6f6a` | francisco.conte@educabot.com | "fran", "conte", "francisco" |
| Sebastian Luser | `712020:58c089e2-fd67-4f6a-890b-5007df236751` | sebastian.luser@educabot.com | "seba", "sebastian", "luser" |
| José Attento | `712020:a3a4d5e5-f779-4225-a164-095114adcd77` | jose.attento@educabot.com | "jose", "attento" |
| Julian Quinteiro | `712020:3fdee20f-9acf-4249-b848-b06124af5363` | julian.quinteiro@educabot.com | "julian", "quinteiro" |
| Joaquin Brito | `712020:6f09bade-95d7-4098-b626-5c256c0a3b39` | joaquin.brito@educabot.com | "joaquin", "brito" |

### Proyectos principales

| Proyecto | Key | ID | Aliases del usuario |
|----------|-----|----|---------------------|
| Alizia | ALZ | 10184 | "alizia", "alz" |
| Tich | TICH | 10036 | "tich", "cronos" |
| Tich For Universities | TUNI | 10052 | "tuni", "universities" |
| Vigía | VIA | 10049 | "vigia", "vigía", "via" |

### Otros proyectos

| Proyecto | Key | ID |
|----------|-----|----|
| Design | DESIGN | 10051 |
| Educabot AI | EAI | 10035 |
| Vocación | VOC | 10185 |

### Tipos de issue (compartidos en todos los proyectos)

| Tipo | ID | Subtask? | Uso |
|------|----|----------|-----|
| Tarea | 10007 | No | Trabajo general |
| Subtarea | 10008 | Sí | Hija de otra issue |
| Historia | 10006 | No | User story |
| Error | 10009 | No | Bug |
| Epic | 10000 | No | Agrupación grande |
| Design | 10079 | No | Trabajo de diseño |
| QA | 10112 | No | Testing/calidad |

### Custom fields para Historias

| Campo | Custom Field ID | Tipo | Uso |
|-------|----------------|------|-----|
| Acceptance criteria | `customfield_10070` | rich text (ADF) | Criterios de aceptación — bullet list |
| Design | `customfield_10071` | URL | Link a Figma u otro diseño |
| Technical details | `customfield_10072` | rich text (ADF) | Detalles técnicos / enrichment |
| Test cases | `customfield_10085` | rich text (ADF) | Casos de prueba |
| QA Assignee | `customfield_10151` | user | Asignado de QA (usar `{"accountId": "..."}`) |
| Issue quality | `customfield_10074` | radio | Calidad: `{"value": "⭐"}`, `{"value": "⭐⭐"}`, o `{"value": "⭐⭐⭐"}` |
| Sprint | `customfield_10020` | number | ID del sprint (entero) |

### Estados y transiciones (globales, mismo workflow en todos los proyectos)

| Transición | Trans. ID | Status resultante | Status ID | Categoría |
|------------|-----------|-------------------|-----------|-----------|
| Por hacer | 11 | Tareas por hacer | 10018 | new |
| En curso | 21 | En curso | 10012 | in-progress |
| Por subir | 41 | Por subir | 10019 | in-progress |
| QA | 51 | Control de calidad | 10020 | in-progress |
| En revisión | 61 | En revisión | 10021 | in-progress |
| EN PROD | 81 | EN PROD | 10105 | in-progress |
| Blocked | 91 | Blocked | 10171 | in-progress |
| Listo | 31 | Finalizada | 10007 | done |
| Canceled | 71 | Cancelado | 10036 | done |

## Épicas activas TUNI

| Épica | Key | Descripción |
|-------|-----|-------------|
| Integración | TUNI-181 | Integración con Canvas LMS |
| Modelo del estudiante | TUNI-905 | Modelo adaptativo del estudiante |
| Mejoras Clase | TUNI-1007 | Mejoras a la sesión de tutoría adaptativa |
| Mejoras Contenido | TUNI-1008 | Mejoras al generador de contenido |
| Mobile | TUNI-1009 | Adaptación para dispositivos móviles |
| Supervisores | TUNI-1010 | Herramientas de supervisión |
| Perfil | TUNI-1011 | Hub de identidad del estudiante |
| Comunidad | TUNI-1012 | Features sociales |
| Modo repaso | TUNI-1016 | Modo de estudio para repasar temas ya vistos |
| Modo desempeño | TUNI-1017 | Modo de estudio intensivo pre-parcial |
| Cosmos | TUNI-1018 | White-labeling / identidad de marca del cliente |
| Memoria | TUNI-1019 | Persistencia de contexto y preferencias del alumno |
| Nivelación Inicial | TUNI-1085 | Diagnóstico rápido para calibrar nivel del alumno |

> **Épicas canceladas (no usar):** TUNI-903 (Clase), TUNI-906 (Contenido) — reemplazadas por TUNI-1007 y TUNI-1008.

## Resolución de proyecto por keywords

| Keywords | Proyecto |
|----------|----------|
| alizia, alz, bloques, programación visual, scratch | ALZ |
| tich, cronos, study, flashcards, challenges | TICH |
| tuni, universities, universidad, tutoria | TUNI |
| vigia, vigía, via, monitoreo, supervisión, alertas | VIA |
| design, diseño, figma, ui, ux | DESIGN |
| educabot ai, eai, ia educabot | EAI |
| vocación, voc, orientación | VOC |

## Sprint conocido (actualizar cuando cambie)

| Sprint | ID | Proyecto | Estado |
|--------|-----|----------|--------|
| AI Sprint 31 | 2147 | TUNI | closed |
| AI Sprint 32 | 2213 | TUNI | active |
| AI Sprint 33 | 2280 | TUNI | future |

---

## API Reference — Operaciones con curl

### Patrón base

```bash
source ~/.config/jira/credentials
JIRA_AUTH="$JIRA_EMAIL:$JIRA_API_TOKEN"
API="$JIRA_BASE_URL/rest/api/3"
AGILE_API="$JIRA_BASE_URL/rest/agile/1.0"
```

### 1. Crear issue

```bash
curl -s -X POST \
  -u "$JIRA_AUTH" \
  -H "Content-Type: application/json" \
  "$API/issue" \
  -d @- <<'PAYLOAD'
{
  "fields": {
    "project": { "key": "TUNI" },
    "issuetype": { "id": "10006" },
    "summary": "Título del ticket",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [{ "type": "text", "text": "Descripción aquí" }]
        }
      ]
    },
    "assignee": { "accountId": "712020:98d3a4a5-6a5a-4aeb-9562-99b23026769c" },
    "priority": { "name": "Medium" },
    "labels": ["backend"],
    "parent": { "key": "TUNI-1007" },
    "customfield_10020": 2147,
    "customfield_10070": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "bulletList",
          "content": [
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Criterio 1"}]}]},
            {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Criterio 2"}]}]}
          ]
        }
      ]
    },
    "customfield_10071": "https://www.figma.com/design/...",
    "customfield_10072": {
      "type": "doc",
      "version": 1,
      "content": [
        {"type": "paragraph", "content": [{"type": "text", "text": "Backend:", "marks": [{"type": "strong"}]}]},
        {"type": "bulletList", "content": [
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Detalle 1"}]}]}
        ]}
      ]
    }
  }
}
PAYLOAD
```

La respuesta incluye `{"id": "12345", "key": "TUNI-123", "self": "..."}`.

**IMPORTANTE — Descripción en API v3:** La descripción DEBE ser ADF (no markdown). A diferencia del MCP que aceptaba markdown, aquí todo es ADF nativo.

### 2. Buscar issues (JQL)

**IMPORTANTE:** El endpoint `/rest/api/3/search` fue eliminado. Usar siempre `/rest/api/3/search/jql` con **POST**.

```bash
curl -s -X POST \
  -u "$JIRA_AUTH" \
  -H "Content-Type: application/json" \
  "$API/search/jql" \
  -d '{
    "jql": "project = TUNI AND sprint in openSprints() ORDER BY status ASC",
    "fields": ["summary","status","assignee","priority","issuetype","labels","customfield_10020","parent"],
    "maxResults": 50
  }'
```

La respuesta incluye `issues[]` con cada issue y sus campos. Parsear con jq:
```bash
| jq '[.issues[] | {key: .key, summary: .fields.summary, status: .fields.status.name, assignee: (.fields.assignee.displayName // "Sin asignar"), priority: .fields.priority.name}]'
```

**Paginación:** La respuesta incluye `nextPageToken`. Para la siguiente página:
```json
{"jql": "...", "fields": [...], "maxResults": 50, "nextPageToken": "TOKEN_AQUI"}
```

### 3. Obtener un issue

```bash
curl -s \
  -u "$JIRA_AUTH" \
  "$API/issue/TUNI-123?fields=summary,status,assignee,priority,description,comment,customfield_10020,customfield_10070,customfield_10072,parent,labels,issuetype"
```

### 4. Editar issue

```bash
curl -s -X PUT \
  -u "$JIRA_AUTH" \
  -H "Content-Type: application/json" \
  "$API/issue/TUNI-123" \
  -d @- <<'PAYLOAD'
{
  "fields": {
    "summary": "Nuevo título",
    "assignee": { "accountId": "712020:..." },
    "priority": { "name": "High" },
    "labels": ["backend", "urgent"],
    "parent": { "key": "TUNI-1007" }
  }
}
PAYLOAD
```

Respuesta: `204 No Content` = éxito.

### 5. Transicionar issue (cambiar status)

```bash
curl -s -X POST \
  -u "$JIRA_AUTH" \
  -H "Content-Type: application/json" \
  "$API/issue/TUNI-123/transitions" \
  -d '{"transition": {"id": "21"}}'
```

Usar los Trans. ID de la tabla de estados. Respuesta: `204 No Content` = éxito.

### 6. Agregar comentario

```bash
curl -s -X POST \
  -u "$JIRA_AUTH" \
  -H "Content-Type: application/json" \
  "$API/issue/TUNI-123/comment" \
  -d @- <<'PAYLOAD'
{
  "body": {
    "type": "doc",
    "version": 1,
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Comentario aquí" }]
      }
    ]
  }
}
PAYLOAD
```

### 7. Obtener comentarios de un issue

```bash
curl -s \
  -u "$JIRA_AUTH" \
  "$API/issue/TUNI-123/comment?orderBy=-created&maxResults=10"
```

### 8. Obtener transiciones disponibles

```bash
curl -s \
  -u "$JIRA_AUTH" \
  "$API/issue/TUNI-123/transitions"
```

### 9. Obtener remote links de un issue

```bash
curl -s \
  -u "$JIRA_AUTH" \
  "$API/issue/TUNI-123/remotelink"
```

### 10. Crear issue link (relación entre issues)

```bash
curl -s -X POST \
  -u "$JIRA_AUTH" \
  -H "Content-Type: application/json" \
  "$API/issueLink" \
  -d '{"type": {"name": "Blocks"}, "inwardIssue": {"key": "TUNI-100"}, "outwardIssue": {"key": "TUNI-200"}}'
```

### 11. Sprints — Listar sprints de un board

```bash
curl -s \
  -u "$JIRA_AUTH" \
  "$AGILE_API/board/33/sprint?state=active,future"
```

### 12. Sprints — Mover issues a un sprint

```bash
curl -s -X POST \
  -u "$JIRA_AUTH" \
  -H "Content-Type: application/json" \
  "$AGILE_API/sprint/2147/issue" \
  -d '{"issues": ["TUNI-123", "TUNI-124"]}'
```

### 13. Bulk create (loop)

Para crear múltiples issues, ejecutar la operación de crear issue en un loop. Construir cada payload como JSON y ejecutar secuencialmente. Ejemplo con 3 issues:

```bash
source ~/.config/jira/credentials
JIRA_AUTH="$JIRA_EMAIL:$JIRA_API_TOKEN"
API="$JIRA_BASE_URL/rest/api/3"

for payload in "$PAYLOAD1" "$PAYLOAD2" "$PAYLOAD3"; do
  result=$(curl -s -X POST -u "$JIRA_AUTH" -H "Content-Type: application/json" "$API/issue" -d "$payload")
  echo "$result" | jq -r '.key'
done
```

O usar la API de bulk create nativa:

```bash
curl -s -X POST \
  -u "$JIRA_AUTH" \
  -H "Content-Type: application/json" \
  "$API/issue/bulk" \
  -d @- <<'PAYLOAD'
{
  "issueUpdates": [
    {
      "fields": {
        "project": { "key": "TUNI" },
        "issuetype": { "id": "10006" },
        "summary": "Issue 1",
        "description": { "type": "doc", "version": 1, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Desc 1"}]}] }
      }
    },
    {
      "fields": {
        "project": { "key": "TUNI" },
        "issuetype": { "id": "10006" },
        "summary": "Issue 2",
        "description": { "type": "doc", "version": 1, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Desc 2"}]}] }
      }
    }
  ]
}
PAYLOAD
```

### 14. Add worklog

```bash
curl -s -X POST \
  -u "$JIRA_AUTH" \
  -H "Content-Type: application/json" \
  "$API/issue/TUNI-123/worklog" \
  -d '{"timeSpentSeconds": 3600, "comment": {"type": "doc", "version": 1, "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Trabajo realizado"}]}]}}'
```

---

## ADF Reference (Atlassian Document Format)

Todos los campos rich text en API v3 usan ADF. Referencia rápida de nodos:

### Paragraph
```json
{"type": "paragraph", "content": [{"type": "text", "text": "Texto simple"}]}
```

### Bold
```json
{"type": "text", "text": "Negrita", "marks": [{"type": "strong"}]}
```

### Italic
```json
{"type": "text", "text": "Cursiva", "marks": [{"type": "em"}]}
```

### Code inline
```json
{"type": "text", "text": "código", "marks": [{"type": "code"}]}
```

### Link
```json
{"type": "text", "text": "Ver docs", "marks": [{"type": "link", "attrs": {"href": "https://..."}}]}
```

### Heading
```json
{"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Título"}]}
```

### Bullet list
```json
{
  "type": "bulletList",
  "content": [
    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Item 1"}]}]},
    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Item 2"}]}]}
  ]
}
```

### Ordered list
```json
{
  "type": "orderedList",
  "content": [
    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Paso 1"}]}]},
    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Paso 2"}]}]}
  ]
}
```

### Code block
```json
{"type": "codeBlock", "attrs": {"language": "python"}, "content": [{"type": "text", "text": "print('hello')"}]}
```

### Rule (divider)
```json
{"type": "rule"}
```

### Sección con heading + bullets (patrón común para technical details)
```json
[
  {"type": "paragraph", "content": [{"type": "text", "text": "Backend:", "marks": [{"type": "strong"}]}]},
  {"type": "bulletList", "content": [
    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Endpoint GET /api/v1/foo"}]}]},
    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Validar permisos"}]}]}
  ]},
  {"type": "paragraph", "content": [{"type": "text", "text": "Frontend:", "marks": [{"type": "strong"}]}]},
  {"type": "bulletList", "content": [
    {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Componente FooCard"}]}]}
  ]}
]
```

### Wrapper obligatorio de todo documento ADF
```json
{
  "type": "doc",
  "version": 1,
  "content": [ ...nodos aquí... ]
}
```

---

## Workflows

### 1. Crear issue

**Triggers:** "creá un ticket en Jira", "issue en TICH", "nueva tarea en ALZ", "ticket de Vigía"

1. Detectar proyecto por keyword o contexto (ver tabla de aliases)
2. Si no menciona proyecto → preguntar
3. Extraer: título, descripción, tipo (default: Tarea), prioridad, assignee
4. Resolver assignee desde el **directorio de usuarios cacheado**
5. Si dice "asigname" → usar account_id de Juan Mateos Galante
6. Si menciona sprint → resolver el ID desde la tabla de sprints conocidos o buscar con API
7. **Separar contenido en campos (todo ADF):**
   - `description`: User story + descripción funcional en ADF
   - `customfield_10070`: Criterios de aceptación en ADF (bulletList)
   - `customfield_10072`: Detalles técnicos en ADF (headers + bullets)
   - `customfield_10071`: Link a Figma (URL string)
8. Construir JSON payload y ejecutar con curl
9. Parsear respuesta con `jq` para extraer key
10. Reportar con link: `https://aula-educabot.atlassian.net/browse/{KEY}`

### 2. Ver/buscar issues

**Triggers:** "mostrame los tickets de TICH", "qué hay en el sprint", "issues abiertas de Alizia"

1. Construir JQL según lo pedido
2. Ejecutar búsqueda con curl
3. Parsear con `jq` y presentar en tabla: Key, Summary, Status, Assignee, Priority
4. Incluir links a cada issue

### 3. Reporte de avance

**Triggers:** "reporte del sprint", "cómo vamos en TICH", "avance del equipo"

1. Buscar issues del sprint actual con JQL: `project = {KEY} AND sprint in openSprints()`
2. Parsear con `jq`, agrupar por status
3. Calcular: total, por hacer, en curso, finalizadas, bloqueadas
4. Presentar resumen con porcentaje de avance y tabla detallada

### 4. Actualizar issue

**Triggers:** "actualizá TICH-123", "cambiá el status de ALZ-45", "asigná VIA-67 a..."

1. Si pide cambiar status → transicionar con el transition ID correcto
2. Si pide cambiar campos → editar con PUT
3. Si pide comentar → agregar comentario
4. Confirmar el cambio al usuario

### 5. Bulk create

**Triggers:** "creá estos tickets", "pasá esta lista a Jira", "estos issues para TICH"

1. Parsear la lista extrayendo: título, tipo, descripción, criterios, detalles técnicos, link de Figma
2. Confirmar proyecto y tipo por defecto
3. Construir payloads y usar `/issue/bulk` o loop de `/issue`
4. Reportar resumen con keys y links

### 6. Extraer contexto de un issue

**Triggers:** "qué dice TICH-123", "dame contexto de ALZ-45", "leé el ticket VIA-10"

1. GET issue con todos los campos útiles
2. Parsear con jq
3. Presentar: summary, description, status, assignee, comments, links
4. Si tiene subtareas o parent → mencionarlas

---

## JQL Reference rápida

### Filtros de estado
```jql
status NOT IN (Finalizada, Cancelado)
status IN ("En curso", "Por subir", "En revisión")
status = "Tareas por hacer"
status = Blocked
```

### Filtros de sprint
```jql
sprint in openSprints()
project = TICH AND sprint in openSprints()
sprint is EMPTY
```

### Filtros de asignación
```jql
assignee = currentUser()
assignee is EMPTY
assignee = "712020:account-id-aqui"
```

### Filtros por fecha
```jql
created >= startOfWeek()
updated >= startOfDay()
created >= -7d
```

### Combinaciones útiles
```jql
project = TICH AND sprint in openSprints() ORDER BY status ASC, priority DESC
assignee = currentUser() AND status NOT IN (Finalizada, Cancelado) ORDER BY priority DESC
issuetype = Error AND status NOT IN (Finalizada, Cancelado) ORDER BY priority DESC
project = ALZ AND assignee is EMPTY AND sprint is EMPTY ORDER BY created DESC
project = VIA AND updated >= startOfDay() ORDER BY updated DESC
```

---

## Troubleshooting

### Verificar conexión
```bash
source ~/.config/jira/credentials
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" "$JIRA_BASE_URL/rest/api/3/myself" | jq '.displayName'
```

### Error 401
Token inválido o expirado. Regenerar en https://id.atlassian.com/manage-profile/security/api-tokens y actualizar `~/.config/jira/credentials`.

### Error 400 en custom fields ADF
Verificar que el campo usa la estructura `{"type": "doc", "version": 1, "content": [...]}`. NO pasar strings planos en campos ADF.

### Error 404 en issue
Verificar que la key es correcta y que el usuario tiene acceso al proyecto.

### Parsear respuesta de error
```bash
curl -s ... | jq '.errors, .errorMessages'
```
