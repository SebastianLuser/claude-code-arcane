---
name: figma
description: "Figma manager: inspect designs, export assets, extract styles/components via MCP or REST API."
category: "design"
argument-hint: "[inspect|export|tokens] [node-id or url]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Figma Manager

Integrates with Figma via the native MCP or the REST API.

## Via MCP

Tools: `mcp__figma__authenticate`, `mcp__figma__complete_authentication`
Once authenticated, the MCP exposes operations. Check `mcp__figma__*` in context.

## Via REST API

```bash
curl "https://api.figma.com/v1/files/$FILE_KEY" \
  -H "X-Figma-Token: $FIGMA_TOKEN"
```

Get FILE_KEY from the URL: `https://www.figma.com/file/<FILE_KEY>/name?node-id=123-456`
Node IDs in the URL use `-`; in the API use `:` (e.g.: `123:456`).

## Key Operations

### Full file tree
```bash
GET /v1/files/$FILE_KEY
```
Returns the full structure (can be huge).

### Specific nodes
```bash
GET /v1/files/$FILE_KEY/nodes?ids=123:456,789:012
```
Much more efficient than the whole file.

### Export images
```bash
GET /v1/files/$FILE_KEY/images?ids=123:456&format=svg&scale=1
```
Formats: `png`, `jpg`, `svg`, `pdf`
Scale: 1-4 (for PNG)

The response has temporary URLs (they expire in ~1h). Download immediately.

### Global styles
```bash
GET /v1/files/$FILE_KEY/styles
```
Colors, text styles, effects, grids published in the file.

### Published components
```bash
GET /v1/files/$FILE_KEY/components
GET /v1/files/$FILE_KEY/component_sets
```

### Variables (design tokens)
```bash
GET /v1/files/$FILE_KEY/variables/local
```
Figma Variables = native design tokens (primitives, aliases, modes).

## Commands

### Inspect frame
```
/figma inspect <figma_url>
```

Flow:
1. Parse URL → file_key + node_id
2. GET nodes → structure
3. Extract:
   - Dimensions (w × h)
   - Position (x, y)
   - Fills, strokes, effects
   - Text properties (font, size, weight, color, alignment)
   - Auto-layout rules
   - Children hierarchy
4. Structured output

### Export assets
```
/figma export <figma_url> [--format svg|png] [--scale 2]
```

For bulk (every frame with the "icon/" prefix):
1. Find nodes matching the pattern
2. Bulk export
3. Download to `assets/icons/`
4. Name them kebab-case from the node name

### Extract tokens
```
/figma tokens <figma_url> [--output css|tailwind|json]
```

See `/figma-tokens` for full detail.

### Component spec
```
/figma component <figma_url>
```

Generates a full component spec:
- Variants (property variants)
- States (default, hover, active, disabled)
- Tokens used
- Anatomy with measurements
- Suggested props/API

## Rules

- **Rate limit**: 2 req/s per token (strict)
- **Response size**: large files can return 30MB+ of JSON — use selective `/nodes?ids=`
- **Exported URLs expire**: download immediately after the GET
- **Plugin API vs REST API**: REST is read-only. Plugins (JavaScript in Figma) can modify.
- **Tokens vs Styles**: if the file uses Figma Variables, use those. If not, fall back to Styles.
