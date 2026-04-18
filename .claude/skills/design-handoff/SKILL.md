---
name: design-handoff
description: "Convertir un diseño de Figma en spec técnica + ticket en ClickUp/Jira + component code stub. Workflow cross-tool de design handoff. Usar cuando el usuario mencione: design handoff, pasar de Figma a dev, implementar diseño, spec de componente, handoff a desarrollo."
argument-hint: "[figma-node-id or url]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Design Handoff Workflow

Transforma un diseño de Figma en artefactos completos de desarrollo: spec doc, ticket, y code stub.

## Flujo

```
Figma URL
    ↓
[1. Inspeccionar design]
    ↓
[2. Generar spec estructurado]
    ↓
[3. Crear ticket con spec embebido]
    ↓
[4. Generar component code stub]
    ↓
[5. Linkear todo]
```

## Comando

```
/design-handoff <figma_url> [--target clickup|jira] [--stack react|vue|flutter]
```

## Paso a Paso

### 1. Inspeccionar Figma

Usa `figma` skill:
- GET node data
- Extraer dimensions, layout, states, interactions
- Identificar tokens usados
- Listar assets a exportar

### 2. Generar Spec

Documento estructurado:
```markdown
# Component Spec: [Nombre]

**Figma:** [URL exacto]
**Designer:** [nombre si disponible en Figma]
**Status:** Ready for dev

## Purpose
[1-2 oraciones: qué hace, por qué existe]

## Anatomy
```
[Pseudo-component tree]
<Card>
  <Header>
    <Avatar />
    <Title />
    <Meta />
  </Header>
  <Body>...</Body>
  <Footer>
    <Button variant="primary">Action</Button>
  </Footer>
</Card>
```

## Variants
| Variant | Description | Props |
|---------|-------------|-------|
| default | Card estándar | — |
| compact | Sin footer | hideFooter: true |
| featured | Con highlight | featured: true |

## States
| State | Description | Trigger |
|-------|-------------|---------|
| default | Idle | — |
| hover | Mouse over | :hover |
| active | Click/tap | :active |
| loading | Fetching data | isLoading prop |
| error | Error state | error prop |
| empty | Sin data | empty prop |

## Design Tokens
- Colors: `color-surface-primary`, `color-text-heading`, `color-border-subtle`
- Typography: `text-heading-md`, `text-body`, `text-caption`
- Spacing: `spacing-2`, `spacing-4`, `spacing-6`
- Radius: `radius-lg`
- Shadow: `shadow-md`

## Measurements
| Element | Dimension |
|---------|-----------|
| Card width | 360px min, 480px max |
| Header height | 64px |
| Avatar size | 40×40px |
| Padding | 24px |
| Gap between sections | 16px |

## Interactions
- **Click on card:** → navigate to detail
- **Click on button:** → async action, show loading state
- **Hover:** → elevation increase (shadow-md → shadow-lg)

## Responsive
- **Desktop (>=1024px):** horizontal layout
- **Tablet (768-1023px):** stacked, full-width
- **Mobile (<768px):** stacked, edge-to-edge

## Accessibility
- Focus visible on all interactive elements
- ARIA labels on buttons
- Keyboard navigation (Tab, Enter)
- Minimum color contrast 4.5:1
- Text alternative for avatar

## Assets to Export
- `icon-arrow-right.svg` → `assets/icons/`
- `placeholder-avatar.png` → `assets/images/`
```

### 3. Crear Ticket

#### En ClickUp
```
POST mcp__clickup__createTask
{
  "list_id": "...",
  "name": "[Component] Implementar Card component",
  "description": "[spec completo embedido]",
  "priority": 3,
  "tags": ["frontend", "component", "design-ready"]
}
```

#### En Jira
```
POST /rest/api/3/issue
{
  "fields": {
    "project": {"key": "TUNI"},
    "summary": "[Component] Implementar Card component",
    "description": {...}, // ADF
    "issuetype": {"name": "Task"},
    "labels": ["frontend", "component"]
  }
}
```

### 4. Generar Code Stub

#### React + TypeScript
```typescript
// src/components/Card/Card.tsx
import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

export interface CardProps {
  variant?: 'default' | 'compact' | 'featured';
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  error?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  title,
  subtitle,
  isLoading,
  error,
  onAction,
  children,
}) => {
  if (isLoading) return <CardSkeleton />;
  if (error) return <CardError message={error} />;

  return (
    <article className={clsx(styles.card, styles[variant])}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.meta}>{subtitle}</p>}
      </header>
      <div className={styles.body}>{children}</div>
      {variant !== 'compact' && onAction && (
        <footer className={styles.footer}>
          <button onClick={onAction} className={styles.button}>
            Action
          </button>
        </footer>
      )}
    </article>
  );
};
```

```css
/* src/components/Card/Card.module.css */
.card {
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  /* ... */
}
```

#### Asset export
```bash
/figma export <url> --format svg --output assets/icons/
```

### 5. Linkear Todo

En el ticket creado, actualizar description con:
- Link al spec doc
- Link al Figma
- Link al PR cuando exista (via commit reference)

## Config

`.claude/config/design-handoff.yml`:
```yaml
default_target: clickup
default_list_id: "..."

stack: react
components_dir: "src/components"
assets_dir: "assets"

designers:
  - figma_email: designer@company.com
    clickup_id: "..."
    jira_email: designer@educabot.com
```

## Reglas

- **Spec embebido en ticket** — el dev no tiene que abrir 3 tabs
- **Assets exportados al repo** inmediatamente, no quedan en Figma
- **Code stub compilable** — no pseudo-code, que arranque `npm run build`
- **Link bidireccional**: spec → Figma + ticket → spec + code → ticket
