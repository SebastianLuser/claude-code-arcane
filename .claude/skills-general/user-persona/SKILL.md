---
name: user-persona
description: "Genera user personas + Jobs-To-Be-Done + pain points + empathy maps. Output en Notion/Coda para alinear equipos de producto. Usar para: persona, user research, JTBD, empathy map, target user, segmento de usuarios."
argument-hint: "[product or feature name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task, AskUserQuestion
---
# user-persona — User Persona & JTBD Generator

Genera personas documentadas, JTBD, empathy maps y pain/gain analysis para productos Educabot (Alizia, Tuni, Vigía, Tich).

## Cuándo usar / NO usar

| Usar | NO usar |
|------|---------|
| Nuevo producto/vertical sin target definido | Persona validada vigente (refinar, no recrear) |
| Feature grande que requiere empatía profunda | Stakeholders internos (stakeholder map aparte) |
| PRD sin persona clara (hand-in con `/product-spec`) | Bugs o issues técnicos |
| Re-assessment del ICP existente | |
| Onboarding de nuevos PMs/designers | |

## Filosofía

Persona útil: basada en data real (interviews, analytics, surveys), actionable (decide qué hacer/no hacer), memorable (equipo la referencia). Persona mala: demografía irrelevante, copy-paste de competidor, 15 personas que nadie recuerda.

## Preguntas previas

1. **Producto:** Alizia / Tuni / Vigía / Tich / nuevo
2. **Primaria o secundaria?**
3. **Research existente?** (interviews, surveys, analytics, NPS)
4. **Cantidad:** 1-3 recomendado, max 5
5. **Contexto educativo:** Primaria / Secundaria / Univ / Adultos / Formal / No-formal

## Workflow

### Paso 1 — Recolectar evidencia
Pedir inputs: links a interviews (Notion/grabaciones), exports analytics (Mixpanel/GA), tickets soporte recurrentes, data CRM/Hubspot, competitor research. Sin data → proponer plan discovery: 5-7 interviews, survey 50+ respuestas, 2 semanas mínimo.

### Paso 2 — Segmentar
Dimensiones clave: rol (docente/estudiante/director/padre), nivel educativo, tipo institución (pública/privada/mixta), tech-savviness (low/mid/high), contexto uso (aula/remoto/híbrido).

### Paso 3 — Escribir persona

**Secciones del template Educabot:**

| Sección | Contenido |
|---------|-----------|
| **Snapshot** | Nombre ficticio, rol, edad, ubicación, institución, experiencia, tech-savviness |
| **JTBD** | Formato: "Cuando <situación>, quiero <motivación>, para <outcome>". Functional + emotional + social jobs |
| **Pain Points** | Dolores actuales, frustraciones con soluciones actuales, anti-pains (lo que NO quiere) |
| **Gains** | Deseados + inesperados (delight) |
| **Contexto de uso** | Cuándo, dónde, dispositivos, solo o con otros |
| **Quotes reales** | Citas textuales de interviews, linkear a transcripts |
| **Empathy Map** | Ve / Escucha / Piensa y siente / Dice y hace / Pains / Gains |
| **Anti-patterns** | Cosas que esta persona rechaza en el producto |
| **Métricas clave** | Tabla métrica + target (ej: NPS >50, retención mes 3 >60%) |
| **Testing** | Cómo reclutar, canal, incentivo, frecuencia |
| **Referencias** | Links a interviews, surveys, analytics, PRDs, Figma |

Metadata: tipo (primaria/secundaria/anti-persona), producto, última validación, research base, owner PM.

### Paso 4 — Validar
Research/Data team revisa → PM + Design aprueban → iterar si no resuena.

### Paso 5 — Publicar
Notion/Coda (hub personas) → linkear desde PRDs y Figma → printables opcional.

## Anti-persona

Template para definir **para quién NO es el producto**: quién es, por qué no es target (3 razones), señales en demo/sales/onboarding, qué hacer cuando aparece (sales deflect, support no priorizar, product no construir).

## JTBD Canvas (alternativa ligera)

Job statement + Forces diagram (push/pull/anxiety/habits) + success criteria. Usar JTBD solo para feature específica (equipo ya conoce user). Persona completa para onboarding, producto nuevo, re-alignment.

## Rules of thumb

- Max 3-5 personas por producto; 1 primaria, max 2 secundarias
- Refrescar cada 6-12 meses o tras cambio grande
- Sin interview → marcar como hipótesis
- Cada feature debe mapear a una persona
- "Pero Flor no haría eso" en meetings = señal de que funciona

## Delegación

- `/product-spec` — PRD que usa la persona
- `/notion`, `/coda` — publicar hub
- `/meeting-to-tasks` — convertir interviews en insights
