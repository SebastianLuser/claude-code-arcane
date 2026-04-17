---
name: figma
description: "Gestionar Figma: inspeccionar diseños, exportar assets, extraer styles/components via MCP Figma nativo. Usar cuando el usuario mencione: Figma, diseño, inspeccionar frame, exportar iconos, components, styles, handoff."
argument-hint: "[inspect|export|tokens] [node-id or url]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Figma Manager

Integra con Figma via MCP nativo o REST API.

## Vía MCP

Tools: `mcp__figma__authenticate`, `mcp__figma__complete_authentication`
Una vez autenticado, MCP expone operations. Revisá `mcp__figma__*` en contexto.

## Vía REST API

```bash
curl "https://api.figma.com/v1/files/$FILE_KEY" \
  -H "X-Figma-Token: $FIGMA_TOKEN"
```

Obtener FILE_KEY del URL: `https://www.figma.com/file/<FILE_KEY>/name?node-id=123-456`
Node IDs en URL están con `-`, en API usar `:` (ej: `123:456`).

## Operaciones Clave

### File tree completo
```bash
GET /v1/files/$FILE_KEY
```
Devuelve estructura completa (puede ser huge).

### Nodos específicos
```bash
GET /v1/files/$FILE_KEY/nodes?ids=123:456,789:012
```
Mucho más eficiente que todo el file.

### Exportar imágenes
```bash
GET /v1/files/$FILE_KEY/images?ids=123:456&format=svg&scale=1
```
Formats: `png`, `jpg`, `svg`, `pdf`
Scale: 1-4 (para PNG)

Response tiene URLs temporales (expiran en ~1h). Descargar inmediatamente.

### Styles globales
```bash
GET /v1/files/$FILE_KEY/styles
```
Colores, text styles, effects, grids publicados en el file.

### Components publicados
```bash
GET /v1/files/$FILE_KEY/components
GET /v1/files/$FILE_KEY/component_sets
```

### Variables (design tokens)
```bash
GET /v1/files/$FILE_KEY/variables/local
```
Figma Variables = design tokens nativos (primitives, aliases, modes).

## Comandos

### Inspect frame
```
/figma inspect <figma_url>
```

Flujo:
1. Parsear URL → file_key + node_id
2. GET nodos → estructura
3. Extraer:
   - Dimensions (w × h)
   - Position (x, y)
   - Fills, strokes, effects
   - Text properties (font, size, weight, color, alignment)
   - Auto-layout rules
   - Children hierarchy
4. Output estructurado

### Export assets
```
/figma export <figma_url> [--format svg|png] [--scale 2]
```

Para bulk (todos los frames con prefix "icon/"):
1. Buscar nodos matching pattern
2. Bulk export
3. Descargar a `assets/icons/`
4. Nombrar kebab-case desde el node name

### Extract tokens
```
/figma tokens <figma_url> [--output css|tailwind|json]
```

Ver `/figma-tokens` para detalle completo.

### Component spec
```
/figma component <figma_url>
```

Genera spec completo del component:
- Variants (property variants)
- States (default, hover, active, disabled)
- Tokens usados
- Anatomy con measurements
- Props/API sugeridos

## Reglas

- **Rate limit**: 2 req/s por token (strict)
- **Response size**: archivos grandes pueden dar 30MB+ de JSON — usar `/nodes?ids=` selectivo
- **URLs exportadas expiran**: descargar inmediatamente después del GET
- **Plugin API vs REST API**: REST es read-only. Plugins (JavaScript en Figma) pueden modificar.
- **Tokens vs Styles**: si el file usa Figma Variables, usar esos. Si no, fallback a Styles.
