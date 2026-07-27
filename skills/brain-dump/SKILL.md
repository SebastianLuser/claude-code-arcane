---
name: brain-dump
description: "Captura sin friccion al dump del dia en el vault de Obsidian: tareas, ideas, links, transcripciones. Sin tags, sin decidir donde va. Triggers: anota, capturar, brain dump, tirame esto al vault, apunta esto, agregar al inbox, dump del dia."
argument-hint: "[texto a capturar]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Write, Edit
---

# Brain Dump - Captura sin fricción

Agregás lo que el usuario te pasa al dump del día y te callás. Este skill existe para que capturar cueste cero: el momento en que el usuario tiene que pensar "¿dónde va esto?", el sistema ya falló.

Contenido a capturar: `$ARGUMENTS`

Aplica la rule `vault-conventions`.

## Pasos

1. **Ubicar el vault.** Flag `--vault <path>`, env `OBSIDIAN_VAULT`, o el directorio actual si contiene `.obsidian/`. Si no hay vault, decirlo en una línea y ofrecer `/second-brain setup`. No inventar una carpeta.

2. **Abrir el dump de hoy.** `_inbox/YYYY-MM-DD.md` con la fecha de hoy. Si no existe, crearlo desde `Templates/Dump.md` del vault (o con el frontmatter mínimo `created`, `type: dump`, `tags: []` si el template no está).

3. **Agregar el contenido al final**, una línea por cosa, sin reordenar ni reescribir lo que ya había:
   - Lo que suena a tarea va como `- [ ] <texto>`. Lo que suena a idea, nota o link va como `- <texto>`.
   - URLs sueltas se dejan crudas, con el título de la página al lado solo si el usuario lo dio. No abrir la URL: eso es `/vault-clip`.
   - Se preserva la redacción del usuario. No corregís su ortografía ni su registro, no resumís, no traducís.

4. **Si no vino contenido en `$ARGUMENTS`**, preguntar qué capturar en una sola línea y esperar. No abrir un cuestionario.

5. **Confirmar en una línea** qué se agregó y a qué archivo. Nada más: el usuario está en medio de otra cosa.

## Approval

La invocación del skill es la aprobación para agregar al dump de hoy: pedir confirmación en cada captura destruiría el punto del skill. Los límites son estrictos en cambio para todo lo demás: **pedí approval explícito antes de escribir fuera de `_inbox/`**, antes de editar líneas que ya estaban en el dump, y antes de crear cualquier nota en `03_Resources/` o `Hubs/`. Clasificar es trabajo de `/review-dump`, no de acá.

## Reglas

- No clasificar, no taggear, no linkear, no crear notas nuevas. Nada de eso pasa en la captura.
- No juzgar el contenido ni sugerir mejoras. Es un dump, no un borrador.
- Nunca reescribir ni reordenar lo que ya estaba en el archivo: solo append.
- Sin guiones largos en lo que agregues de tu parte.
- Si el usuario captura algo que claramente es una tarea de un proyecto que existe, **igual va al dump**. La ruteada la hace el review, así el usuario nunca decide en el momento.

## Handoff

Captura COMPLETE cuando el contenido está en el dump del día. A la noche, o cuando el usuario quiera cerrar el día, el siguiente paso es `/review-dump` para clasificar todo lo capturado y generar el daily.
