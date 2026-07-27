---
name: vault-tidy
description: "Aplica los arreglos que reporto /vault-audit con approval item por item: linkear huerfanas, resolver nombres duplicados, cancelar tareas arrastradas, completar frontmatter y archivar. Nunca borra. Triggers: limpiar el vault, arreglar huerfanas, vault tidy, aplicar el audit, ordenar el vault, resolver links roto."
argument-hint: "[orphans | broken | duplicates | tasks | frontmatter | archive | all]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Vault Tidy - Aplicar los arreglos

Sos la única skill del profile que edita notas existentes en volumen, y por eso la más peligrosa. Cada cambio se propone y se aprueba: no hay modo batch, no hay "arreglo todo y te cuento después".

Categoría a arreglar: `$ARGUMENTS` (default: preguntar cuál, nunca `all` por omisión)

Aplica la rule `vault-conventions`.

## Fase 1 - Antes de tocar nada

1. **Ubicar el vault** y leer su `CLAUDE.md`: el contrato de frontmatter y la estructura salen de ahí, no de tus defaults.
2. **Verificar git.** Si el vault es un repo y el árbol está sucio, parar y pedir commit primero. Esta skill es la que más justifica tener git: es el único undo real de una corrida de 30 ediciones.
3. **Correr `/vault-audit`** y trabajar sobre esos hallazgos. Nunca decidir a ojo qué arreglar.
4. **Acotar la corrida.** Si el usuario pidió `all`, proponer partirla por categoría y arrancar por la de mayor impacto. Una corrida de 200 ediciones no se puede revisar y por lo tanto no se puede aprobar de verdad.

## Fase 2 - Los arreglos, por categoría

### `duplicates` - Nombres duplicados
El más urgente: dos archivos con el mismo nombre hacen que todo `[[link corto]]` a ese nombre resuelva impredecible.

Para cada par: mostrar las dos notas y proponer renombrar la menos linkeada, o fusionarlas si son la misma cosa. **El rename lo hace el usuario en Obsidian**, no vos: Obsidian actualiza los wikilinks cuando el rename pasa dentro de la app, y desde el filesystem se rompen en silencio. Tu entregable acá es la lista de renames a hacer y el orden.

### `orphans` - Huérfanas
Para cada huérfana: leerla, proponer el hub o la nota desde donde linkearla, y agregar el link **en el hub**, no en la huérfana. El link entrante es el que la hace encontrable.

Si varias huérfanas son del mismo tema, el arreglo no es linkearlas una por una: es crear el hub que falta con `/hub-note` y linkearlas desde ahí. Decilo antes de empezar a parchear.

### `broken` - Links roto
Clasificar cada uno antes de tocarlo:

- **Typo:** el target existe con otro nombre. Corregir el link.
- **Intención:** la nota no existe todavía y el link es un recordatorio. **Se deja.** Un link roto intencional es una nota pendiente, no un error, y borrarlo destruye información.
- **Basura:** link a algo que ya no aplica. Quitar el link, dejar el texto.

Preguntá cuál es cuando no se pueda deducir del contexto. No adivines.

### `tasks` - Tareas arrastradas
Para cada tarea abierta en un día que ya cerró: marcarla `- [-]` en su día original y preguntar si sigue vigente. Si sigue, crearla en la nota del proyecto o en el dump de hoy. Nunca mover la original.

### `frontmatter` - Contrato
Completar los campos ausentes del contrato del vault. `created` se deduce del nombre del archivo si tiene fecha, o del mtime; `type` se deduce de la carpeta. Si no se puede deducir, preguntar. **Nunca sobrescribir un `created` que ya existe**, aunque parezca incorrecto: es dato histórico.

### `archive` - Archivar
Mover a `04_Archive/` lo que el usuario confirme cerrado, preservando el nombre. **Nunca borrar nada.** El movimiento va con la misma advertencia que el rename: si hay notas que linkean a la que se mueve, avisar cuáles y dejar que el usuario lo haga desde Obsidian.

## Fase 3 - Aplicar y reportar

1. Proponer los cambios en una tabla: nota, qué cambia, por qué. Agrupar los mecánicos idénticos para no hacer 40 preguntas, y preguntar uno por uno los que requieren criterio.
2. Aplicar solo lo aprobado, con `Edit` sobre citas textuales para no tocar nada alrededor.
3. Reportar qué se cambió y qué quedó pendiente, y recordar el commit.

Tidy COMPLETE cuando los cambios aprobados están aplicados y el resto quedó explícitamente pendiente, no olvidado.

## Reglas

- **Nunca borrar una nota.** Archivar.
- **Nunca renombrar ni mover desde el filesystem** sin avisar que rompe wikilinks: proponé que lo haga el usuario desde Obsidian.
- Nada de ediciones en masa sin approval, ni siquiera las triviales.
- No tocar `Templates/` ni `.obsidian/`.
- No reescribir contenido del usuario: agregás links y frontmatter, no editás su prosa.
- Sin guiones largos.

## Handoff

Con los arreglos aplicados, volver a correr `/vault-audit` para confirmar que los números se movieron: si un hallazgo sigue igual, el arreglo no era el correcto. Si la corrida dejó al descubierto temas sin hub, el siguiente paso es `/hub-note`.
