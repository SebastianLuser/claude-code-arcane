---
name: gdocs
description: "Gestionar Google Docs: crear, leer, editar documentos via Google Docs API v1. Usar cuando el usuario mencione: Google Docs, Gdocs, documento de Google, doc, crear doc, editar doc, template en Docs."
---

# Google Docs Manager

Interactúa con Google Docs via Docs API v1 + Drive API v3.

## Auth Setup

Opción 1 — Service account (recomendado para automation):
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

Opción 2 — OAuth user flow:
```bash
# Requiere gcloud CLI
gcloud auth application-default login
```

Scopes necesarios:
- `https://www.googleapis.com/auth/documents` (read/write docs)
- `https://www.googleapis.com/auth/drive.file` (crear/compartir archivos)

## Operaciones Clave

### Crear doc nuevo
```bash
curl -X POST https://docs.googleapis.com/v1/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Mi Documento"}'
```
Devuelve `documentId`.

### Leer contenido
```bash
curl https://docs.googleapis.com/v1/documents/$DOC_ID \
  -H "Authorization: Bearer $TOKEN"
```
Devuelve estructura de body (paragraphs, tables, etc.).

### Editar (batch updates)
```bash
curl -X POST https://docs.googleapis.com/v1/documents/$DOC_ID:batchUpdate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {"insertText": {"location": {"index": 1}, "text": "Hola mundo\n"}},
      {"updateTextStyle": {
        "range": {"startIndex": 1, "endIndex": 10},
        "textStyle": {"bold": true},
        "fields": "bold"
      }}
    ]
  }'
```

### Copiar template
```bash
# Drive API
curl -X POST "https://www.googleapis.com/drive/v3/files/$TEMPLATE_ID/copy" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Nueva copia del documento"}'
```

### Reemplazar placeholders
```json
{
  "requests": [
    {"replaceAllText": {
      "containsText": {"text": "{{TITLE}}", "matchCase": true},
      "replaceText": "Mi título real"
    }},
    {"replaceAllText": {
      "containsText": {"text": "{{DATE}}"},
      "replaceText": "2026-04-12"
    }}
  ]
}
```

## Comandos

### Crear doc desde template
```
/gdocs from-template <template_id> [variables]
```

Flujo:
1. Copy del template a Drive destino
2. Reemplazá placeholders {{...}} con valores
3. Compartir con stakeholders si se especifica
4. Devolver URL

### Generar doc desde markdown
```
/gdocs from-markdown <file.md> "título"
```

Convierte markdown a Docs API requests:
- `# H1` → heading style
- `**bold**` → text style bold
- listas → bulleted lists
- tablas → insertTable
- links → textStyle con link
- code blocks → courier font + background gris

### Extraer contenido a markdown
```
/gdocs export <doc_id>
```
GET del doc → parsear structure → output markdown.

## Reglas

- **Document structure es NO plain text**. Usar batchUpdate, nunca sobrescribir con texto plano.
- **Índices en Docs son basados en caracteres** (Unicode). Calcular con cuidado al insert/delete.
- **Revisiones**: cada batchUpdate crea una revision. Frecuent saves = muchas revisiones, OK.
- **Permisos via Drive API**: `POST /drive/v3/files/{id}/permissions` para compartir.
- **Límites**: 1MB por doc máx, 1000 req/100s/user para Docs API.
