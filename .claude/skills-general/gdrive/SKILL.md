---
name: gdrive
description: "Gestionar Google Drive: buscar, crear, mover, compartir archivos y carpetas via Drive API v3. Usar cuando el usuario mencione: Google Drive, Gdrive, archivo en Drive, carpeta, folder, compartir archivo, upload, download."
argument-hint: "[search|upload|move|share] [query or path]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Google Drive Manager — API v3

## Operaciones

| Operación | Método | Endpoint | Notas |
|-----------|--------|----------|-------|
| Buscar | GET | `/files?q=...` | Query: `name contains`, `mimeType =`, `parents in`, `modifiedTime >`, `owners in`. Combinar con `and`/`or`/`not` |
| Crear folder | POST | `/files` | mimeType `application/vnd.google-apps.folder`, parents array |
| Upload (<5MB) | POST | `/upload/drive/v3/files?uploadType=multipart` | Multipart: metadata JSON + file |
| Descargar | GET | `/files/$ID?alt=media` | Para Google Docs/Sheets: usar `/files/$ID/export?mimeType=...` |
| Compartir | POST | `/files/$ID/permissions` | Roles: owner/organizer/writer/commenter/reader. Types: user/group/domain/anyone |
| Mover | PATCH | `/files/$ID?addParents=new&removeParents=old` | |

### MIME types comunes

| Tipo | MIME |
|------|------|
| Folder | `application/vnd.google-apps.folder` |
| Doc/Sheet/Slide | `...document` / `...spreadsheet` / `...presentation` |
| PDF/Image | `application/pdf`, `image/png`, `image/jpeg` |

## Comandos

| Comando | Descripción |
|---------|-------------|
| `/gdrive organize-sprint [folder_id]` | Crea substructure: Planning/, Standups/, Reviews/, Retros/ |
| `/gdrive bulk-rename [folder_id] [pattern]` | Renombrar siguiendo pattern (e.g., prefix fecha) |
| `/gdrive search "query" [--export csv\|json]` | Buscar y exportar |
| `/gdrive share-folder <folder_id> <emails>` | Compartir con team |
| `/gdrive cleanup <folder_id>` | Detecta duplicados, archivos >6m sin modificar, shares con users fuera de org |

## Reglas

- NUNCA eliminar sin confirmación explícita
- Preferir trash (reversible) sobre permanent delete
- Scopes mínimos: `drive.file` para propios, `drive` para acceso total
- Rate limit: 1000 req/100s/user
- Shared drives: usar `supportsAllDrives=true` en queries
