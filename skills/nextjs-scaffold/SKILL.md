---
name: nextjs-scaffold
description: "Scaffold de app Next.js 15+ App Router con TypeScript estricto, shadcn/ui, Tailwind, RSC y estructura production-ready. Usar para iniciar un proyecto Next nuevo o agregar la base de UI."
category: "frontend"
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# nextjs-scaffold — Next.js + shadcn/ui Scaffolder

## MANDATORY WORKFLOW

**Antes de generar código, completar en orden.**

### Step 0: Gather Requirements
Clarificar (o inferir del contexto):
1. **Nombre del proyecto** (kebab-case)
2. **Router:** App Router (default) / Pages (legacy)
3. **Styling:** Tailwind + shadcn/ui (default) / CSS Modules
4. **Data layer:** Server Actions + RSC (default) / API routes / tRPC
5. **Auth:** Auth.js (NextAuth) / Clerk / ninguna
6. **DB:** Postgres + Prisma / Drizzle / ninguna
7. **Deploy:** Vercel (default) / Docker / self-host

Si ya está especificado, saltar al Step 1.

### Step 1: Crear base
```bash
npx create-next-app@latest <name> --ts --app --tailwind --eslint --src-dir --import-alias "@/*"
cd <name>
npx shadcn@latest init   # style: default, base color: slate
```

### Step 2: Estructura
```
src/
  app/                 # App Router: layouts, pages, route handlers
    (marketing)/       # route groups
    api/               # route handlers solo si hace falta
  components/
    ui/                # shadcn primitives
  lib/                 # utils, db client, auth
  server/              # server actions, data access (RSC-only)
```

### Step 3: Defaults no negociables
- `tsconfig`: `"strict": true`, `noUncheckedIndexedAccess`
- **Server Components por defecto**; `'use client'` solo en hojas interactivas
- `next/image` + `generateMetadata` en cada page
- Env vars validadas con Zod (`src/lib/env.ts`)
- ESLint flat config + `@typescript-eslint/no-floating-promises`

### Step 4: Agregar piezas (invocar skills relacionadas)
- SEO → skill `seo-nextjs`
- Búsqueda semántica → skill `pgvector-search`
- Features de IA → skill `ai-sdk-setup`
- Performance → skill `nextjs-best-practices`

### Step 5: Verificar
`npm run build` limpio + `npx next lint`. Revisar contra las rules `nextjs-code` y `react-perf`. Build limpio + lint sin errores → scaffold **READY**.

## Stack Defaults

| Componente | Default |
|------------|---------|
| Next.js | 15+ App Router |
| Lenguaje | TypeScript estricto |
| UI | shadcn/ui + Tailwind |
| Data | Server Actions + RSC |
| Validación | Zod |
| ORM | Prisma |
| Deploy | Vercel |

---

_Inspirado en `nextjs-shadcn` de [laguagu/claude-code-nextjs-skills](https://github.com/laguagu/claude-code-nextjs-skills). Adaptado al formato Arcane._
