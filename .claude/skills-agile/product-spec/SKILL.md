---
name: product-spec
description: "Genera PRD (Product Requirements Document) completo estilo Educabot: contexto, problema, solución, métricas, rollout, riesgos. Output listo para pegar en Notion/Coda + crea épica y HUs en Jira. Usar para: nueva feature, iniciativa de producto, PRD, spec de producto."
---

# product-spec — Product Requirements Document Generator

Genera un PRD completo y lo distribuye a las herramientas de PM de Educabot: **Notion/Coda** (doc), **Jira** (épica + HUs).

## Cuándo usar

- Nueva feature que arranca discovery → delivery
- Iniciativa de producto que necesita alignment cross-team
- Refactor mayor que afecta UX/UR
- Experimento A/B que requiere hipótesis documentada

## Cuándo NO usar

- Bugs (usar `/fix-issue` o crear ticket directo en Jira)
- Tareas técnicas internas (usar `/doc-rfc`)
- Diseños de juego (usar `/doc-gdd` o `/doc-pas`)

## Preguntas previas (discovery)

Antes de escribir, confirmar:

1. **Feature/iniciativa name** (1 línea)
2. **Producto**: Alizia / Tuni / Vigía / Tich / otro
3. **Owner**: quién es el PM responsable
4. **Stakeholders**: eng lead, design lead, QA, otros
5. **Target release**: sprint / mes / trimestre
6. **Confidential?**: si hay info sensible marcar en Notion

Si el user no tiene las respuestas, proponer draft y marcar `[TBD]` en esos campos.

## Estructura del PRD (formato Educabot)

```markdown
# PRD: <Feature Name>

**Autor**: <PM name>
**Última actualización**: <fecha>
**Estado**: 📝 Draft | 🔍 Review | ✅ Approved | 🚀 Shipping | 📦 Shipped
**Producto**: <Alizia/Tuni/etc>
**Target release**: <Sprint/Mes>
**Jira Epic**: <ALZ-123 / link>
**Figma**: <link>

## 1. TL;DR

1 párrafo (3-5 líneas). Qué vamos a hacer, para quién, por qué ahora.

## 2. Contexto

### ¿Qué pasa hoy?
Estado actual. Data, quotes de usuarios, issues de soporte. Evitar opiniones.

### ¿Por qué es importante?
Link a OKR / North Star / feedback recurrente. Métrica que se mueve.

### ¿Por qué ahora?
Qué cambió (mercado, tecnología, deuda, compromiso comercial).

## 3. Problema

Declaración de problema en 1 oración — fácil de recordar.

> "Los docentes de Alizia pierden X minutos por semana haciendo Y porque el sistema Z."

### Usuarios afectados
- Persona primaria: <docente / estudiante / admin>
- Persona secundaria: <...>
- Tamaño segmento: <% o N usuarios>

### Evidencia
- User interview: <link Notion>
- Métrica actual: <X%, Y clicks, Z tiempo>
- Soporte tickets: <N/mes relacionados>

## 4. Objetivos y Métricas

### Goal
1 objetivo principal en lenguaje humano.

### Success metrics (North Star + guardrails)
| Métrica | Baseline | Target | Guardrail |
|---------|----------|--------|-----------|
| <primary KPI> | X | Y | — |
| <secondary> | X | Y | — |
| <guardrail> | X | no baja de Y | — |

### Non-goals
Qué **NO** vamos a hacer (explícito para evitar scope creep).

## 5. Propuesta de solución

### High-level
1 párrafo + 1 diagrama/flow si ayuda.

### User flow
Paso a paso del happy path. Incluir mockups Figma inline.

### Alcance MVP
Lista de **must-haves** para v1. Todo lo demás va a "Fast follows".

### Fast follows (v1.1+)
Cosas nice-to-have que no bloquean release.

### Variantes consideradas
- Opción A: <descripción> — ventajas / desventajas
- Opción B: <descripción> — ventajas / desventajas
- **Elegida**: Opción X porque <razón>

## 6. Requisitos funcionales

### Historias de usuario
Formato: `Como <persona>, quiero <acción>, para <beneficio>`.

- **HU1**: Como docente, quiero X, para Y.
  - **AC1**: Given/When/Then
  - **AC2**: Given/When/Then
- **HU2**: ...

### Edge cases
- Qué pasa si <X>?
- Error state: <Y>
- Empty state: <Z>

## 7. Requisitos no-funcionales

- **Performance**: <p95 < 200ms / carga inicial < 2s>
- **Accesibilidad**: WCAG 2.1 AA
- **Privacidad**: cumple COPPA/FERPA si aplica (Educabot contexto edu)
- **Browsers/devices soportados**: <lista>
- **i18n**: ES / EN / PT

## 8. Plan de rollout

### Fases
1. **Internal dogfooding** — semana X
2. **Beta cerrada** — X% docentes invitados
3. **Beta abierta** — feature flag a % de users
4. **GA** — 100%

### Feature flag
- Name: `<feature_name>_enabled`
- Owner: <eng lead>
- Kill switch: sí/no

### Comms plan
- Release notes: <link>
- Email a users: sí/no
- Blog post: sí/no
- In-app announcement: sí/no

## 9. Riesgos y dependencias

### Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| <X> | Alta/Media/Baja | Alto/Medio/Bajo | <plan> |

### Dependencias
- [ ] Equipo X necesita entregar Y antes de <fecha>
- [ ] API Z debe estar lista
- [ ] Compra de servicio W aprobada por finance

## 10. Open questions

- [ ] <pregunta 1>
- [ ] <pregunta 2>

## 11. Anexos

- Research: <link>
- Figma: <link>
- Técnico (RFC): <link>
- Analytics dash: <link>

## 12. Changelog del doc

| Fecha | Autor | Cambio |
|-------|-------|--------|
| YYYY-MM-DD | PM | Initial draft |
```

