---
name: postman
description: "Gestionar Postman: collections, environments, requests, folders, variables. Usar cuando el usuario mencione: Postman, collection, environment, API request, endpoint, variable, folder, o cualquier gestión de Postman."
---

# Postman API Manager — Skill para Claude Code

## INSTRUCCIONES DE USO
- LEER SIEMPRE este archivo antes de ejecutar cualquier operación Postman
- Opera via **curl + Postman REST API v10** (NO usa MCP)
- Antes de cada comando: `source ~/.config/postman/credentials`

## AUTENTICACIÓN
```bash
source ~/.config/postman/credentials
# Variables disponibles: POSTMAN_API_KEY, POSTMAN_BASE_URL, POSTMAN_WORKSPACE_ID
# Header: -H "X-Api-Key: $POSTMAN_API_KEY"
```

## WORKSPACE ACTUAL
| Nombre | ID |
|--------|-----|
| Sebastian L. \| Educabot.com's Workspace | 580f4465-9064-470b-8c20-38347b608d71 |

## COLLECTIONS EXISTENTES
| Nombre | UID | ID |
|--------|-----|-----|
| Alizia BE | 52844648-bb2c4990-855f-4d18-8b64-b22088b070f4 | bb2c4990-855f-4d18-8b64-b22088b070f4 |
| Tich B2B | 52844648-9ee9d475-306b-44d6-9e2e-3797ec3fae41 | 9ee9d475-306b-44d6-9e2e-3797ec3fae41 |

---

## API REFERENCE

### 1. LISTAR WORKSPACES
```bash
curl -s -X GET "$POSTMAN_BASE_URL/workspaces" \
  -H "X-Api-Key: $POSTMAN_API_KEY"
```

### 2. OBTENER DETALLE DE WORKSPACE
```bash
curl -s -X GET "$POSTMAN_BASE_URL/workspaces/$POSTMAN_WORKSPACE_ID" \
  -H "X-Api-Key: $POSTMAN_API_KEY"
```

### 3. LISTAR COLLECTIONS
```bash
curl -s -X GET "$POSTMAN_BASE_URL/collections" \
  -H "X-Api-Key: $POSTMAN_API_KEY"
```

### 4. OBTENER COLLECTION COMPLETA (con requests y folders)
```bash
curl -s -X GET "$POSTMAN_BASE_URL/collections/{collection_uid}" \
  -H "X-Api-Key: $POSTMAN_API_KEY"
```

### 5. CREAR COLLECTION
```bash
curl -s -X POST "$POSTMAN_BASE_URL/collections" \
  -H "X-Api-Key: $POSTMAN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": {
      "info": {
        "name": "Nombre de la Collection",
        "description": "Descripción",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      "item": []
    }
  }'
```
> Para crear en un workspace específico, agregar query param: `?workspace=$POSTMAN_WORKSPACE_ID`

### 6. ACTUALIZAR COLLECTION
```bash
curl -s -X PUT "$POSTMAN_BASE_URL/collections/{collection_uid}" \
  -H "X-Api-Key: $POSTMAN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": {
      "info": {
        "name": "Nombre actualizado",
        "description": "Nueva descripción",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      "item": [...]
    }
  }'
```

### 7. ELIMINAR COLLECTION
```bash
curl -s -X DELETE "$POSTMAN_BASE_URL/collections/{collection_uid}" \
  -H "X-Api-Key: $POSTMAN_API_KEY"
```

### 8. CREAR FOLDER EN COLLECTION
```bash
curl -s -X POST "$POSTMAN_BASE_URL/collections/{collection_uid}/folders" \
  -H "X-Api-Key: $POSTMAN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nombre del Folder",
    "description": "Descripción del folder"
  }'
```

### 9. CREAR REQUEST EN COLLECTION
```bash
curl -s -X POST "$POSTMAN_BASE_URL/collections/{collection_uid}/requests" \
  -H "X-Api-Key: $POSTMAN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nombre del Request",
    "method": "POST",
    "url": "{{base_url}}/api/endpoint",
    "header": [
      {"key": "Content-Type", "value": "application/json"},
      {"key": "Authorization", "value": "Bearer {{token}}"}
    ],
    "body": {
      "mode": "raw",
      "raw": "{\"key\": \"value\"}",
      "options": {"raw": {"language": "json"}}
    },
    "description": "Descripción del request"
  }'
```
> Para agregar dentro de un folder, agregar query param: `?folder={folder_id}`

### 10. CREAR REQUEST EN FOLDER ESPECÍFICO
```bash
curl -s -X POST "$POSTMAN_BASE_URL/collections/{collection_uid}/requests?folder={folder_id}" \
  -H "X-Api-Key: $POSTMAN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Request Name",
    "method": "GET",
    "url": "{{base_url}}/api/resource",
    "header": [
      {"key": "Authorization", "value": "Bearer {{token}}"}
    ]
  }'
```

---

## ENVIRONMENTS

### 11. LISTAR ENVIRONMENTS
```bash
curl -s -X GET "$POSTMAN_BASE_URL/environments" \
  -H "X-Api-Key: $POSTMAN_API_KEY"
```

