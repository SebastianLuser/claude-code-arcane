---
name: review-weekly
description: "Retrospectiva semanal del vault: lee los dumps y dailies de la semana, extrae temas recurrentes e hilos abiertos, cuenta tareas hechas y no hechas, y crea el weekly. Triggers: review semanal, cerrar la semana, retrospectiva de la semana, weekly review, que paso esta semana."
argument-hint: "[current | YYYY-Www | YYYY-MM-DD]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Review Weekly - Cerrar la semana

Subís un nivel de abstracción: el daily registra, el weekly detecta patrones. Lo que buscás son los temas que se repitieron y los hilos que quedaron abiertos, no un resumen de siete resúmenes.

Semana a procesar: `$ARGUMENTS` (default: la semana en curso, lunes a domingo)

Aplica la rule `vault-conventions`.

## Fase 1 - Leer la semana

1. **Ubicar el vault** y leer su `CLAUDE.md`.
2. **Resolver el rango**: si el argumento es una fecha, la semana ISO que la contiene; si es `YYYY-Www`, esa; si no hay argumento, la semana en curso.
3. **Leer los `Reflect/Daily/` del rango y sus dumps de `_inbox/`.** Los dailies dan la síntesis, los dumps dan lo que no llegó a la síntesis. Faltan dailies casi siempre: anotá qué días quedaron sin procesar y ofrecé `/review-dump` para esos días antes de seguir, porque un weekly sobre dumps crudos es peor.
4. **No leer el vault entero.** Solo el rango, más los hubs que los dailies de la semana efectivamente linkean.

## Fase 2 - Extraer

1. **Temas:** de 3 a 5 asuntos que aparecen en dos días o más. Cada tema con los dailies donde aparece. Un tema que aparece un solo día no es un tema, es un evento.
2. **Hilos abiertos:** preguntas o decisiones pendientes, distintas de una tarea. "Definir si migramos" es un hilo; "mandar el mail" es una tarea.
3. **Tareas:** conteo de hechas y de no hechas, con las no hechas nombradas una por una. No suavizar el número ni omitirlas.
4. **Notas que crecieron:** hubs y notas atómicas que recibieron contenido en la semana.
5. **Señales, si aparecen:** un tema que se repite tres semanas seguidas sin avanzar, o un proyecto sin una sola mención en toda la semana. Reportarlas como observación, sin diagnóstico ni consejo.

## Fase 3 - Escribir

Con approval sobre lo extraído, crear `Reflect/Weekly/YYYY-Www.md` desde `Templates/Weekly.md`, con links a los dailies de la semana. Si el weekly ya existe, actualizarlo sin duplicar secciones.

Los links van hacia arriba: el weekly linkea a los dailies. Ningún daily se edita para linkear al weekly.

La sección `## Reflexión` queda vacía para el usuario.

Review COMPLETE cuando existe el weekly con temas, hilos y el conteo real de tareas.

## Reglas

- Sin interpretación: reportás lo que pasó y lo que se repitió, no qué significa ni qué debería hacer el usuario.
- Las tareas no hechas se nombran. Un weekly que las esconde no sirve para nada.
- Idempotente: correrlo dos veces sobre la misma semana no duplica nada.
- Solo el rango de la semana: nunca reescribir dailies ni dumps pasados desde acá.
- Sin guiones largos.

## Handoff

Con el weekly listo, el siguiente paso es seguir con `/brain-dump` la semana que viene, y al cierre del mes `/review-monthly`, que lee los weeklies y no los dailies. Si el weekly dejó al descubierto un tema que ya merece nota propia, `/zettel` o `/hub-note`.
