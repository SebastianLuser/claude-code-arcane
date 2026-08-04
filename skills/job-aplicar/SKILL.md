---
name: job-aplicar
description: "Orchestrate a full job application from a URL or note: fit score, application note, tailored CV, cover letter, fresh-context review and ATS-verified PDF. Sending is always manual. Triggers: aplicar a esta oferta, postularme a, armar la postulacion, pipeline de aplicacion, preparar CV y cover para una oferta, aplicar a este trabajo."
argument-hint: "<url | nota de aplicación>"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, WebFetch, WebSearch, Task
---

# /job-aplicar - Pipeline completo de una postulación

Orquesta de punta a punta: evaluar fit → nota de aplicación → CV custom → cover → reviewer → PDF ATS → dashboard. Adaptado del `/apply` de MadsLorentzen/ai-job-search a los skills y reglas de este skillset. **El envío final es siempre manual del usuario; este skill nunca marca `estado: aplicado`** (eso lo registra `/job-outcome` después de enviar).

Argumento: `$ARGUMENTS` (URL de la oferta, o nombre/wikilink de una nota de `03-Aplicaciones/`).

Rutas relativas al career workspace (`--workspace`, env `CAREER_WORKSPACE`, o `./career-workspace/`). Usa los skills `cv-tailor`, `cover-letter` y `cv-ats-export`, la regla `drafter-reviewer` y, si está instalado, los CLIs y el estado de dedup de `job-scrape`.

## Paso 0 - Resolver argumento y detectar re-entrada

- Si es nombre/wikilink: cargar la nota de `03-Aplicaciones/`.
- Si es URL: canonicalizarla (reglas en `.claude/skills/job-scrape/references/dedup-playbook.md`) y buscar nota existente por `link_oferta` (Grep). Si existe, modo re-entrada.
- **Detectar desde los artefactos qué pasos ya están hechos** (no hay archivo de estado; los artefactos SON el estado):
  1. ¿Existe la nota? 2. ¿Tiene `match_score`? 3. ¿`cv_usado` apunta a un CV .md existente en `02-CVs/`? 4. ¿La nota tiene sección "Cover letter" con contenido? 5. ¿Hay resumen de decisiones de review en `## Notas`? 6. ¿Existe el PDF en `02-CVs/exports/` (o `archivo_pdf`)? 7. ¿Hay fila en el dashboard?
- Informar "retomo desde el paso X" y saltar lo ya hecho.

## Paso 1 - Obtener el JD

- URL de GetOnBoard → `python .claude/skills/job-scrape/scripts/getonbrd_search.py detail "<url>" --format plain` (si reporta CERRADA, avisar y preguntar si igual seguir).
- URL de LinkedIn → `python .claude/skills/job-scrape/scripts/linkedin_search.py detail "<url>" --format plain`.
- Otra fuente, o si `job-scrape` no está instalado → WebFetch.
- Registrar `fuente` (getonbrd / linkedin / otro).

## Paso 2 - Score

Aplicar la rúbrica de `.claude/skills/job-search/references/scoring-rubric.md` (si el skill job-search no está instalado, pedir instalarlo o scorear a criterio declarando la limitación) contra el perfil correspondiente de `01-Perfiles/` (elegir por stack del JD; preguntar si es ambiguo). Presentar: score 0-100, breakdown por dimensión, gaps reales, red flags.

## Paso 3 - CONFIRMACIÓN 1: ¿proceder?

Pedir approval explícito antes de crear cualquier archivo:
- **Proceder** → paso 4.
- **Descartar** → si existe `<workspace>/tools/job_scraper/seen_jobs.json`, registrar `status: descartado` + motivo; terminar. No crear nada.

## Paso 4 - Nota de aplicación

Crear (o completar) la nota desde el template `Templates/Aplicacion.md` del workspace: frontmatter completo (`estado: interesado`, `match_score`, `link_oferta` canónica, `perfil`, `fuente`, `salario_rango`, `modalidad`, `ubicacion`, `prioridad`, `contacto_principal` si se conoce), secciones "Por qué me interesa" y "Match con mi perfil" (alineaciones + gaps reales), línea en Timeline. En el idioma de las notas del workspace, sin guiones largos.

## Paso 5 - CV custom

Usar el skill **cv-tailor** con el JD y el perfil base: genera `02-CVs/CV - <Empresa> - <Rol>.md`, con keywords ATS de la oferta y delta de match reportado. Setear `cv_usado` en la nota de aplicación.

## Paso 6 - Cover letter

Usar el skill **cover-letter** según el canal de aplicación (formulario ATS → carta 250-350 palabras; LinkedIn/email → mensaje 150-250). Guardar en la sección "Cover letter (v1)" de la nota.

## Paso 7 - Reviewer (regla drafter-reviewer, obligatorio)

Seguir `.claude/rules/drafter-reviewer.md`: lanzar el agente **`cv-reviewer`** de contexto fresco con el JD + borradores inline y el perfil usado. Aplicar la Parte A (reemplazos exactos) e incorporar lo relevante de la Parte B. Una sola ronda. Never stuff keywords: los gaps se reconocen en el cover, no se rellenan en el CV. Normalizar guiones largos del texto sugerido.

**Segunda lente si el rol es senior o la postulación importa:** lanzar `hiring-manager` **en paralelo** con `cv-reviewer` (no en cadena). Contesta si el CV convence a quien contrata, que es una pregunta distinta a si pasa el filtro. Sus 3 preguntas van a `## Notas` de la nota: son material directo de `/interview-prep`.

Si el directorio de agentes no está instalado, el fallback con `general-purpose` está en la regla.

## Paso 8 - CONFIRMACIÓN 2: aprobar CV final

Mostrar el CV final (y cover) con las decisiones del review aplicadas. Solo con approval explícito, exportar:

```
python .claude/skills/cv-ats-export/scripts/cv_export.py "CV - <Empresa> - <Rol>"
```

(o la copia instalada en `<workspace>/tools/`). La verificación ATS corre automática ([ATS OK] esperado; si [ATS WARN], corregir y re-exportar). Registrar la ruta del PDF en la nota (sección "Archivo final exportado" del CV custom).

## Paso 9 - Dashboard

Agregar/actualizar la fila de la oferta en la sección de aplicaciones activas de `00-Dashboard.md`, respetando las columnas exactas del header, escapando `\|` en wikilinks con alias. Estado ⬜ (interesado).

## Paso 10 - Cierre

- Resumen de 3-5 decisiones de tailoring en `## Notas` de la nota (qué se enfatizó, ángulo de empresa, gaps reconocidos).
- Si existe seen_jobs: entrada → `nota_creada` (crearla si no existía).
- Recordatorio al usuario: **enviar es manual**; el PDF y el cover están listos, el link de aplicación está en la nota y el dashboard. Al enviar, correr `/job-outcome <empresa>` para marcar `aplicado`.

## Qué NO hace

- No envía la postulación ni marca `aplicado` (ToS de los portales + control de calidad humano).
- No exporta PDF sin la confirmación 2.
- No toca otras notas ni otras filas del dashboard.
- No inventa experiencia: los gaps se reconocen, no se rellenan.

## Handoff

Con el PDF verificado y el cover aprobados, el paquete queda READY para enviar a mano. Después de enviar: `/job-outcome <empresa>`. Si hay un contacto directo en la empresa, `/cold-outreach` para el mensaje al recruiter/hiring manager.
