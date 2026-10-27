---
name: nextjs-scaffold
description: "Scaffold a Next.js 15+ App Router app with strict TypeScript, shadcn/ui, Tailwind, RSC and a production-ready structure. Use to start a new Next project or to add the UI base."
category: "frontend"
argument-hint: "[project-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# nextjs-scaffold — Next.js + shadcn/ui Scaffolder

## MANDATORY WORKFLOW

**Before generating code, complete these in order.**

### Step 0: Gather Requirements
Clarify (or infer from context):
1. **Project name** (kebab-case)
2. **Router:** App Router (default) / Pages (legacy)
3. **Styling:** Tailwind + shadcn/ui (default) / CSS Modules
4. **Data layer:** Server Actions + RSC (default) / API routes / tRPC
5. **Auth:** Auth.js (NextAuth) / Clerk / none
6. **DB:** Postgres + Prisma / Drizzle / none
7. **Deploy:** Vercel (default) / Docker / self-host

If it is already specified, skip to Step 1.

### Step 1: Create the base
```bash
npx create-next-app@latest <name> --ts --app --tailwind --eslint --src-dir --import-alias "@/*"
cd <name>
npx shadcn@latest init   # style: default, base color: slate
```

### Step 2: Structure
```
src/
  app/                 # App Router: layouts, pages, route handlers
    (marketing)/       # route groups
    api/               # route handlers only if needed
  components/
    ui/                # shadcn primitives
  lib/                 # utils, db client, auth
  server/              # server actions, data access (RSC-only)
```

### Step 3: Non-negotiable defaults
- `tsconfig`: `"strict": true`, `noUncheckedIndexedAccess`
- **Server Components by default**; `'use client'` only on interactive leaves
- `next/image` + `generateMetadata` on every page
- Env vars validated with Zod (`src/lib/env.ts`)
- ESLint flat config + `@typescript-eslint/no-floating-promises`

### Step 4: Add pieces (invoke related skills)
- SEO → the `seo-nextjs` skill
- Semantic search → the `pgvector-search` skill
- AI features → the `ai-sdk-setup` skill
- Performance → the `nextjs-best-practices` skill

### Step 5: Verify
Clean `npm run build` + `npx next lint`. Review against the `nextjs-code` and `react-perf` rules. Clean build + lint without errors → scaffold **READY**.

## Stack Defaults

| Component | Default |
|------------|---------|
| Next.js | 15+ App Router |
| Language | Strict TypeScript |
| UI | shadcn/ui + Tailwind |
| Data | Server Actions + RSC |
| Validation | Zod |
| ORM | Prisma |
| Deploy | Vercel |

---

_Inspired by `nextjs-shadcn` from [laguagu/claude-code-nextjs-skills](https://github.com/laguagu/claude-code-nextjs-skills). Adapted to the Arcane format._
