---
name: review-monthly
description: "Retrospectiva mensual del vault: lee los weeklies del mes, detecta patrones que no se ven en una semana, registra logros con evidencia y deja semillas para el mes siguiente. Triggers: review mensual, cerrar el mes, retrospectiva del mes, monthly review, patrones del mes."
argument-hint: "[current | YYYY-MM]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Review Monthly - Cerrar el mes

El nivel más alto del ciclo. El daily registra, el weekly detecta temas, el monthly detecta lo que ninguna semana sola muestra: qué avanzó de verdad, qué se repite sin moverse y qué merece atención el mes que viene.

Mes a procesar: `$ARGUMENTS` (default: el mes en curso)

Aplica la rule `vault-conventions`.

**Rutas por rol:** los destinos se nombran por rol y la ruta real de cada uno sale del `## Rutas` del `CLAUDE.md` del vault. Los defaults entre paréntesis solo aplican si el vault no declara otra cosa.

## Fase 1 - Leer el mes

1. **Ubicar el vault** y leer su `CLAUDE.md`.
2. **Leer los weeklies del mes (rol `weekly`).** Los weeklies son la fuente: no releas los dailies ni los dumps, ese trabajo ya está hecho y releerlo quema contexto sin agregar nada. Si faltan weeklies, listarlos y ofrecer `/review-weekly` para esas semanas antes de seguir.
3. **Correr `/vault-audit`** para tener las métricas de salud del vault del mes (huérfanas, notas stale, semillas que no crecieron, notas `contested`, tareas viejas abiertas). El monthly es el momento natural del ciclo para mirarlas.
4. **Presupuesto de lectura:** los weeklies del mes más el reporte del audit. Techo de 15 lecturas. Si faltan weeklies, se listan y se para: un monthly sobre dailies crudos cuesta diez veces más y sale peor.

## Fase 2 - Extraer

1. **Patrones:** lo que se repite a lo largo de varias semanas. Distinto de un tema semanal: un patrón es un tema que sobrevivió al mes.
2. **Logros:** lo que efectivamente se cerró, cada uno con link a la nota que lo respalda. Sin evidencia linkeable no es un logro, es una impresión.
3. **Lo que no se movió:** proyectos abiertos sin actividad en el mes, hilos que siguen abiertos desde la primera semana. Se nombran.
4. **Semillas:** lo que apareció este mes y merece seguimiento, con el link a donde apareció.
5. **Salud del vault:** las tres o cuatro métricas del audit que cambiaron respecto del mes anterior, si hay un monthly previo para comparar.
6. **Contradicciones sin resolver:** las notas que el audit reporta como `contested`, cada una con el bloque `> [!warning] Contradicción sin resolver` que trae las dos posiciones y su fuente (mismo formato que usa `/review-weekly`). No las resuelvas: mostralas, con desde cuándo están abiertas. Que el vault te avise cuándo se contradice consigo mismo es una función, no un defecto. Si el usuario resuelve una en el momento, la resolución es una nota atómica nueva que linkea a las dos, y recién ahí se les saca el `contested`.

## Fase 3 - Escribir

Con approval sobre lo extraído, crear `<monthly>/YYYY-MM.md` (default `Reflect/Monthly/`) desde `<templates>/Monthly.md`, con links a los weeklies del mes. Si ya existe, actualizarlo sin duplicar secciones.

Los links van hacia arriba: el monthly linkea a los weeklies y a las notas que respaldan los logros. No se edita ningún weekly desde acá.

La sección `## Reflexión` queda vacía para el usuario.

Review COMPLETE cuando existe el monthly con patrones, logros con evidencia y el estado de salud del vault.

## Reglas

- Un logro sin link no se escribe.
- Lo que no avanzó se reporta con el mismo detalle que lo que avanzó.
- Sin coaching: no proponés objetivos ni planes de mejora salvo que el usuario los pida.
- Idempotente: correrlo dos veces sobre el mismo mes no duplica nada.
- Sin guiones largos.

## Handoff

Con el monthly listo, si el audit reportó problemas el siguiente paso es `/vault-tidy` para aplicar los arreglos con approval. Si el mes dejó semillas que ya son ideas formadas, `/zettel`. Si no, se vuelve al ciclo diario con `/brain-dump`.
