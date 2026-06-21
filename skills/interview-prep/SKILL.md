---
name: interview-prep
description: "Prepare for a job interview: company research, likely question bank by role, STAR answers built from your real experience, smart questions to ask, and red flags to watch for. Triggers: preparar entrevista, interview prep, preguntas de entrevista, respuestas STAR, que preguntar en una entrevista, mock interview, red flags entrevista."
argument-hint: "[application-note | company + role + round]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch
---

# Interview Prep — Preparación de entrevista

Preparás al usuario para una entrevista concreta: research de la empresa, banco de preguntas probable según rol y ronda, respuestas **STAR** construidas desde su experiencia real, preguntas inteligentes para hacer, y red flags a detectar. El output queda en una nota de `06-Entrevistas/`.

## Inputs

- **Aplicación / empresa / rol** (`03-Aplicaciones/`, `04-Empresas/`) y la **ronda** (recruiter screen, técnica, system design, hiring manager, cultural, final).
- **Perfil maestro** (`01-Perfiles/`) — de ahí salen las historias para las respuestas STAR.
- **Entrevistadores** si se conocen (research de background ayuda).

## Qué producís

### 1. Research de la empresa
- Qué hacen, producto, modelo de negocio, etapa, tamaño.
- Cultura y valores (de su sitio, blog, reviews).
- Noticias recientes / financiación / lanzamientos.
- Stack técnico conocido.
- Cómo conectar tu perfil con su contexto.

### 2. Banco de preguntas por ronda
- **Recruiter screen:** motivación, expectativas salariales, disponibilidad, "contame de vos".
- **Técnica:** según stack del JD — fundamentos, problemas, debugging, code review.
- **System design** (si aplica): patrones, trade-offs, escala.
- **Hiring manager / comportamiento:** liderazgo, conflicto, fracaso, impacto.
- **Cultural:** valores, formas de trabajo, por qué esta empresa.
- Marcar las **3–5 más probables** para este rol específico.

### 3. Respuestas STAR
- Construir respuestas con el método **STAR** (Situación, Tarea, Acción, Resultado) usando logros reales del perfil maestro.
- Cada respuesta: concreta, con métrica, 60–90 segundos hablada.
- Ver `references/star-framework.md`.

### 4. Preguntas para hacer
- 5–7 preguntas inteligentes que demuestran research y filtran si la empresa te conviene (equipo, expectativas de los primeros 90 días, cómo miden éxito, deuda técnica, proceso).

### 5. Red flags a detectar
- Señales de mala empresa/equipo durante la entrevista (proceso caótico, evasión sobre cultura/turnover, expectativas irreales, falta de claridad de rol, hostilidad).
- Qué preguntar para sacarlas a la luz.

## Salario / negociación (si la ronda lo toca)

- No dar número primero si se puede evitar; preguntar rango.
- Anclar en research de mercado + tu valor (logros).
- Tener un rango (mínimo aceptable / objetivo / ambicioso) listo.

## Proceso

1. Leer aplicación + empresa + perfil. WebFetch del sitio/notas de la empresa.
2. Crear nota en `06-Entrevistas/` con el template `Entrevista`.
3. Llenar research, banco de preguntas (marcando las top), STAR de las 3–5 historias clave, preguntas a hacer, red flags.
4. Ofrecer un **mock**: vos hacés de entrevistador y das feedback sobre las respuestas.
5. Post-entrevista: ayudar a registrar feedback y definir próximo paso / follow-up (con `/cold-outreach`).

## Idioma

En el idioma de la entrevista. Preparar respuestas en inglés si el rol es internacional, aunque la prep se converse en español.

## Handoff

Pedí aprobación (approval) antes de escribir la nota en `06-Entrevistas/`. Cuando la prep está READY, ofrecé un mock; post-entrevista, seguí con `/cold-outreach` para el follow-up.