### 12. OBTENER ENVIRONMENT
```bash
curl -s -X GET "$POSTMAN_BASE_URL/environments/{environment_uid}" \
  -H "X-Api-Key: $POSTMAN_API_KEY"
```

### 13. CREAR ENVIRONMENT
```bash
curl -s -X POST "$POSTMAN_BASE_URL/environments" \
  -H "X-Api-Key: $POSTMAN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": {
      "name": "Development",
      "values": [
        {"key": "base_url", "value": "http://localhost:3000", "type": "default", "enabled": true},
        {"key": "token", "value": "", "type": "secret", "enabled": true},
        {"key": "api_version", "value": "v1", "type": "default", "enabled": true}
      ]
    }
  }'
```
> Para crear en un workspace específico: `?workspace=$POSTMAN_WORKSPACE_ID`

### 14. ACTUALIZAR ENVIRONMENT
```bash
curl -s -X PUT "$POSTMAN_BASE_URL/environments/{environment_uid}" \
  -H "X-Api-Key: $POSTMAN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": {
      "name": "Development",
      "values": [
        {"key": "base_url", "value": "http://localhost:4000", "type": "default", "enabled": true}
      ]
    }
  }'
```

### 15. ELIMINAR ENVIRONMENT
```bash
curl -s -X DELETE "$POSTMAN_BASE_URL/environments/{environment_uid}" \
  -H "X-Api-Key: $POSTMAN_API_KEY"
```

---

## COLLECTION VARIABLES (variables a nivel collection)

Para setear variables a nivel collection, incluirlas en el campo `variable` al crear/actualizar:
```json
{
  "collection": {
    "info": { "name": "...", "schema": "..." },
    "variable": [
      {"key": "base_url", "value": "https://api.example.com"},
      {"key": "api_key", "value": "your-key-here", "type": "secret"}
    ],
    "item": [...]
  }
}
```

---

## FORMATOS DE REQUEST BODY

### JSON Body
```json
{
  "body": {
    "mode": "raw",
    "raw": "{\"email\": \"test@example.com\", \"password\": \"123456\"}",
    "options": {"raw": {"language": "json"}}
  }
}
```

### Form Data
```json
{
  "body": {
    "mode": "formdata",
    "formdata": [
      {"key": "file", "type": "file", "src": "/path/to/file"},
      {"key": "name", "value": "test", "type": "text"}
    ]
  }
}
```

### URL Encoded
```json
{
  "body": {
    "mode": "urlencoded",
    "urlencoded": [
      {"key": "grant_type", "value": "client_credentials"},
      {"key": "client_id", "value": "{{client_id}}"}
    ]
  }
}
```

---

## AUTH TYPES (para requests)

### Bearer Token
```json
{
  "auth": {
    "type": "bearer",
    "bearer": [{"key": "token", "value": "{{token}}"}]
  }
}
```

### Basic Auth
```json
{
  "auth": {
    "type": "basic",
    "basic": [
      {"key": "username", "value": "{{username}}"},
      {"key": "password", "value": "{{password}}"}
    ]
  }
}
```

### API Key
```json
{
  "auth": {
    "type": "apikey",
    "apikey": [
      {"key": "key", "value": "X-Api-Key"},
      {"key": "value", "value": "{{api_key}}"},
      {"key": "in", "value": "header"}
    ]
  }
}
```

---

## COLLECTION COMPLETA CON FOLDERS Y REQUESTS (ejemplo)

```json
{
  "collection": {
    "info": {
      "name": "Mi API",
      "description": "API completa",
      "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "auth": {
      "type": "bearer",
      "bearer": [{"key": "token", "value": "{{token}}"}]
    },
    "variable": [
      {"key": "base_url", "value": "https://api.example.com"}
    ],
    "item": [
      {
        "name": "Auth",
        "item": [
          {
            "name": "Login",
            "request": {
              "method": "POST",
              "url": {"raw": "{{base_url}}/auth/login"},
              "header": [{"key": "Content-Type", "value": "application/json"}],
              "body": {
                "mode": "raw",
                "raw": "{\"email\": \"{{email}}\", \"password\": \"{{password}}\"}",
                "options": {"raw": {"language": "json"}}
              }
            }
          }
        ]
      },
      {
        "name": "Users",
        "item": [
          {
            "name": "Get All Users",
            "request": {
              "method": "GET",
              "url": {"raw": "{{base_url}}/users"}
            }
          }
        ]
      }
    ]
  }
}
```

---

## TIPS Y CONVENCIONES
- Usar `{{variable}}` para variables de environment/collection
- Variables sensibles (tokens, passwords) usar `"type": "secret"`
- Organizar requests en folders por módulo/recurso
- Heredar auth a nivel collection para no repetir en cada request
- Nombres de environments: `Development`, `Staging`, `Production`
- Al crear collection con estructura completa, preferir el formato inline (item con sub-items) sobre la API de folders/requests individuales

## TROUBLESHOOTING
- **401**: API key inválida o expirada → regenerar en go.postman.com
- **404**: UID incorrecto → listar primero para obtener UIDs actuales
- **400**: JSON malformado → validar con `echo '$JSON' | python3 -m json.tool`
- **Rate limit**: 10,000 calls/mes en plan gratuito → verificar con `/me`
