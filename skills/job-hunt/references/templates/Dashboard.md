---
tipo: dashboard
---

# Dashboard - Búsqueda laboral

> Índice del workspace. Cuando haya datos (aplicaciones, entrevistas), estas secciones pueden convertirse en queries dinámicas con Bases/Dataview si usás Obsidian.

## Aplicaciones activas
**Prioridad alta:**
- 

**Prioridad media:**
- 

**Cerradas / descartadas:**
- 

## Leyenda de estados
⬜ interesado · ✅ aplicado · 📅 entrevista/oferta · ❌ rechazado/sin_respuesta/declinada · 🚫 descartado/cerrada

## Próximas entrevistas
- 

## A seguir esta semana
- 

## Perfiles
- 

## Accesos rápidos por carpeta
- `01-Perfiles/` - perfiles profesionales base + perfil maestro
- `02-CVs/` - versiones de CV (incluye CVs custom por postulación)
- `03-Aplicaciones/` - una nota por postulación
- `04-Empresas/` - research de empresas
- `05-Contactos/` - recruiters, referidos, hiring managers
- `06-Entrevistas/` - prep y feedback por ronda
- `07-Recursos/` - cover letters reutilizables, links útiles
- `portfolio/` - source-of-truth del portfolio web
- `Templates/` - plantillas con frontmatter
- `tools/` - cv_export.py, verify_pdf.py y job_scraper/seen_jobs.json

## Workflow estándar para una nueva oportunidad
1. `/job-scrape` - corrida de búsqueda con dedup (o `/job-search` para una oferta puntual) → nota en `03-Aplicaciones/` + `04-Empresas/`.
2. Identificar contacto objetivo → nota en `05-Contactos/`.
3. `/job-aplicar` - pipeline completo: CV custom + cover + review + PDF ATS verificado.
4. Enviar (siempre manual) → `/job-outcome <empresa>` para marcar `aplicado` y registrar avances.
5. `/interview-prep` - cuando haya entrevista.
6. `/job-upskill` - con rechazos acumulados, plan de estudio según gaps reales.
