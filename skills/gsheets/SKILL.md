---
name: gsheets
description: "Manage Google Sheets via Sheets API v4: read/write cells, ranges, formulas, formatting."
category: "integrations"
argument-hint: "[read|write|create] [sheet-id or range]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Google Sheets Manager

Sheets API v4. Auth: same setup as gdocs. Scope: `spreadsheets` (read/write).

## Operations

| Operation | Method | Endpoint | Notes |
|-----------|--------|----------|-------|
| Create | POST | `/spreadsheets` | properties.title, sheets array |
| Read range | GET | `/spreadsheets/$ID/values/Sheet!A1:D100` | |
| Write | PUT | `/spreadsheets/$ID/values/Range?valueInputOption=X` | RAW (literal) or USER_ENTERED (parses formulas) |
| Append | POST | `/spreadsheets/$ID/values/Range:append` | Appends rows at the end |
| Batch update | POST | `/spreadsheets/$ID/values:batchUpdate` | Multiple ranges in one request |
| Format | POST | `/spreadsheets/$ID:batchUpdate` | repeatCell with userEnteredFormat |

## Commands

| Command | Description |
|---------|-------------|
| `/gsheets export <source> [sheet_id]` | CSV/query/JSON/output → Sheet (creates one if there is no ID, headers+data, format, freeze, auto-resize) |
| `/gsheets import <sheet_id> [--range]` | → JSON array, CSV, or markdown table |
| `/gsheets report <template_id> [vars]` | Copies the template, fills in data, shares |
| `/gsheets dashboard <data_source>` | Tab "Data" + Tab "Dashboard" (pivots, charts, KPIs) |

## Useful Formulas

- `QUERY()` — SQL-like over ranges
- `IMPORTRANGE()` — cross-sheet data
- `SPARKLINE()` — mini chart inline
- `VLOOKUP()` / `ARRAYFORMULA()` — lookup and apply to a range

## Rules

- A1 notation by default (more readable than R1C1)
- Rate limit: 300 req/min/user — batch whenever you can
- Max 10M cells per spreadsheet
- Sheet IDs (numeric gid) vs sheet names for cell-level updates
- Dates are serial numbers since 1899-12-30 — careful when parsing
