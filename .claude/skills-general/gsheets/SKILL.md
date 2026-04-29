---
name: gsheets
description: "Manage Google Sheets via Sheets API v4: read/write cells, ranges, formulas, formatting."
category: "integrations"
argument-hint: "[read|write|create] [sheet-id or range]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Google Sheets Manager

Sheets API v4. Auth: mismo setup que gdocs. Scope: `spreadsheets` (read/write).

## Operaciones

| Operación | Método | Endpoint | Notas |
|-----------|--------|----------|-------|
| Crear | POST | `/spreadsheets` | properties.title, sheets array |
| Leer rango | GET | `/spreadsheets/$ID/values/Sheet!A1:D100` | |
| Escribir | PUT | `/spreadsheets/$ID/values/Range?valueInputOption=X` | RAW (literal) o USER_ENTERED (parsea fórmulas) |
| Append | POST | `/spreadsheets/$ID/values/Range:append` | Agrega filas al final |
| Batch update | POST | `/spreadsheets/$ID/values:batchUpdate` | Múltiples rangos en un request |
| Formato | POST | `/spreadsheets/$ID:batchUpdate` | repeatCell con userEnteredFormat |

## Comandos

| Comando | Descripción |
|---------|-------------|
| `/gsheets export <source> [sheet_id]` | CSV/query/JSON/output → Sheet (crea si no hay ID, headers+data, formato, freeze, auto-resize) |
| `/gsheets import <sheet_id> [--range]` | → JSON array, CSV, o tabla markdown |
| `/gsheets report <template_id> [vars]` | Copia template, llena datos, comparte |
| `/gsheets dashboard <data_source>` | Tab "Data" + Tab "Dashboard" (pivots, charts, KPIs) |

## Fórmulas Útiles

- `QUERY()` — SQL-like sobre rangos
- `IMPORTRANGE()` — cross-sheet data
- `SPARKLINE()` — mini chart inline
- `VLOOKUP()` / `ARRAYFORMULA()` — lookup y aplicar a rango

## Reglas

- A1 notation por default (más legible que R1C1)
- Rate limit: 300 req/min/user — batch siempre que puedas
- Max 10M celdas por spreadsheet
- Sheet IDs (gid numérico) vs sheet names para updates cell-level
- Fechas son números serial desde 1899-12-30 — cuidado al parsear
