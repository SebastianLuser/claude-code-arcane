---
name: cold-outreach
description: "Write cold LinkedIn/email messages from a job-seeker to recruiters, hiring managers and referrals - plus post-application follow-up sequences that get replies. For B2B sales outreach use cold-email instead. Triggers: mensaje en frio recruiter, escribirle a un reclutador, follow up postulacion, networking message, pedir referido, contactar hiring manager."
argument-hint: "[contact-note | recruiter + company]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, WebFetch
---

# Cold Outreach - Job-seeker → Recruiter / Hiring Manager

Escribís mensajes en frío de un **candidato** a recruiters, hiring managers y referidos, y secuencias de **follow-up** post-aplicación que reciben respuesta. Esto NO es venta B2B (para eso está `/cold-email`) - el ángulo es conseguir una conversación o un referido, sin sonar a spam ni a desesperación.

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
- **Corto.** LinkedIn: 50-125 palabras. La nota de invitación: hasta 200 caracteres en cuentas gratis (contalos y mostrá el conteo).
- **Notas de invitación contadas.** Una cuenta gratis puede agregar nota a muy pocas invitaciones por mes (3 según el Help de LinkedIn al revisarlo; LinkedIn lo cambia). Gastalas en las personas que importan; al resto invitá sin nota y escribí el primer mensaje cuando acepten.
- **Si no hay una razón concreta para escribirle hoy, decilo.** Un mensaje sin razón es el que manda todo el mundo.
- **Una pregunta / un CTA.** Bajá la fricción de responder.
- **Vos resolvés algo para ellos**, no "estoy buscando trabajo, ¿me ayudás?". El foco es el valor que aportás al equipo.
- **Sin paredes de texto, sin CV adjunto en el primer toque** (salvo que lo pidan).
- **Respetá el "no".** Un follow-up, máximo dos. Nunca insistir agresivo.

## La nota de invitación

`{una referencia concreta a esa persona} + {una línea de quién sos} + {sin pedido}`. La nota no pide nada: existe para que aceptar sea obvio.

```
Vi tu charla sobre migrar el monolito a eventos; nosotros hicimos lo mismo en 2025.
Soy backend dev en Go. Me gustaría seguir lo que publicás.            [142/200]
```

## Estructura de un primer mensaje

Esperá un día después de que acepten. Después:

1. **Gancho personal** (1 línea): por qué *a esta persona*; si hubo nota, retomá lo mismo (la continuidad es la razón de que la nota fuera concreta).
2. **Quién sos + fit** (1-2 líneas): rol + el logro más relevante para ellos. Dá algo antes de pedir: un dato, una idea sobre su producto, un link útil.
3. **CTA suave** (1 línea): ¿15 min para charlar? / ¿abierto a una intro? / dejé mi aplicación, encantado de dar contexto. Un solo pedido, chico. **Sin link de calendario en el primer mensaje**: se lee como embudo.

## Secuencia de follow-up post-aplicación

- **Día 0** - aplicación enviada (+ mensaje al recruiter/hiring manager si tenés el contacto).
- **Día 4-5** - follow-up 1: reafirmá interés + agregá *algo nuevo* (un proyecto relevante, una idea sobre su producto). No "¿novedades?".
- **Día 10-12** - follow-up 2 (último): breve, profesional, dejá la puerta abierta. Si no hay respuesta, cerrás el loop con dignidad.

Cada follow-up debe tener un **gancho propio** y leerse solo, sin depender de los anteriores. Si no tenés nada nuevo para decir, no hay follow-up. Nunca "solo quería hacer seguimiento". Después del segundo, parás: un tercero no convierte y gasta la relación.

## Nunca

- Automatizar invitaciones o mensajes, ni con herramientas de terceros: el User Agreement (sección 8.2) prohíbe bots y métodos automatizados para agregar contactos o mandar mensajes, y LinkedIn restringe las cuentas que lo hacen. LinkedIn también limita cuántas invitaciones podés mandar: pocas y dirigidas.
- Inventar una conexión en común, una escuela compartida o haber leído algo que el usuario no leyó.
- Abrir con "Espero que este mensaje te encuentre bien" / "I hope this message finds you well".

Todo mensaje pasa por `/content-humanizer` (`.claude/skills/content-humanizer/scripts/humanize.py` + `detect.py` de la misma carpeta) antes de mostrarlo. Nota de invitación, primer mensaje y follow-ups adaptados de linkedin-agent-skill de Jake Schincariol (MIT).

## Proceso

1. Leer la nota de `05-Contactos/` (o crearla) y la de `04-Empresas/`.
2. Investigar a la persona (rol, equipo, algo reciente) - WebFetch del perfil público si hay URL.
3. Elegir variante + canal.
4. Draftear mensaje + 1 variante de apertura.
5. Registrar en `05-Contactos/` (historial de interacciones) y planificar el follow-up.

> Nota: Claude no accede a tu LinkedIn ni envía mensajes - redacta para que vos copies/pegues y registres la interacción.

## Idioma

Espejá el idioma de la persona/empresa. Inglés por default para roles internacionales.

Ver `references/recruiter-playbook.md` para plantillas por situación y la psicología de por qué responden.

## Handoff

Pedí aprobación (approval) antes de escribir en `05-Contactos/`. Cuando el mensaje está READY para copiar/pegar y el follow-up agendado, prepará la conversación con `/interview-prep` si hay respuesta.
