---
name: cold-outreach
description: "Write cold LinkedIn/email messages from a job-seeker to recruiters, hiring managers and referrals — plus post-application follow-up sequences that get replies. For B2B sales outreach use cold-email instead. Triggers: mensaje en frio recruiter, escribirle a un reclutador, follow up postulacion, networking message, pedir referido, contactar hiring manager."
argument-hint: "[contact-note | recruiter + company]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch
---

# Cold Outreach — Job-seeker → Recruiter / Hiring Manager

Escribís mensajes en frío de un **candidato** a recruiters, hiring managers y referidos, y secuencias de **follow-up** post-aplicación que reciben respuesta. Esto NO es venta B2B (para eso está `/cold-email`) — el ángulo es conseguir una conversación o un referido, sin sonar a spam ni a desesperación.

## Cuándo usar cada variante

| Situación | Mensaje |
|-----------|---------|
| Recruiter posteó un rol | Mensaje corto con fit + interés explícito |
| Hiring manager / futuro lead | Mensaje de valor: qué resolvés que a su equipo le importa |
| Pedir un referido a alguien de la empresa | Cálido, bajo compromiso, fácil de decir que sí |
| Networking sin rol abierto | Curiosidad genuina + algo en común, sin pedir nada todavía |
| Follow-up post-aplicación | Recordatorio con valor, no "¿alguna novedad?" |

## Principios

- **Personalizá la primera línea.** Algo real de esa persona/empresa/rol. Si sirve para 100 personas, no sirve para ninguna.
- **Corto.** LinkedIn: 50–125 palabras. La connection note: <300 caracteres.
- **Una pregunta / un CTA.** Bajá la fricción de responder.
- **Vos resolvés algo para ellos**, no "estoy buscando trabajo, ¿me ayudás?". El foco es el valor que aportás al equipo.
- **Sin paredes de texto, sin CV adjunto en el primer toque** (salvo que lo pidan).
- **Respetá el "no".** Un follow-up, máximo dos. Nunca insistir agresivo.

## Estructura de un primer mensaje

1. **Gancho personal** (1 línea): por qué *a esta persona*.
2. **Quién sos + fit** (1–2 líneas): rol + el logro más relevante para ellos.
3. **CTA suave** (1 línea): ¿15 min para charlar? / ¿abierto a una intro? / dejé mi aplicación, encantado de dar contexto.

## Secuencia de follow-up post-aplicación

- **Día 0** — aplicación enviada (+ mensaje al recruiter/hiring manager si tenés el contacto).
- **Día 4–5** — follow-up 1: reafirmá interés + agregá *algo nuevo* (un proyecto relevante, una idea sobre su producto). No "¿novedades?".
- **Día 10–12** — follow-up 2 (último): breve, profesional, dejá la puerta abierta. Si no hay respuesta, cerrás el loop con dignidad.

Cada follow-up debe tener un **gancho propio** y leerse solo, sin depender de los anteriores.

## Proceso

1. Leer la nota de `05-Contactos/` (o crearla) y la de `04-Empresas/`.
2. Investigar a la persona (rol, equipo, algo reciente) — WebFetch del perfil público si hay URL.
3. Elegir variante + canal.
4. Draftear mensaje + 1 variante de apertura.
5. Registrar en `05-Contactos/` (historial de interacciones) y planificar el follow-up.

> Nota: Claude no accede a tu LinkedIn ni envía mensajes — redacta para que vos copies/pegues y registres la interacción.

## Idioma

Espejá el idioma de la persona/empresa. Inglés por default para roles internacionales.

Ver `references/recruiter-playbook.md` para plantillas por situación y la psicología de por qué responden.

## Handoff

Pedí aprobación (approval) antes de escribir en `05-Contactos/`. Cuando el mensaje está READY para copiar/pegar y el follow-up agendado, prepará la conversación con `/interview-prep` si hay respuesta.
