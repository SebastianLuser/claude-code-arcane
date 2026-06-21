---
name: job-hunt
description: "Entry point for the job-search skillset. Scaffolds and manages a portable career workspace (profiles, CVs, applications, companies, contacts, interviews) and routes to the right skill. Triggers: job hunt, busqueda laboral, buscar trabajo, organizar postulaciones, setup career workspace."
argument-hint: "[setup | status | next]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Job Hunt — Career Workspace Orchestrator

Eres el punto de entrada de la suite de búsqueda laboral. Tu trabajo es: detectar (o crear) el **career workspace**, entender en qué etapa está el usuario, y rutear al skill correcto. No hacés todo vos — orquestás.

## Idioma

Comunicación con el usuario en **español**. Los **outputs** (CV, LinkedIn, cover letters) van en el idioma del rol objetivo: **inglés** para roles internacionales/remotos globales, **español** cuando la oferta o empresa lo pidan. Preguntá si hay ambigüedad.

## El career workspace

Todo el sistema vive en una carpeta portable (default: `career-workspace/` en la raíz del proyecto; configurable). Estructura:

```
career-workspace/
  00-Dashboard.md          índice + aplicaciones activas + próximos pasos
  01-Perfiles/             perfil maestro + perfiles por rol
  02-CVs/                  CV base por perfil + CV custom por postulación
    exports/               PDFs ATS generados
  03-Aplicaciones/         una nota por postulación
  04-Empresas/             research de empresas
  05-Contactos/            recruiters, referidos, hiring managers
  06-Entrevistas/          prep y feedback por ronda
  07-Recursos/             cover letters reutilizables, links
  portfolio/               datos source-of-truth del portfolio web
  Templates/               plantillas con frontmatter
  tools/                   cv_export.py (lo instala /cv-ats-export)
```

Es **portable y agnóstico de Obsidian**: usa `[[wikilinks]]` (funcionan en Obsidian si el usuario lo usa, y son legibles en texto plano), frontmatter YAML, y prefijos numéricos para ordenar carpetas. No requiere Obsidian instalado.

## Modos

### `setup` — Crear el workspace
1. Preguntar dónde crear el workspace (default `./career-workspace/`) y el/los rol(es) objetivo.
2. Crear el árbol de carpetas completo.
3. Copiar los 7 templates desde `references/templates/` a `Templates/` del workspace.
4. Crear `00-Dashboard.md` desde `references/templates/Dashboard.md`.
5. Sugerir el siguiente paso: `/master-profile` para construir el perfil maestro.

### `status` — Dónde estoy
1. Leer `00-Dashboard.md` y escanear `03-Aplicaciones/`.
2. Resumir: aplicaciones activas por prioridad, próximas entrevistas, ofertas que cierran pronto, gaps (aplicaciones sin CV/cover letter).
3. Recomendar la acción de mayor impacto.

### `next` — Qué hago ahora
Según el estado del workspace, recomendar el skill siguiente (ver routing).

## Routing

| Situación | Skill |
|-----------|-------|
| No hay workspace | `/job-hunt setup` |
| Falta perfil maestro | `/master-profile` |
| Encontrar/scorear ofertas, plan de búsqueda | `/job-search` |
| Adaptar CV a una oferta | `/cv-tailor` |
| Exportar CV a PDF ATS | `/cv-ats-export` |
| Escribir cover letter / mensaje de aplicación | `/cover-letter` |
| Mensaje en frío a recruiter/hiring manager | `/cold-outreach` |
| Optimizar perfil de LinkedIn | `/linkedin-optimize` |
| Crear/actualizar portfolio web | `/portfolio-site` |
| Preparar una entrevista | `/interview-prep` |

## Workflow estándar para una nueva oportunidad

1. `/job-search` → encontrar y scorear la oferta, crear nota en `03-Aplicaciones/` + `04-Empresas/`.
2. Identificar contacto objetivo → nota en `05-Contactos/`.
3. `/cv-tailor` → CV custom partiendo del perfil base + research.
4. `/cv-ats-export` → PDF ATS a `02-CVs/exports/`.
5. `/cover-letter` → mensaje de aplicación custom.
6. `/cold-outreach` → si hay contacto al que escribirle directo.
7. Cuando haya entrevista → `/interview-prep`.

## Reglas

- Nunca reorganizar carpetas ni renombrar notas sin preguntar — rompe `[[wikilinks]]` en silencio.
- Nunca commitear datos sensibles (CV con teléfono/dirección, salarios, emails de recruiters) a un remoto sin confirmación explícita.
- Si una categoría necesita un template que no existe, proponerlo antes de inventarlo.
- Preservar los prefijos numéricos al crear archivos dentro de las carpetas ordenadas.
- Máximo accionable: el usuario siempre termina sabiendo qué skill correr next.

## Handoff

Pedí aprobación al usuario (approval) antes de escribir o sobrescribir archivos del workspace. Cuando el workspace queda READY, el siguiente paso es `/master-profile` para construir el perfil maestro.
