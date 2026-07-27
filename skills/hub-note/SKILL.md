---
name: hub-note
description: "Crea o actualiza un hub file (MOC) del vault: una nota por entidad que importa (persona, herramienta, concepto, empresa) que acumula conocimiento y conecta PARA con Zettelkasten. Triggers: hub file, MOC, mapa de contenido, nota de entidad, crear hub de, actualizar hub, nota de persona."
argument-hint: "[entidad] [--update]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Hub Note - Tejido conectivo del vault

Un hub file es una nota por entidad que importa. No contiene conocimiento propio: contiene **el estado actual** de esa entidad y **los links** a todo lo que se sabe de ella. Es lo que hace que PARA (carpetas) y Zettelkasten (notas planas) convivan sin pelearse.

Entidad: `$ARGUMENTS`

Aplica la rule `vault-conventions`.

## Fase 1 - Decidir si la entidad merece hub

El criterio es la recurrencia, no la importancia: **la entidad apareció en tres dumps o notas distintas**. Antes de eso es una mención, y un hub por mención produce cientos de notas de una línea que nadie visita.

1. `Grep` en `_inbox/`, `Reflect/` y `03_Resources/` por el nombre de la entidad y sus variantes.
2. Contar apariciones y reportarlas con los links.
3. Si hay menos de tres, decirlo y proponer esperar. Si el usuario quiere el hub igual (una persona nueva en el equipo, un proyecto que arranca), se crea: la anticipación es un motivo válido, la duda no.

Verdict: PASS si hay tres apariciones o una razón explícita del usuario.

## Fase 2 - Buscar el hub existente

`Glob` en `Hubs/` y revisar los `aliases` del frontmatter de los hubs que haya. Las entidades llegan con nombres distintos ("Educabot", "educabot", "EB"): si ya existe un hub para la entidad bajo otro nombre, **actualizar ese** y agregar el nombre nuevo a `aliases`. Nunca crear un segundo hub para la misma entidad: es el duplicado más caro del vault, porque parte el conocimiento en dos lugares que nadie reconcilia.

## Fase 3 - Escribir

Con approval, crear o actualizar el hub en `Hubs/` desde `Templates/Hub.md`.

Al **crear**:
- Título: el nombre canónico de la entidad. Las variantes van a `aliases`.
- Una o dos líneas de qué es y por qué tiene nota propia.
- `## Estado actual`: lo que hay que saber hoy.
- `## Notas`: links a las notas atómicas y proyectos del tema que ya existan (los que encontraste en la fase 1).
- `## Historial`: una línea por aparición relevante, formato `- YYYY-MM-DD - qué pasó`, lo más nuevo arriba.

Al **actualizar** (`--update`, o cuando el hub ya existe):
- Agregar la entrada nueva al `## Historial`, sin duplicar una que ya esté con la misma fecha y el mismo contenido.
- **`## Estado actual` se reescribe, no se acumula.** Es la sección que responde "qué sé hoy de esto"; si se convierte en un log, el hub deja de servir para lo único que sirve. Lo que se reemplaza y sigue siendo relevante baja al historial.
- `## Notas`: agregar los links nuevos.

## Fase 4 - Conectar

- El hub linkea hacia las notas atómicas y los proyectos. Los dumps y dailies linkean **hacia** el hub. El hub no linkea a dumps ni a dailies: son registro, no conocimiento, y llenan el hub de ruido en un mes.
- Si el hub cubre un tema amplio y ya pasó las 30 o 40 entradas en `## Notas`, proponer partirlo en sub-hubs por subtema. Un hub que nadie puede leer de arriba a abajo dejó de ser un mapa.

Hub COMPLETE cuando tiene estado actual, al menos un link saliente, y las apariciones encontradas quedaron en el historial.

## Reglas

- Un hub por entidad. Los alias van al frontmatter, no a un hub nuevo.
- El hub no acumula conocimiento propio: si querés explicar una idea, es una nota atómica (`/zettel`) linkeada desde acá.
- Nunca borrar entradas del historial: si algo dejó de ser cierto, se agrega la entrada nueva.
- Sin guiones largos.

## Handoff

Con el hub listo, el siguiente paso es `/zettel` para las ideas del tema que todavía no tienen nota propia, o volver a `/review-dump` si esto salió procesando el día. `/vault-audit` va a usar los hubs para distinguir una huérfana real de una nota que simplemente todavía no fue linkeada.
