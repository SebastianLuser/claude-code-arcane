---
name: job-outcome
description: "Record the outcome or progress of a job application (interview, offer, hired, rejected, no reply) updating the application note and the dashboard. Triggers: me respondieron de, registrar resultado, me rechazaron, tengo entrevista con, recibi una oferta, no me contestaron, actualizar estado de la postulacion."
argument-hint: "[empresa]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# /job-outcome - Registrar resultado de una aplicación

Registrá qué pasó con una postulación: avances (entrevista agendada/hecha, oferta recibida) o resoluciones (contratado, rechazado, sin respuesta, oferta declinada, descartado). Adaptado del `/outcome` de MadsLorentzen/ai-job-search al esquema de notas del career workspace (rutas relativas al workspace: `--workspace`, env `CAREER_WORKSPACE`, o `./career-workspace/`).

Empresa/oferta indicada: `$ARGUMENTS`

## Pasos

1. **Localizar la nota.** Buscar en `03-Aplicaciones/` la nota cuyo nombre o frontmatter `empresa` matchee (case-insensitive) con `$ARGUMENTS`. Si no se pasó argumento o hay ambigüedad, listar las aplicaciones con estado abierto (`interesado`, `aplicado`, `entrevista`, `oferta`) y preguntar cuál.

2. **Recolectar qué pasó.** Preguntar al usuario y clasificar:
   - **Progreso:** entrevista agendada / entrevista realizada / oferta recibida → estados `entrevista` u `oferta`.
   - **Resolución:** `contratado` · `rechazado` · `sin_respuesta` · `declinada` (la oferta la rechazó el usuario) · `descartado` (el usuario perdió interés / la oferta cerró).
   Registrar fecha, feedback textual recibido y lecciones aprendidas. **Registrar datos, no interpretarlos:** citar el feedback tal como llegó, sin suavizarlo ni analizarlo acá.

3. **Actualizar la nota de aplicación**, con approval del usuario sobre lo recolectado (idempotente - agregar, nunca duplicar ni sobrescribir):
   - Frontmatter: `estado` al nuevo valor y `fecha_actualizacion` a hoy. Compatibilidad: si la nota vieja usa `score:` en vez de `match_score:`, no renombrar el campo, solo tocar `estado`.
   - `## Timeline / seguimiento`: agregar línea `- YYYY-MM-DD - <qué pasó>`.
   - Si hubo entrevista: entrada en `## Entrevistas` (fecha, etapa, entrevistador si se sabe, y link a la nota de `06-Entrevistas/` si existe).
   - Feedback y lecciones van en `## Notas`.

4. **Actualizar el dashboard** (`00-Dashboard.md`): buscar la fila de la oferta y actualizar la columna **Estado** con el nuevo estado (usar la leyenda de emojis de abajo, la misma del template Dashboard) y la columna de nota si aporta (ej. "Rechazada 2026-07-13").

5. **Sugerir siguiente paso** según el caso:
   - `entrevista` → ofrecer `/interview-prep`.
   - `rechazado` con feedback → anotar la lección en la nota; si se acumulan 3+ resoluciones, ofrecer `/job-upskill` y revisar los criterios de búsqueda contra los resultados reales.
   - `sin_respuesta` a los 10-14 días → ofrecer follow-up con `/cold-outreach`.
   - `contratado` → 🎉 y actualizar el resto de las aplicaciones abiertas (¿retirarse de procesos?).

6. **Confirmar** al usuario qué se registró (nota, campos tocados, fila del dashboard).

## Vocabulario de `estado` (frontmatter)

`interesado → aplicado → entrevista → oferta` y cierra en: `contratado | rechazado | sin_respuesta | declinada | descartado`

Emojis del dashboard: ⬜ interesado · ✅ aplicado · 📅 entrevista/oferta · ❌ rechazado/sin_respuesta/declinada · 🚫 descartado/cerrada

## Reglas

- No editar en masa notas existentes: solo la nota de la aplicación en cuestión y su fila del dashboard.
- No inventar datos: si falta información (fecha, feedback), preguntar o dejar el campo como está.
- Sin guiones largos en todo texto agregado.

## Handoff

Registro COMPLETE cuando nota y dashboard quedaron consistentes. Según el resultado, el siguiente paso es `/interview-prep` (entrevista agendada), `/cold-outreach` (follow-up) o `/job-upskill` (rechazos acumulados).
