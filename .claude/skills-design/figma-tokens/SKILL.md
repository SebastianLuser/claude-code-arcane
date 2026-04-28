---
name: figma-tokens
description: "Extraer design tokens de Figma y generarlos en formatos consumibles (CSS variables, Tailwind config, JSON, Style Dictionary). Usar cuando el usuario mencione: design tokens, variables de diseño, Figma tokens, CSS variables, Tailwind config, style dictionary."
argument-hint: "[output-format: css|tailwind|json|style-dict]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Figma Tokens → Code

Extrae tokens desde Figma y los convierte a formatos usables por el stack.

## Fuentes en Figma

| Fuente | API | Notas |
|--------|-----|-------|
| **Variables** (moderna, preferida) | `GET /v1/files/$KEY/variables/local` | Primitives, aliases, modes (light/dark) |
| **Styles** (legacy) | `GET /v1/files/$KEY/styles` | Color, text, effect styles |

## Token Categories

| Category | Structure |
|----------|-----------|
| **Colors** | Nested by scale: `color.primary.500: "#3B82F6"` |
| **Typography** | Composite: fontFamily, fontWeight, fontSize, lineHeight, letterSpacing |
| **Spacing** | Scale: `1: 4px, 2: 8px, 3: 12px, 4: 16px, 6: 24px, 8: 32px` |
| **Border radius** | `sm: 4px, md: 8px, lg: 12px, full: 9999px` |
| **Shadows** | CSS shadow strings: `0 4px 6px rgba(0,0,0,0.1)` |

## Output Formats

| Format | Target | Naming |
|--------|--------|--------|
| **CSS Variables** | `:root { --color-primary-500: ... }` + `[data-theme="dark"]` | kebab-case |
| **Tailwind Config** | `theme.extend.colors/spacing/borderRadius/boxShadow` | nested dot |
| **Style Dictionary** | Multi-platform (iOS Swift, Android XML, Web CSS) | per-platform |
| **SwiftUI** | `extension Color { static let primary500 = ... }` | camelCase |
| **Flutter (Dart)** | `class AppColors { static const primary500 = Color(0xFF...) }` | camelCase |

## Comando

`/figma-tokens <figma_url> [--output css|tailwind|json|style-dictionary|swift|flutter]`

Flujo: pedir formato (default: Tailwind web, JSON multi-platform) → extraer variables → categorizar → generar output → preguntar ubicación (Next.js→`tailwind.config.ts`, Vue→`src/styles/tokens.css`, Swift→`Sources/DesignSystem/Tokens.swift`, Flutter→`lib/design/tokens.dart`).

## Naming Conventions

Figma `Primary/500` → `primary-500`. Convertir: CSS kebab-case (`--color-primary-500`), Tailwind nested (`primary.500`), Swift camelCase (`primary500`).

## Reglas

- Preservar modes (light/dark) si existen en Figma
- Aliases semánticos > primitives: exportar ambos, priorizar aliases en uso
- Validar coherencia: alias sin valor → flaggear
- Versionar tokens: git commit cada regeneración
