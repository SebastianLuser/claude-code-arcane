---
name: figma-to-code
description: "Convert Figma designs to production-ready code adapted to the project stack. Detects existing components and design tokens."
category: "design"
argument-hint: "[figma-url or node-id]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Figma to Code

Convierte diseños de Figma en código adaptado al stack del proyecto actual.

## Input

El usuario proporciona:
1. **URL de Figma** (obligatorio) — `figma.com/design/{fileKey}/{fileName}?node-id={nodeId}`
2. **Qué implementar** (opcional) — componente específico, pantalla, sección
3. **Stack override** (opcional) — si quiere algo distinto al stack del proyecto

## Process

### 1. Parsear URL y obtener diseño

Extraer `fileKey` y `nodeId` de la URL:
- `figma.com/design/:fileKey/:fileName?node-id=:nodeId` → convertir `-` a `:` en nodeId
- `figma.com/design/:fileKey/branch/:branchKey/:fileName` → usar branchKey como fileKey

Llamar a `get_design_context` con fileKey y nodeId para obtener:
- Código de referencia (React+Tailwind por default)
- Screenshot del diseño
- Hints contextuales (Code Connect, tokens, annotations)

### 2. Detectar stack del proyecto

Detectar framework (Next.js, React, Vue, Svelte, Flutter, SwiftUI, RN) y UI library (shadcn, MUI, Chakra, Tailwind, Styled Components) del proyecto.

> → Read references/stack-detection.md for detection tables and adaptation rules

### 3. Buscar componentes existentes

Antes de generar código nuevo, buscar en el proyecto:
- Componentes UI reutilizables que matcheen con el diseño
- Tokens de diseño (colores, spacing, typography) ya definidos
- Patrones de layout existentes

```bash
# Buscar componentes UI
find src/components -name "*.tsx" -o -name "*.vue" -o -name "*.svelte" 2>/dev/null
```

### 4. Adaptar código al stack

El output de `get_design_context` es React+Tailwind de referencia. Adaptar al stack detectado (shadcn, CSS Modules, Styled Components, Vue, Svelte, Flutter).

> → Read references/stack-detection.md for stack adaptation mapping table

### 5. Generar código

Para cada componente/pantalla:

1. **Crear archivo(s)** siguiendo la convención del proyecto
2. **Reutilizar** componentes existentes donde sea posible
3. **Mapear** colores/fonts a tokens del proyecto
4. **Responsive** — si el diseño tiene breakpoints, implementarlos
5. **Accesibilidad** — aria labels, semantic HTML, keyboard nav
6. **Estados** — hover, active, disabled, loading, empty, error

### 6. Checklist post-generación & Output

> → Read references/checklist-and-output.md for 7-item quality checklist and output template format

## Rules
- SIEMPRE leer el diseño de Figma antes de generar código
- NUNCA generar código sin antes buscar componentes existentes en el proyecto
- Preferir reutilización sobre creación nueva
- Si el diseño usa componentes que no existen → crearlos siguiendo el design system
- Responsive por default
- Accesibilidad por default
- No generar archivos de test para componentes UI (a menos que se pida)
- En español para comentarios, en inglés para código