## Workflow de ejecución

### Paso 1 — Discovery
Preguntar al user las respuestas de la sección anterior. Si faltan datos, marcar `[TBD]` y pedir research.

### Paso 2 — Generar el PRD
Escribir el doc en Markdown usando el template completo. No saltear secciones — si alguna no aplica, marcar "N/A + razón".

### Paso 3 — Publicar en Notion o Coda
Preguntar: "¿Subo el doc a Notion o Coda? ¿En qué página/workspace?"

Usar la skill `/notion` o `/coda` para crear la página. Estructurar con headings H1/H2/H3 nativos.

### Paso 4 — Crear épica y HUs en Jira
Usar `/jira-tickets` para:

1. **Crear épica** en el proyecto correcto (ALZ / TICH / TUNI / VIA)
   - Summary: `[PRD] <Feature Name>`
   - Description: link al doc + TL;DR
   - Labels: `prd`, `<producto>`, `<cuarto YYYY-Q#>`

2. **Crear HUs** (una por cada HU del PRD)
   - Issue type: Story
   - Parent: la épica
   - Summary: la HU
   - Description: AC formateados como checklist
   - Story points: pedir al user o marcar TBD
   - Labels: heredar de épica

### Paso 5 — Crear review meeting en calendario
Proponer: "¿Programamos una PRD review en 48hs con <stakeholders>?"
Si sí, generar invite draft con:
- Agenda: walk-through del PRD (30min) + Q&A (15min) + next steps (15min)
- Pre-read: link al doc
- Attendees: owner, eng lead, design lead, QA lead, director responsable

### Paso 6 — Resumen final
```
✅ PRD generado y publicado
   📄 Notion: <link>
   🎯 Jira épica: ALZ-123
   📋 5 HUs creadas: ALZ-124 a ALZ-128
   📅 Review meeting: propuesto para <fecha>

Próximos pasos:
  - [ ] Stakeholders review y aprobar
  - [ ] Estimar story points en refinamiento
  - [ ] Design agrega mockups Figma
  - [ ] Eng escribe RFC técnico (/doc-rfc)
```

## Tips para un buen PRD

- **TL;DR leíble en 30 segundos** — si no se entiende ahí, reescribirlo
- **Métricas > opiniones** — toda afirmación de problema necesita data
- **Non-goals explícitos** — salva tiempo después
- **Un solo problema por PRD** — si hay dos, partir en dos PRDs
- **Links, no copiar** — evitar que el doc se desactualice; linkear research/figma
- **Cambios grandes → nuevo doc** — no editar PRD aprobado silenciosamente

## Señales de un PRD malo

- No hay baseline metric (no sabés si mejoraste)
- Scope creep entre "MVP" y "fast follows" no está claro
- "Open questions" vacío (todo proyecto no-trivial tiene unknowns)
- No menciona edge cases ni error states
- Sin rollout plan → all-or-nothing es riesgoso

## Delegación

**Coordinar con:** `product-manager`, `chief-product-officer`, `ux-lead`, `backend-architect`, `frontend-architect`
**Reporta a:** `chief-product-officer`

**Skills relacionadas:**
- `/notion`, `/coda` — publicar doc
- `/jira-tickets` — épica + HUs
- `/figma-to-code` — convertir mockups a código una vez aprobado
- `/doc-rfc` — spec técnico después del PRD
- `/user-persona` — si falta definir persona primaria
