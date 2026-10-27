---
name: figma-tokens
description: "Extract Figma design tokens and generate consumable formats: CSS variables, Tailwind config, JSON, Style Dictionary, Swift, Flutter."
category: "design"
argument-hint: "[output-format: css|tailwind|json|style-dict]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Figma Tokens → Code

Extracts tokens from Figma and converts them into formats the stack can use.

## Sources in Figma

| Source | API | Notes |
|--------|-----|-------|
| **Variables** (modern, preferred) | `GET /v1/files/$KEY/variables/local` | Primitives, aliases, modes (light/dark) |
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

## Command

`/figma-tokens <figma_url> [--output css|tailwind|json|style-dictionary|swift|flutter]`

Flow: ask for the format (default: Tailwind for web, JSON for multi-platform) → extract variables → categorize → generate output → ask for the location (Next.js→`tailwind.config.ts`, Vue→`src/styles/tokens.css`, Swift→`Sources/DesignSystem/Tokens.swift`, Flutter→`lib/design/tokens.dart`).

## Naming Conventions

Figma `Primary/500` → `primary-500`. Convert: CSS kebab-case (`--color-primary-500`), Tailwind nested (`primary.500`), Swift camelCase (`primary500`).

## Rules

- Preserve modes (light/dark) if they exist in Figma
- Semantic aliases > primitives: export both, prefer aliases in usage
- Validate consistency: alias without a value → flag it
- Version the tokens: git commit every regeneration
