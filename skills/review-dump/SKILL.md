---
name: review-dump
description: "Procesa el dump del dia en el vault: clasifica item por item con confirmacion, actualiza hub files, rutea tareas a su nota y crea el daily con la sintesis. Triggers: review dump, procesar el dump, cerrar el dia, revisar el inbox, clasificar lo que capture, crear el daily."
argument-hint: "[today | YYYY-MM-DD]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Review Dump - Clasificar el día

Convertís el dump crudo en estructura. Es la sesión donde el vault se ordena, y la única del ciclo diario que escribe en varios lugares: por eso va item por item, con confirmación, y nunca en batch silencioso.

Día a procesar: `$ARGUMENTS` (default: hoy)

Aplica la rule `vault-conventions`.

## Fase 1 - Preparación

1. **Ubicar el vault** (`--vault`, env `OBSIDIAN_VAULT`, o directorio actual con `.obsidian/`) y leer su `CLAUDE.md`: de ahí salen la estructura real, el contrato de frontmatter y los plugins disponibles. Si no hay `CLAUDE.md`, ofrecer `/second-brain adopt` y parar.
2. **Verificar git.** Si el vault es un repo y el árbol está sucio, avisarlo antes de escribir: esta corrida toca varias notas y git es el undo.
3. **Leer el dump** `_inbox/YYYY-MM-DD.md`. Si no existe, decirlo y ofrecer `/brain-dump`. Si ya existe el daily de ese día, avisar que se va a actualizar y no duplicar secciones.
4. **Inventariar el vault una sola vez**: `Glob` de `Hubs/`, `01_Projects/`, `02_Areas/` y `03_Resources/`. Sirve para proponer destinos reales y detectar entidades ya existentes sin releer el vault por cada item.

## Fase 2 - Clasificación item por item

Para cada línea del dump, proponer un destino y esperar confirmación. Una línea por propuesta, agrupando las obvias para no hacer 30 preguntas:

| Lo que es | Destino |
|---|---|
| Tarea de un proyecto existente | La nota del proyecto en `01_Projects/` |
| Tarea del día sin proyecto | Se queda en el dump |
| Idea que se sostiene sola | Nota atómica nueva en `03_Resources/` (delegar a `/zettel`) |
| Mención de una entidad con hub existente | Entrada en `## Historial` de ese hub |
| Mención de una entidad recurrente sin hub | Proponer hub nuevo (delegar a `/hub-note`) |
| URL para leer después | Se queda en el dump, o `/vault-clip` si el usuario lo quiere ahora |
| Ruido, duplicado, ya resuelto | Nada: se deja en el dump y se marca resuelto |

Reglas de la clasificación:

- **Proponé, no decidas.** Cada movimiento se confirma. Si el usuario dice que no, el item se queda en el dump: quedarse es un destino válido y no es un fracaso.
- **Una entidad merece hub cuando aparece en tres dumps distintos**, no la primera vez. Antes de eso es una mención, no un tema.
- **Una idea merece nota atómica cuando el usuario podría querer linkearla desde otra cosa.** Si solo tiene sentido dentro del día en que se escribió, se queda en el dump.
- No inventes destinos: las carpetas y los hubs propuestos tienen que existir en el inventario, o crearse explícitamente.

## Fase 3 - Tareas

Aplicar la regla de arrastre sin excepción:

1. Buscar tareas abiertas en los dumps de días anteriores (últimos 7 días alcanza).
2. Las que sigan abiertas se marcan `- [-]` (canceladas) **en su día original**, con el motivo si el usuario lo dice. No se mueven.
3. Si la tarea sigue vigente, se crea de nuevo: en la nota del proyecto si tiene uno, o en el dump de hoy.
4. Si hay plugin `obsidian-tasks-plugin`, usar su sintaxis de fecha y prioridad; si no, checkbox plano. No mezclar.

Verdict de esta fase: PASS cuando ninguna tarea quedó duplicada entre un día viejo y el nuevo.

## Fase 4 - Escribir

Con approval sobre lo recolectado, en este orden:

1. Notas atómicas nuevas y hubs nuevos (para que existan antes de que algo los linkee).
2. Actualización de hubs existentes: entrada en `## Historial`, y reescritura de `## Estado actual` solo si cambió de verdad.
3. Tareas en las notas de proyecto.
4. El daily en `Reflect/Daily/YYYY-MM-DD.md` desde `Templates/Daily.md`: link al dump, síntesis de 3 a 5 líneas, links a las notas creadas, y el estado real de las tareas del día.
5. El dump queda como está, salvo las marcas de tarea. **El dump no se borra ni se vacía nunca:** es el registro crudo de lo que pasó ese día.

Los links van hacia arriba: el daily linkea al dump y a las notas creadas; ninguna nota atómica linkea de vuelta al daily.

## Fase 5 - Cierre

1. Reportar en una tabla qué se creó, qué se actualizó y qué quedó en el dump.
2. La sección `## Reflexión` del daily queda vacía: la escribe el usuario. No la completes ni la sugieras.
3. Si el vault es un repo git, recordar el commit.

Review COMPLETE cuando existe el daily, los hubs tocados quedaron consistentes y ninguna tarea quedó duplicada.

## Reglas

- Escribir los hechos, no interpretarlos: la síntesis dice qué pasó, no qué significa.
- Idempotente: correr el review dos veces sobre el mismo día no duplica entradas de historial ni secciones del daily.
- Nunca borrar contenido del dump.
- Sin guiones largos en nada de lo que escribas.
- Si el dump tiene más de 40 items, proponer procesar por bloques temáticos en vez de item por item, y decir por qué.

## Handoff

Con el daily listo, el siguiente paso depende del día: durante la semana volver a `/brain-dump`, y al cierre `/review-weekly` para extraer los temas de la semana. Si la corrida dejó varias entidades sin hub o varias ideas sin nota, `/hub-note` y `/zettel` son los pasos puntuales.
