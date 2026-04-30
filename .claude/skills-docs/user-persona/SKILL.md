---
name: user-persona
description: "Generate user personas, JTBD, pain points, and empathy maps. Output to Notion/Coda for product alignment."
category: "documentation"
argument-hint: "[product or feature name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task, AskUserQuestion
---
# user-persona — User Persona & JTBD Generator

Genera personas documentadas, JTBD, empathy maps y pain/gain analysis para productos Educabot (Alizia, Tuni, Vigia, Tich).

## Cuando usar / NO usar

| Usar | NO usar |
|------|---------|
| Nuevo producto/vertical sin target definido | Persona validada vigente (refinar, no recrear) |
| Feature grande que requiere empatia profunda | Stakeholders internos (stakeholder map aparte) |
| PRD sin persona clara (hand-in con `/product-spec`) | Bugs o issues tecnicos |
| Re-assessment del ICP existente | |
| Onboarding de nuevos PMs/designers | |

## Filosofia

Persona util: basada en data real (interviews, analytics, surveys), actionable (decide que hacer/no hacer), memorable (equipo la referencia). Persona mala: demografia irrelevante, copy-paste de competidor, 15 personas que nadie recuerda.

## Preguntas previas

1. **Producto:** Alizia / Tuni / Vigia / Tich / nuevo
2. **Primaria o secundaria?**
3. **Research existente?** (interviews, surveys, analytics, NPS)
4. **Cantidad:** 1-3 recomendado, max 5
5. **Contexto educativo:** Primaria / Secundaria / Univ / Adultos / Formal / No-formal

## Workflow

### Paso 1 — Recolectar evidencia
Pedir inputs: links a interviews (Notion/grabaciones), exports analytics (Mixpanel/GA), tickets soporte recurrentes, data CRM/Hubspot, competitor research. Sin data -> proponer plan discovery: 5-7 interviews, survey 50+ respuestas, 2 semanas minimo.

### Paso 2 — Segmentar
Dimensiones clave: rol (docente/estudiante/director/padre), nivel educativo, tipo institucion (publica/privada/mixta), tech-savviness (low/mid/high), contexto uso (aula/remoto/hibrido).

### Paso 3 — Escribir persona

> → Read references/persona-template.md for full persona template sections, anti-persona template, and JTBD canvas

### Paso 4 — Validar
Research/Data team revisa -> PM + Design aprueban -> iterar si no resuena.

### Paso 5 — Publicar
Notion/Coda (hub personas) -> linkear desde PRDs y Figma -> printables opcional.

## Rules of thumb

- Max 3-5 personas por producto; 1 primaria, max 2 secundarias
- Refrescar cada 6-12 meses o tras cambio grande
- Sin interview -> marcar como hipotesis
- Cada feature debe mapear a una persona
- "Pero Flor no haria eso" en meetings = senal de que funciona

## Delegacion

- `/product-spec` — PRD que usa la persona
- `/notion`, `/coda` — publicar hub
- `/meeting-to-tasks` — convertir interviews en insights
