---
name: zettel
description: "Crea una nota atomica en el vault a partir de una idea, un fragmento del dump o una nota de proyecto, con el criterio de cuando algo merece nota propia y a que linkearla. Triggers: nota atomica, zettel, esto merece nota propia, crear nota permanente, graduar esta idea, nota de concepto."
argument-hint: "[idea | ruta#seccion | dump YYYY-MM-DD]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Zettel - Nota atómica

Creás una nota que contiene **una** idea, escrita para que se entienda sola en dos años y linkeada al resto del vault. La mitad del trabajo es decidir si la nota tiene que existir.

Idea o fuente: `$ARGUMENTS`

Aplica la rule `vault-conventions`.

## Fase 1 - Decidir si merece nota propia

Una idea merece nota atómica propia cuando pasa **las tres**:

1. **Es verdadera fuera del contexto que la produjo.** Si solo tiene sentido dentro del proyecto donde apareció, es una nota de proyecto y se queda ahí.
2. **La linkearías desde otra nota.** Si no se te ocurre ni un lugar desde donde apuntar a esto, todavía no es conocimiento: es un registro.
3. **El título puede afirmar algo.** "Los índices parciales pagan en tablas con lecturas sesgadas" es una idea. "Postgres" es un tema, y los temas son hub files, no notas atómicas.

Si falla alguna, decirlo y proponer el destino real: se queda en el dump, va a la nota del proyecto, o va al `## Historial` de un hub. Verdict de esta fase: PASS solo si las tres se cumplen. No crear la nota para no dejar al usuario con las manos vacías: una nota atómica de más ensucia el grafo para siempre.

## Fase 2 - Buscar duplicados

Antes de escribir, `Grep` en `03_Resources/` por los términos del título y sus sinónimos obvios. Si ya hay una nota que cubre la idea:

- **Misma idea:** proponer ampliar la nota existente en vez de crear otra. Es el caso más frecuente y el que evita el vault con cinco notas del mismo concepto bajo cinco nombres.
- **Idea relacionada pero distinta:** crear la nueva y linkear ambas explícitamente, con una línea de por qué se distinguen.

## Fase 3 - Escribir

Con approval sobre el título y el destino, crear la nota en `03_Resources/` desde `Templates/Atomic.md`:

- **Título como afirmación**, no como etiqueta. Es el nombre del archivo y lo que vas a ver en el autocompletado de links dentro de tres años.
- **La idea en las palabras del usuario**, no en las de la fuente. Si es una cita, va entre comillas con su fuente; el cuerpo de la nota es la reformulación.
- **Sección `## Por qué me importa`:** una o dos líneas sobre qué problema del usuario toca. Es lo que separa una nota atómica de un resumen de Wikipedia. Si el usuario no lo dijo, preguntar en una línea, no inventarlo.
- **Sección `## Relacionado`:** al menos un `[[wikilink]]`, siempre. Si no hay a qué linkear, falta el hub del tema: crearlo con `/hub-note` antes de cerrar esta nota.
- **Sección `## Fuente`:** el clip, el libro, la conversación, o "propia" si salió del usuario.

Si la idea vino de una nota de proyecto o de un dump, **la fuente no se vacía**: la línea original se queda donde estaba y se le agrega el link a la nota nueva.

## Fase 4 - Conectar

1. Linkear la nota desde el hub del tema (sección `## Notas` del hub). El link del hub a la nota es el que la hace encontrable.
2. Si la nota discute o contradice otra nota atómica, linkearlas entre sí con una línea de por qué. Las conexiones entre notas atómicas son laterales y sí son bidireccionales: es el único caso donde la regla de "links hacia arriba" no aplica, porque acá no hay jerarquía.

Nota COMPLETE cuando existe, tiene al menos un link entrante desde un hub y al menos uno saliente.

## Reglas

- Una idea por nota. Si necesitás dos `##` que no se relacionan, son dos notas.
- Nunca vaciar la fuente de la que salió la idea.
- No crear la nota si falla el criterio de graduación, aunque el usuario lo haya pedido: explicá por qué y proponé el destino correcto. Si insiste, se crea.
- Sin guiones largos.

## Handoff

Con la nota creada, el siguiente paso es `/hub-note` si el tema todavía no tiene hub, o volver a `/review-dump` si esto salió en medio de procesar un día. Al cierre de la semana `/review-weekly` va a levantar la nota como parte de lo que creció.
