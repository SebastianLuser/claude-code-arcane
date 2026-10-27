---
name: gdrive
description: "Manage Google Drive via Drive API v3: search, create, move, share files and folders."
category: "integrations"
argument-hint: "[search|upload|move|share] [query or path]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Google Drive Manager — API v3

## Operations

| Operation | Method | Endpoint | Notes |
|-----------|--------|----------|-------|
| Search | GET | `/files?q=...` | Query: `name contains`, `mimeType =`, `parents in`, `modifiedTime >`, `owners in`. Combine with `and`/`or`/`not` |
| Create folder | POST | `/files` | mimeType `application/vnd.google-apps.folder`, parents array |
| Upload (<5MB) | POST | `/upload/drive/v3/files?uploadType=multipart` | Multipart: metadata JSON + file |
| Download | GET | `/files/$ID?alt=media` | For Google Docs/Sheets: use `/files/$ID/export?mimeType=...` |
| Share | POST | `/files/$ID/permissions` | Roles: owner/organizer/writer/commenter/reader. Types: user/group/domain/anyone |
| Move | PATCH | `/files/$ID?addParents=new&removeParents=old` | |

### Common MIME types

| Type | MIME |
|------|------|
| Folder | `application/vnd.google-apps.folder` |
| Doc/Sheet/Slide | `...document` / `...spreadsheet` / `...presentation` |
| PDF/Image | `application/pdf`, `image/png`, `image/jpeg` |

## Commands

| Command | Description |
|---------|-------------|
| `/gdrive organize-sprint [folder_id]` | Creates the substructure: Planning/, Standups/, Reviews/, Retros/ |
| `/gdrive bulk-rename [folder_id] [pattern]` | Rename following a pattern (e.g., date prefix) |
| `/gdrive search "query" [--export csv\|json]` | Search and export |
| `/gdrive share-folder <folder_id> <emails>` | Share with the team |
| `/gdrive cleanup <folder_id>` | Detects duplicates, files unmodified for >6m, shares with users outside the org |

## Rules

- NEVER delete without explicit confirmation
- Prefer trash (reversible) over permanent delete
- Minimal scopes: `drive.file` for your own files, `drive` for full access
- Rate limit: 1000 req/100s/user
- Shared drives: use `supportsAllDrives=true` in queries
