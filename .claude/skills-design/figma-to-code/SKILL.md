---
name: figma-to-code
description: "Convierte diseños de Figma a código adaptado al stack del proyecto. Detecta componentes existentes, tokens de diseño, y genera código production-ready. Usar cuando se mencione: Figma, diseño a código, implementar diseño, figma to code, maquetear."
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

Buscar en el directorio actual:
| Archivo | Stack |
|---------|-------|
| `package.json` con `next` | Next.js |
| `package.json` con `react` | React |
| `package.json` con `vue` | Vue |
| `package.json` con `svelte` | Svelte |
| `pubspec.yaml` | Flutter |
| `*.swift` + `Package.swift` | SwiftUI |
| `package.json` con `react-native` | React Native |

Detectar UI library:
| Indicador | Library |
|-----------|---------|
| `@shadcn/ui` o `components/ui/` | shadcn/ui |
| `@mui/material` | Material UI |
| `@chakra-ui` | Chakra UI |
| `tailwindcss` | Tailwind CSS |
| `styled-components` | Styled Components |

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

El output de `get_design_context` es React+Tailwind de referencia. Adaptar:

| Si el proyecto usa | Adaptar a |
|--------------------|-----------|
| shadcn/ui | Usar `<Button>`, `<Card>`, `<Input>` etc. del proyecto |
| CSS Modules | Convertir Tailwind a CSS Modules |
| Styled Components | Convertir a styled() |
| Vue | Convertir JSX a `<template>` + `<script setup>` |
| Svelte | Convertir a `.svelte` components |
| Flutter | Convertir a Widgets |

### 5. Generar código

Para cada componente/pantalla:

1. **Crear archivo(s)** siguiendo la convención del proyecto
2. **Reutilizar** componentes existentes donde sea posible
3. **Mapear** colores/fonts a tokens del proyecto
4. **Responsive** — si el diseño tiene breakpoints, implementarlos
5. **Accesibilidad** — aria labels, semantic HTML, keyboard nav
6. **Estados** — hover, active, disabled, loading, empty, error

### 6. Checklist post-generación

- [ ] Usa componentes existentes del proyecto (no reinventa)
- [ ] Tokens de color mapeados a variables del proyecto
- [ ] Typography consistente con el design system
- [ ] Responsive en los breakpoints del proyecto
- [ ] Sin valores hardcodeados (usa tokens/variables)
- [ ] Accesible (semantic HTML, aria labels)
- [ ] Estados de interacción implementados

## Output

```markdown
## Componentes generados

| Archivo | Qué es | Componentes reutilizados |
|---------|--------|------------------------|
| `src/components/FeatureName.tsx` | Componente principal | Button, Card |

## Tokens mapeados
| Figma | Proyecto |
|-------|---------|
| #3B82F6 | `--color-primary` / `text-blue-500` |

## Decisiones tomadas
- [Decisión 1: por qué se usó X en vez de Y]

## TODOs
- [ ] [Algo que necesita input del diseñador/usuario]
```

## Rules
- SIEMPRE leer el diseño de Figma antes de generar código
- NUNCA generar código sin antes buscar componentes existentes en el proyecto
- Preferir reutilización sobre creación nueva
- Si el diseño usa componentes que no existen → crearlos siguiendo el design system
- Responsive por default
- Accesibilidad por default
- No generar archivos de test para componentes UI (a menos que se pida)
- En español para comentarios, en inglés para código
