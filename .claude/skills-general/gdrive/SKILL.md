---
name: gdrive
description: "Gestionar Google Drive: buscar, crear, mover, compartir archivos y carpetas via Drive API v3. Usar cuando el usuario mencione: Google Drive, Gdrive, archivo en Drive, carpeta, folder, compartir archivo, upload, download."
argument-hint: "[search|upload|move|share] [query or path]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Google Drive Manager

API v3 para gestión de archivos y folders en Drive.

## Operaciones Clave

### Buscar archivos
```bash
curl "https://www.googleapis.com/drive/v3/files?q=name+contains+'reporte'" \
  -H "Authorization: Bearer $TOKEN"
```

Query language:
- `name contains 'X'` — por nombre
- `mimeType = 'application/vnd.google-apps.document'` — por tipo
- `parents in 'folder_id'` — en folder específico
- `modifiedTime > '2026-01-01T00:00:00'`
- `owners in 'user@example.com'`
- Combinar: `A and B`, `A or B`, `not A`

### MIME types comunes

| Tipo | MIME |
|------|------|
| Folder | `application/vnd.google-apps.folder` |
| Doc | `application/vnd.google-apps.document` |
| Sheet | `application/vnd.google-apps.spreadsheet` |
| Slide | `application/vnd.google-apps.presentation` |
| PDF | `application/pdf` |
| Image | `image/png`, `image/jpeg` |

### Crear folder
```bash
curl -X POST https://www.googleapis.com/drive/v3/files \
  -d '{
    "name": "Sprint 42",
    "mimeType": "application/vnd.google-apps.folder",
    "parents": ["parent_folder_id"]
  }'
```

### Upload archivo
```bash
# Multipart upload para archivos pequeños (<5MB)
curl -X POST "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart" \
  -H "Authorization: Bearer $TOKEN" \
  -F "metadata={\"name\":\"archivo.pdf\", \"parents\":[\"folder_id\"]};type=application/json" \
  -F "file=@./archivo.pdf;type=application/pdf"
```

### Descargar archivo
```bash
curl "https://www.googleapis.com/drive/v3/files/$ID?alt=media" \
  -H "Authorization: Bearer $TOKEN" \
  -o archivo.pdf
```

Para Google Docs/Sheets/Slides, export:
```bash
# Doc → PDF
curl "https://www.googleapis.com/drive/v3/files/$ID/export?mimeType=application/pdf"

# Sheet → CSV
curl "https://www.googleapis.com/drive/v3/files/$ID/export?mimeType=text/csv"
```

### Compartir
```bash
curl -X POST https://www.googleapis.com/drive/v3/files/$ID/permissions \
  -d '{
    "role": "writer",
    "type": "user",
    "emailAddress": "user@example.com"
  }'
```

Roles: `owner`, `organizer`, `fileOrganizer`, `writer`, `commenter`, `reader`
Type: `user`, `group`, `domain`, `anyone`

### Mover archivo
```bash
# Cambiar parents
curl -X PATCH "https://www.googleapis.com/drive/v3/files/$ID?addParents=new&removeParents=old" \
  -d '{}'
```

## Comandos

### Organizar por sprint
```
/gdrive organize-sprint [folder_id]
```
Crea substructure:
```
Sprint 42/
├── Planning/
├── Standups/
├── Reviews/
└── Retros/
```

### Bulk rename
```
/gdrive bulk-rename [folder_id] [pattern]
```
Cambia nombres siguiendo un pattern (ej: agregar prefix fecha).

### Search & export
```
/gdrive search "query" [--export csv|json]
```

### Share folder con team
```
/gdrive share-folder <folder_id> <team_emails>
```

### Cleanup
```
/gdrive cleanup <folder_id>
```
Detecta:
- Archivos duplicados (mismo hash)
- Archivos sin modificar hace >6 meses
- Archivos compartidos con users que ya no están en la org

## Reglas

- **NUNCA eliminar archivos sin confirmación explícita del user**
- **Trash vs delete**: preferir trash (reversible). Permanent delete solo si user insiste.
- **Scopes mínimos**: `drive.file` para archivos creados por la app, `drive` para acceso total
- **Rate limit**: 1000 req/100s/user
- **Shared drives** (Team Drives) tienen API distinta — usar `supportsAllDrives=true` en queries
