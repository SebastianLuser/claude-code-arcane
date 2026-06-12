---
name: nextjs-best-practices
description: "React + Next.js performance: 64 reglas en 8 categorías (waterfalls, bundle, server, client fetching, re-render, rendering, JS, advanced) priorizadas por impacto, de Vercel Engineering. Usar al escribir/optimizar React o Next.js."
category: "frontend"
argument-hint: "[waterfalls|bundle|server|rerender|rendering|js|all]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# nextjs-best-practices — Performance priorizada por impacto

64 reglas de optimización de performance para React y Next.js, de Vercel Engineering, organizadas en 8 categorías priorizadas de **CRITICAL** a **LOW**. Detalle por categoría en `references/`.

## MANDATORY WORKFLOW

**Diagnóstico dirigido por métricas, no aplicar las 64 reglas a ciegas** (este es el enfoque `vercel-optimize`: medir primero, optimizar solo lo que las métricas señalan).

### Step 0: Medir / localizar

1. **¿Hay métricas?** Lighthouse, Web Vitals (LCP/INP/CLS), bundle analyzer, traces de Vercel.
2. **¿Cuál es el síntoma dominante?** TTFB alto → waterfalls/server. Bundle grande / TBT → bundle size. Jank en interacción → re-render. Layout shift → rendering.
3. Identificar las rutas/componentes concretos que las métricas apuntan. Optimizar **esos**, no todo.

### Step 1: Priorizar por impacto

| Prioridad | Categoría | Impacto | Reference |
|-----------|-----------|---------|-----------|
| 1 | Eliminating Waterfalls | CRITICAL | `references/waterfalls.md` |
| 2 | Bundle Size Optimization | CRITICAL | `references/bundle-size.md` |
| 3 | Server-Side Performance | HIGH | `references/server.md` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `references/client-fetching.md` |
| 5 | Re-render Optimization | MEDIUM | `references/rerender.md` |
| 6 | Rendering Performance | MEDIUM | `references/rendering.md` |
| 7 | JavaScript Performance | LOW-MEDIUM | `references/javascript.md` |
| 8 | Advanced Patterns | LOW | `references/advanced.md` |

### Step 2: Aplicar + medir de nuevo

Aplicar la regla, re-medir. Si la métrica no mejoró, revertir y subir de categoría — no acumular micro-optimizaciones sin impacto medible.

### Step 3: Checklist de cierre

- [ ] Fetches independientes en paralelo (`Promise.all`), no en cascada
- [ ] Server Components por defecto; `'use client'` empujado abajo en el árbol
- [ ] Sin barrel imports en el critical path; componentes pesados con `next/dynamic`
- [ ] Server Actions autenticadas individualmente
- [ ] Sin componentes definidos dentro de componentes
- [ ] `next/image` + `generateMetadata` + resource hints donde corresponde
- [ ] Re-medir Web Vitals post-cambios

Si todo el checklist pasa → optimización **COMPLETE**. Antes de escribir cambios significativos, confirmar el approach con el usuario (Question → Decision → Approval).

## Tabla síntoma → categoría

| Métrica mala | Categoría |
|--------------|-----------|
| TTFB / tiempo de respuesta del server | Waterfalls, Server |
| First Load JS / TBT alto | Bundle Size |
| INP / jank en interacción | Re-render, JS |
| LCP | Rendering, Bundle, Server |
| CLS / flicker en hydration | Rendering |

---

_Adaptado de [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (react-best-practices, MIT, © Vercel). 64 reglas priorizadas por impacto, reorganizadas al formato skill+references de Arcane._
