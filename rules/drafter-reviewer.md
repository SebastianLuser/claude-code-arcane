# Drafter-Reviewer Rule (CVs y covers)

Adaptado del workflow `/apply` de MadsLorentzen/ai-job-search. Todo CV custom o cover letter para una aplicación pasa por un reviewer de contexto fresco ANTES de exportarse a PDF. El que redacta no se auto-revisa.

Las rutas son relativas al career workspace (`./career-workspace/` o env `CAREER_WORKSPACE`).

## Cuándo aplica

- Al terminar el borrador de un CV custom (flujo cv-tailor) o de una cover / mensaje de aplicación (flujo cover-letter) destinado a una postulación concreta.
- NO aplica a ediciones menores de un CV ya revisado (typos, cambiar una fecha) ni a los CVs base de `02-CVs/` fuera de una postulación.

## El paso reviewer

Lanzar UN agente `general-purpose` de contexto fresco vía el Agent tool, con este contenido inline en el prompt (para que no dependa de leer archivos de la conversación):

1. El texto completo de la job description.
2. El borrador del CV y/o cover, verbatim.
3. Instrucción de lectura acotada: solo puede leer `01-Perfiles/<perfil usado>.md` del workspace. NO debe leer los templates ni el resto del workspace - critica contenido, no estructura.
4. Instrucción de research: búsqueda web breve sobre la empresa (misión, producto, noticias recientes, cultura) para detectar ángulos no aprovechados.

El reviewer devuelve dos partes:

- **Parte A - reemplazos mecánicos:** lista JSON de objetos `{ "old_string": "<texto exacto del borrador>", "new_string": "<reemplazo>", "motivo": "<una línea>" }`. El `old_string` debe ser cita textual para aplicarse con Edit sin ambigüedad.
- **Parte B - sugerencias narrativas**, agrupadas por categoría:
  - Keywords ATS de la JD que faltan o aparecen solo como sinónimo
  - Ángulos de empresa no aprovechados (del research)
  - Bullets que se pueden reformular como logro medible
  - Tono / estilo (registro, longitud, muletillas)

## Reglas de aplicación del feedback

- **Una sola ronda.** El drafter aplica la Parte A, incorpora de la Parte B lo que corresponda, y sigue. Sin ida y vuelta iterativo.
- **Never stuff keywords:** si una keyword de la JD es un gap real del candidato, NO se agrega al CV; se reconoce honestamente en el cover si vale la pena.
- Nada de guiones largos en el resultado final: si el reviewer sugiere texto con em-dash o en-dash, se normaliza a `-` al aplicarlo.
- Recién después de aplicar el feedback se exporta: `python .claude/skills/cv-ats-export/scripts/cv_export.py "<CV>"` (o la copia instalada en `<workspace>/tools/`; incluye verificación ATS automática de la capa de texto).

## Registro

En la nota de aplicación (`03-Aplicaciones/`), dejar en `## Notas` un resumen de 3-5 decisiones de tailoring (qué se enfatizó, qué ángulo de empresa se usó, qué gap se reconoció). Sirve para calibrar futuras aplicaciones y para el prep de entrevista.
