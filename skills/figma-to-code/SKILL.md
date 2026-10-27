---
name: figma-to-code
description: "Convert Figma designs to production-ready code adapted to the project stack. Detects existing components and design tokens."
category: "design"
argument-hint: "[figma-url or node-id]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Figma to Code

Converts Figma designs into code adapted to the current project's stack.

## Input

The user provides:
1. **Figma URL** (required) — `figma.com/design/{fileKey}/{fileName}?node-id={nodeId}`
2. **What to implement** (optional) — a specific component, screen, section
3. **Stack override** (optional) — if they want something other than the project's stack

## Process

### 1. Parse the URL and get the design

Extract `fileKey` and `nodeId` from the URL:
- `figma.com/design/:fileKey/:fileName?node-id=:nodeId` → convert `-` to `:` in nodeId
- `figma.com/design/:fileKey/branch/:branchKey/:fileName` → use branchKey as the fileKey

Call `get_design_context` with fileKey and nodeId to get:
- Reference code (React+Tailwind by default)
- Screenshot of the design
- Contextual hints (Code Connect, tokens, annotations)

### 2. Detect the project's stack

Detect the project's framework (Next.js, React, Vue, Svelte, Flutter, SwiftUI, RN) and UI library (shadcn, MUI, Chakra, Tailwind, Styled Components).

> → Read references/stack-detection.md for detection tables and adaptation rules

### 3. Look for existing components

Before generating new code, search the project for:
- Reusable UI components that match the design
- Design tokens (colors, spacing, typography) already defined
- Existing layout patterns

```bash
# Find UI components
find src/components -name "*.tsx" -o -name "*.vue" -o -name "*.svelte" 2>/dev/null
```

### 4. Adapt the code to the stack

The output of `get_design_context` is reference React+Tailwind. Adapt it to the detected stack (shadcn, CSS Modules, Styled Components, Vue, Svelte, Flutter).

> → Read references/stack-detection.md for stack adaptation mapping table

### 5. Generate code

For each component/screen:

1. **Create the file(s)** following the project's convention
2. **Reuse** existing components wherever possible
3. **Map** colors/fonts to the project's tokens
4. **Responsive** — if the design has breakpoints, implement them
5. **Accessibility** — aria labels, semantic HTML, keyboard nav
6. **States** — hover, active, disabled, loading, empty, error

### 6. Post-generation checklist & Output

> → Read references/checklist-and-output.md for 7-item quality checklist and output template format

## Rules
- ALWAYS read the Figma design before generating code
- NEVER generate code without first looking for existing components in the project
- Prefer reuse over creating something new
- If the design uses components that do not exist → create them following the design system
- Responsive by default
- Accessibility by default
- Do not generate test files for UI components (unless asked)
- Code and code comments in English (or the project's existing convention)
