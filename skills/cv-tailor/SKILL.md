---
name: cv-tailor
description: "Tailor a CV to a specific job description: extract ATS keywords, decide what to emphasize vs downplay, and rewrite achievement bullets in the offer's vocabulary, starting from a role profile. Triggers: adaptar CV, custom CV, tailor resume, CV para esta oferta, optimizar CV para ATS, matchear CV con job description."
argument-hint: "[job-url | path-to-jd | application-note]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch
---

# CV Tailor — Adaptar el CV a la oferta

Tomás un job description y el perfil base del usuario, y producís un **CV custom** que matchea con los filtros automáticos (ATS) y con la lectura humana del hiring manager. No reescribís la verdad — la reorganizás y la traducís al vocabulario de la oferta.

## Inputs

- **El job description** (URL → usá WebFetch, o texto pegado, o una nota de `03-Aplicaciones/`).
- **El perfil base**: `01-Perfiles/<Role>.md` (derivado del maestro vía `/master-profile derive`). Si no existe, sugerir crearlo.
- **Research del contacto/empresa** si existe en `04-Empresas/` y `05-Contactos/`.

## Proceso

### 1. Analizar la oferta
- Extraer **keywords literales** del JD: tecnologías, metodologías, responsabilidades, soft skills, seniority. Literal importa — el ATS hace matching de strings (ej: si piden "React.js" no asumas que "React" matchea igual).
- Detectar **must-have vs nice-to-have**.
- Detectar **señales de cultura / ángulo** (startup vs enterprise, code-forward, ownership, etc.).
- Ver `references/ats-keywords.md` para cómo extraer y mapear keywords.

### 2. Mapear contra el perfil
- Por cada must-have: ¿qué experiencia/proyecto del perfil lo cubre? Marcar gaps honestos.
- Decidir **qué resaltar** (lo que más alinea, arriba y con más espacio) y **qué bajar de volumen** (lo irrelevante para este rol).

### 3. Reescribir
- Reordenar experiencia y proyectos hacia el rol.
- Reescribir bullets de logros usando el vocabulario de la oferta, manteniendo número→contexto→resultado.
- Inyectar keywords de forma natural (en bullets reales, no en un "keyword stuffing" detectable).
- Ajustar el headline/summary al rol exacto.

### 4. Score before/after
- Calcular un **match rate** aproximado: % de keywords/requisitos del JD presentes en el CV, **antes** vs **después** del tailoring.
- Reportar el delta ("match 48% → 81%") y qué keywords se cubrieron.
- **Flag de keyword stuffing:** marcar cualquier inserción que a un revisor humano le suene forzada o poco natural — el objetivo es pasar el ATS *y* leer bien para una persona.

### 5. Producir el CV custom
- Crear/actualizar la nota en `02-CVs/CV - <Empresa> - <Rol>.md` usando el template `CV Custom` (`Templates/CV Custom.md`).
- Completar frontmatter (`perfil_base`, `aplicacion`, `empresa`, `archivo_pdf`).
- Documentar las decisiones (keywords, qué se resaltó/bajó) en las secciones del template — sirve para la entrevista y para iterar.
- El cuerpo del CV en sí debe quedar listo para `/cv-ats-export` (markdown limpio: `# nombre`, `## secciones`, bullets, `---`).

## Formato del CV (ATS-friendly)

- **Una columna.** Sin tablas, sin cajas de texto, sin columnas — los ATS las leen mal.
- Secciones estándar con headers claros: Summary, Experience, Skills, Projects, Education.
- Fechas consistentes (MM/YYYY).
- Sin gráficos ni imágenes para el contenido crítico.
- Verbos de acción + métricas.

## Idioma

CV en **inglés** para roles internacionales/remotos globales; **español** si la oferta/empresa es hispanohablante. Ante la duda, preguntar.

## Reglas

- Nunca inventar experiencia, fechas o métricas. Tailoring = reorganizar y traducir, no mentir.
- No keyword-stuffing: cada keyword debe vivir en un bullet verdadero.
- Un CV custom por postulación — no pisar el perfil base ni el maestro.
- Después de generar el `.md`, recordar al usuario correr `/cv-ats-export` para el PDF.

## Handoff

Pedí aprobación (approval) antes de escribir el CV custom. Cuando el `.md` está READY, el siguiente paso es `/cv-ats-export` para generar el PDF ATS y `/cover-letter` para el mensaje.
