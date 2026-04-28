---
name: postman
description: "Gestionar Postman: collections, environments, requests, folders, variables. Usar cuando el usuario mencione: Postman, collection, environment, API request, endpoint, variable, folder, o cualquier gestión de Postman."
argument-hint: "[collection|environment|request] <action>"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Postman API Manager

Opera via **curl + Postman REST API v10**. Antes de cada comando: `source ~/.config/postman/credentials`.

## Auth

`source ~/.config/postman/credentials` → `POSTMAN_API_KEY`, `POSTMAN_BASE_URL`, `POSTMAN_WORKSPACE_ID`. Header: `-H "X-Api-Key: $POSTMAN_API_KEY"`.

## Workspace & Collections

| Nombre | ID |
|--------|-----|
| Sebastian L. \| Educabot.com's Workspace | 580f4465-9064-470b-8c20-38347b608d71 |

| Collection | UID |
|------------|-----|
| Alizia BE | 52844648-bb2c4990-855f-4d18-8b64-b22088b070f4 |
| Tich B2B | 52844648-9ee9d475-306b-44d6-9e2e-3797ec3fae41 |

## API Operations

| # | Operation | Method | Endpoint |
|---|-----------|--------|----------|
| 1 | List workspaces | GET | `/workspaces` |
| 2 | Get workspace | GET | `/workspaces/{id}` |
| 3 | List collections | GET | `/collections` |
| 4 | Get collection (full) | GET | `/collections/{uid}` |
| 5 | Create collection | POST | `/collections` (+`?workspace=` param) |
| 6 | Update collection | PUT | `/collections/{uid}` |
| 7 | Delete collection | DELETE | `/collections/{uid}` |
| 8 | Create folder | POST | `/collections/{uid}/folders` |
| 9 | Create request | POST | `/collections/{uid}/requests` (+`?folder=` param) |
| 10 | List environments | GET | `/environments` |
| 11 | Get environment | GET | `/environments/{uid}` |
| 12 | Create environment | POST | `/environments` (+`?workspace=` param) |
| 13 | Update environment | PUT | `/environments/{uid}` |
| 14 | Delete environment | DELETE | `/environments/{uid}` |

## Request Body Formats

**JSON:** `mode: "raw"`, `raw: "{...}"`, `options.raw.language: "json"`. **Form data:** `mode: "formdata"`, array key/type/value. **URL encoded:** `mode: "urlencoded"`, array key/value.

## Auth Types

**Bearer:** `auth.type: "bearer"`, `bearer: [{key: "token", value: "{{token}}"}]`. **Basic:** `auth.type: "basic"`, username + password. **API Key:** `auth.type: "apikey"`, key name + value + in (header/query).

## Collection Variables

Include in `variable` array at collection level: `[{key, value, type: "secret"|"default"}]`.

## Collection Structure

Collection with auth (bearer inherited), variables, and items (folders with nested request items). Each request: name, method, url with `{{base_url}}`, headers array, body, auth override if needed.

## Conventions

- `{{variable}}` for environment/collection variables
- Sensitive values: `type: "secret"`
- Organize by module/resource in folders
- Inherit auth at collection level
- Environment names: Development, Staging, Production
- Prefer inline structure (items with sub-items) over individual folder/request API calls

## Troubleshooting

| Error | Fix |
|-------|-----|
| 401 | API key inválida → regenerar en go.postman.com |
| 404 | UID incorrecto → listar para obtener UIDs actuales |
| 400 | JSON malformado → validar con `python3 -m json.tool` |
| Rate limit | 10k calls/mes free → verificar con `/me` |
