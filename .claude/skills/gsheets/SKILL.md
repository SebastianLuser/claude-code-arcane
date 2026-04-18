---
name: gsheets
description: "Gestionar Google Sheets: leer/escribir celdas, rangos, fórmulas, formatos via Sheets API v4. Usar cuando el usuario mencione: Google Sheets, Gsheets, spreadsheet de Google, planilla, hoja de cálculo, export a Sheets, import de Sheets."
argument-hint: "[read|write|create] [sheet-id or range]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Google Sheets Manager

Interactúa con Google Sheets via Sheets API v4.

## Auth

Mismo setup que gdocs. Scopes:
- `https://www.googleapis.com/auth/spreadsheets` (read/write)

## Operaciones Clave

### Crear spreadsheet
```bash
curl -X POST https://sheets.googleapis.com/v4/spreadsheets \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "properties": {"title": "Reporte Q2"},
    "sheets": [{"properties": {"title": "Data"}}]
  }'
```

### Leer rango
```bash
curl "https://sheets.googleapis.com/v4/spreadsheets/$ID/values/Data!A1:D100" \
  -H "Authorization: Bearer $TOKEN"
```

### Escribir valores
```bash
curl -X PUT "https://sheets.googleapis.com/v4/spreadsheets/$ID/values/Data!A1:D2?valueInputOption=USER_ENTERED" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "values": [
      ["Name", "Email", "Age", "Active"],
      ["Alice", "a@x.com", 30, true]
    ]
  }'
```

`valueInputOption`:
- `RAW` — valor literal (no parsea fórmulas)
- `USER_ENTERED` — parsea fórmulas, fechas, números

### Append
```bash
curl -X POST "https://sheets.googleapis.com/v4/spreadsheets/$ID/values/Data!A:D:append?valueInputOption=USER_ENTERED" \
  -d '{"values": [["Bob", "b@x.com", 25, true]]}'
```

### Batch operations
```bash
curl -X POST "https://sheets.googleapis.com/v4/spreadsheets/$ID/values:batchUpdate" \
  -d '{
    "valueInputOption": "USER_ENTERED",
    "data": [
      {"range": "Sheet1!A1", "values": [["Hello"]]},
      {"range": "Sheet2!B5:C6", "values": [[1,2],[3,4]]}
    ]
  }'
```

### Formatting (spreadsheets:batchUpdate)
```json
{
  "requests": [
    {"repeatCell": {
      "range": {"sheetId": 0, "startRowIndex": 0, "endRowIndex": 1},
      "cell": {"userEnteredFormat": {"textFormat": {"bold": true}, "backgroundColor": {"red": 0.9, "green": 0.9, "blue": 0.9}}},
      "fields": "userEnteredFormat(textFormat,backgroundColor)"
    }}
  ]
}
```

## Comandos

### Export data a Sheet
```
/gsheets export <source> [sheet_id]
```

Sources posibles:
- CSV file local
- Query result (de DB)
- JSON array
- Salida de otro comando

Flujo:
1. Si no hay sheet_id → crear uno nuevo
2. Escribir headers + data
3. Aplicar formato a header row
4. Freeze header row
5. Auto-resize columns
6. Devolver URL

### Import de Sheet
```
/gsheets import <sheet_id> [--range A1:D100]
```

Output en formatos:
- JSON array de objects (usando primera fila como keys)
- CSV
- Tabla markdown

### Reporte desde template
```
/gsheets report <template_id> [vars]
```

Copia template, llena datos, comparte.

### Dashboard
```
/gsheets dashboard <data_source>
```

Crea sheet con:
- Tab "Data" con raw data
- Tab "Dashboard" con pivot tables, charts, KPIs

## Fórmulas Útiles

- `=QUERY(Data!A:D, "SELECT B, SUM(D) WHERE C > 0 GROUP BY B")` — SQL-like
- `=IMPORTRANGE("sheet_url", "Sheet1!A:B")` — cross-sheet data
- `=SPARKLINE(Data!A2:A30)` — mini chart inline
- `=VLOOKUP(A2, Lookup!A:B, 2, false)` — lookup tradicional
- `=ARRAYFORMULA(...)` — aplicar a rango completo

## Reglas

- **A1 notation** vs R1C1 — la API usa A1 por default, más legible
- **Rate limit**: 300 req/min/user — batch siempre que puedas
- **Tamaño**: max 10M celdas por spreadsheet
- **Sheet IDs (gid)** vs sheet names: los updates cell-level usan gid numérico
- **Fechas** en Sheets son números serial desde 1899-12-30 — cuidado al parsear
