---
name: product-spec
description: "Generate a full PRD (context, problem, solution, metrics, risks) and create the matching Jira epic + stories."
category: "agile"
argument-hint: "[feature-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task, AskUserQuestion
---
# product-spec — PRD Generator

Genera PRD completo y lo distribuye: Notion/Coda (doc) + Jira (épica + HUs).

## Cuándo usar / NO

| Usar | NO usar |
|------|---------|
| Nueva feature discovery → delivery | Bugs (`/fix-issue` o Jira directo) |
| Iniciativa cross-team | Tareas técnicas (`/doc-rfc`) |
| Refactor mayor que afecta UX | Diseños de juego (`/doc-gdd`) |
| Experimento A/B con hipótesis | |

## Discovery (preguntas previas)

Feature name, producto (Alizia/Tuni/Vigía/Tich), PM owner, stakeholders (eng/design/QA leads), target release (sprint/mes/trimestre), confidencial? Si faltan respuestas → `[TBD]`.

## Estructura del PRD

12 secciones estándar:

1. **TL;DR** — 1 párrafo (3-5 líneas): qué, para quién, por qué ahora
2. **Contexto** — estado actual (data, quotes, issues soporte), importancia (link OKR/North Star), por qué ahora
3. **Problema** — 1 oración memorable + usuarios afectados (persona, segmento) + evidencia (interviews, métricas, tickets soporte)
4. **Objetivos y Métricas** — goal principal + success metrics table (métrica/baseline/target/guardrail) + non-goals explícitos
5. **Propuesta** — high-level + user flow (happy path con mockups) + alcance MVP (must-haves) + fast follows (v1.1+) + variantes consideradas con pros/contras
6. **Requisitos funcionales** — HUs formato "Como X quiero Y para Z" con ACs Given/When/Then + edge cases + error/empty states
7. **Requisitos no-funcionales** — performance (p95), accesibilidad (WCAG 2.1 AA), privacidad (COPPA/FERPA), browsers/devices, i18n (ES/EN/PT)
8. **Rollout** — fases (dogfooding → beta cerrada → beta abierta → GA) + feature flag (name, owner, kill switch) + comms plan (release notes, email, blog, in-app)
9. **Riesgos y dependencias** — tabla riesgos (probabilidad/impacto/mitigación) + dependencias checklist
10. **Open questions** — checklist TBD
11. **Anexos** — links research, Figma, RFC técnico, analytics dash
12. **Changelog** — tabla fecha/autor/cambio

## Workflow

1. **Discovery** — recopilar respuestas, `[TBD]` lo faltante
2. **Generar PRD** — Markdown completo, no saltear secciones (N/A + razón si no aplica)
3. **Publicar** — preguntar Notion o Coda, workspace destino
4. **Jira** — crear épica (`[PRD] Feature Name`, labels: prd, producto, quarter) + HUs como stories hijas con ACs como checklist
5. **Review meeting** — proponer en 48h con stakeholders (walk-through 30min + Q&A 15min + next steps 15min)
6. **Resumen** — links a doc, épica, HUs, meeting propuesta + next steps checklist

## Tips / Señales de PRD malo

**Tips:** TL;DR leíble en 30s, métricas > opiniones, non-goals explícitos, un problema por PRD, links no copias, cambios grandes → nuevo doc.

**Señales malas:** sin baseline metric, scope creep MVP/fast-follows no claro, open questions vacío, sin edge cases/error states, sin rollout plan.

## Checklist

- [ ] All 12 PRD sections are present (use N/A + reason if not applicable, never omit)
- [ ] Discovery answers are incorporated and `[TBD]` items are tracked in Open Questions
- [ ] Jira epic created with `[PRD]` prefix, correct labels (prd, producto, quarter)
- [ ] User stories are linked as children of the Jira epic with ACs as checklists
- [ ] Success metrics table includes baseline, target, and guardrail for each metric
- [ ] Review meeting proposed within 48h with all listed stakeholders
