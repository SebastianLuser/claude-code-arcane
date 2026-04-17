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

### 1. Figma Variables (moderna, preferida)
Primitives, aliases, modes (ej: light/dark).
```bash
GET /v1/files/$KEY/variables/local
```

### 2. Figma Styles (legacy pero común)
Color styles, text styles, effect styles.
```bash
GET /v1/files/$KEY/styles
```

## Token Categories

### Colors
```json
{
  "color": {
    "primary": {
      "500": { "value": "#3B82F6", "type": "color" }
    },
    "neutral": {
      "100": { "value": "#F3F4F6", "type": "color" }
    }
  }
}
```

### Typography
```json
{
  "typography": {
    "heading-lg": {
      "value": {
        "fontFamily": "Inter",
        "fontWeight": 700,
        "fontSize": "32px",
        "lineHeight": "40px",
        "letterSpacing": "-0.02em"
      }
    }
  }
}
```

### Spacing
```json
{
  "spacing": {
    "1": "4px", "2": "8px", "3": "12px", "4": "16px", "6": "24px", "8": "32px"
  }
}
```

### Border radius
```json
{
  "radius": { "sm": "4px", "md": "8px", "lg": "12px", "full": "9999px" }
}
```

### Shadows
```json
{
  "shadow": {
    "sm": "0 1px 2px rgba(0,0,0,0.05)",
    "md": "0 4px 6px rgba(0,0,0,0.1)"
  }
}
```

## Output Formats

### CSS Variables
```css
:root {
  --color-primary-500: #3B82F6;
  --color-neutral-100: #F3F4F6;
  --spacing-4: 16px;
  --radius-md: 8px;
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}

[data-theme="dark"] {
  --color-primary-500: #60A5FA;
  --color-neutral-100: #1F2937;
}
```

### Tailwind Config
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { 500: '#3B82F6', /* ... */ },
        neutral: { 100: '#F3F4F6', /* ... */ },
      },
      spacing: { '1': '4px', '2': '8px', /* ... */ },
      borderRadius: { sm: '4px', md: '8px', lg: '12px' },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
      },
    }
  }
}
```

### Style Dictionary (multi-platform)
```json
{
  "color": {
    "primary": {
      "500": { "value": "#3B82F6" }
    }
  }
}
```
Con transforms genera para iOS (Swift), Android (XML), Web (CSS).

### SwiftUI
```swift
extension Color {
  static let primary500 = Color(hex: "#3B82F6")
  static let neutral100 = Color(hex: "#F3F4F6")
}
```

### Flutter (Dart)
```dart
class AppColors {
  static const primary500 = Color(0xFF3B82F6);
  static const neutral100 = Color(0xFFF3F4F6);
}
```

## Comando

```
/figma-tokens <figma_url> [--output css|tailwind|json|style-dictionary|swift|flutter]
```

Flujo:
1. Pedí formato target (default: Tailwind para web, JSON para multi-platform)
2. Extraer variables de Figma
3. Categorizar (color/typography/spacing/etc.)
4. Generar output file
5. Preguntá ubicación (default según stack):
   - Next.js/React → `tailwind.config.ts`
   - Vue → `src/styles/tokens.css`
   - Swift → `Sources/DesignSystem/Tokens.swift`
   - Flutter → `lib/design/tokens.dart`

## Naming Conventions

Figma (habitual):
- `Primary/500` → `primary-500`
- `Neutral/Text/Primary` → `neutral-text-primary`
- `Heading/H1` → `heading-h1`

Convertir a formato del stack:
- CSS: `--color-primary-500` (kebab-case)
- Tailwind: `primary.500` (nested)
- Swift: `primary500` (camelCase, sin separador)
- Tailwind arbitrary: `bg-primary-500/[var(--color-primary-500)]`

## Reglas

- **Preservar modes** (light/dark) si existen en Figma
- **Aliases semánticos** > primitives: exportar ambos pero priorizar aliases en uso
  - `--color-text-primary: var(--color-neutral-900)` (alias)
  - `--color-neutral-900: #111827` (primitive)
- **Validar coherencia**: si un alias no tiene valor, flaggearlo
- **Versionar tokens**: git commit cada vez que se regeneran
