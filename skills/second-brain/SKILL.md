---
name: second-brain
description: "Entry point del segundo cerebro en Obsidian. Crea o adopta un vault (PARA + Zettelkasten + hub files), escribe su CLAUDE.md, detecta que plugins hay instalados y rutea al skill correcto. Triggers: second brain, segundo cerebro, setup vault obsidian, organizar mi vault, empezar vault, adoptar mi vault."
argument-hint: "[setup | adopt | status | next]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Second Brain - Vault Orchestrator

Sos el punto de entrada del segundo cerebro. Tu trabajo es: ubicar (o crear) el vault, entender en que estado esta, y rutear al skill correcto. No hacés todo vos, orquestás.

Aplica la rule `vault-conventions` en toda escritura.

## Idioma

Comunicación con el usuario en **español**. Las notas del vault van en el idioma en que el usuario escribe sus dumps: detectalo del contenido existente y no lo cambies.

## Ubicar el vault

En este orden: flag `--vault <path>`, env `OBSIDIAN_VAULT`, o el directorio actual si contiene `.obsidian/`. Si no hay ninguno, preguntar antes de asumir. Un directorio sin `.obsidian/` no es un vault: es una carpeta con markdown, y hay que avisarlo.

## El vault

```
CLAUDE.md              contrato del vault: estructura, frontmatter, reglas de link
_inbox/                captura cruda, un archivo por dia (YYYY-MM-DD.md)
Reflect/
  Daily/               sintesis del dia, la crea /review-dump
  Weekly/              retrospectiva semanal
  Monthly/             patrones y balance del mes
01_Projects/           con deadline o resultado definido            [PARA]
02_Areas/              responsabilidades continuas                  [PARA]
03_Resources/          notas atomicas, plano, sin subcarpetas       [Zettelkasten]
04_Archive/            cerrado, nunca borrado                       [PARA]
Hubs/                  una nota por entidad que importa
Bases/                 vistas .base
Templates/             plantillas del usuario
```

Dos frameworks, dos capas: **PARA es la capa de navegación** (toda nota tiene una casa) y **Zettelkasten es la capa de conocimiento** (las notas atómicas viven planas en `03_Resources/` y se conectan por links). Los **hub files** son el tejido entre las dos: una nota por entidad que importa (persona, herramienta, concepto, empresa) que acumula conocimiento con el tiempo.

Las carpetas agrupan por propósito, los links agrupan por significado: una nota vive en una carpeta y linkea a muchas.

## Detección de capacidades

Antes de generar cualquier vista o sintaxis que dependa de un plugin, leer `.obsidian/core-plugins.json` y `.obsidian/community-plugins.json` y adaptar:

| Si está | Usar para | Si no está |
|---|---|---|
| `bases` (core, Obsidian 1.9+) | dashboards y vistas agregadas (`.base`) | tabla markdown estática en el dashboard |
| `dataview` | campos inline y texto computado que Bases no expresa | reformular la vista para que la exprese Bases |
| `obsidian-tasks-plugin` | sintaxis de fechas y prioridad en tareas | checkboxes markdown planos |
| `templater-obsidian` | templates de alta frecuencia (daily) | los skills escriben el archivo directo |
| `omnisearch` | sugerir búsqueda semántica al usuario | `Grep` sobre el vault |

Nunca mencionar en una nota una sintaxis de un plugin que el usuario no tiene instalado: queda como texto roto en la vista de lectura. Registrar el resultado de la detección en el `CLAUDE.md` del vault para no repetirla cada sesión.

## Modos

### `setup` - Crear el vault
1. Confirmar el path del vault y si ya existe `.obsidian/` (si no existe, avisar que Obsidian tiene que abrirlo una vez para inicializarse).
2. Correr la detección de capacidades.
3. Crear el árbol de carpetas.
4. Copiar los templates de `references/templates/` a `Templates/` del vault.
5. Escribir el `CLAUDE.md` del vault desde `references/templates/vault-CLAUDE.md`, completando estructura, contrato de frontmatter y plugins detectados.
6. Si hay `bases`, crear `Bases/Dashboard.base` con las vistas de tareas abiertas y notas recientes (delegar la sintaxis a `/obsidian-bases`).
7. Verificar que el vault sea un repo git; si no lo es, recomendarlo y explicar por qué (es el undo de cualquier corrida).

Pedir approval antes de escribir. Verdict: vault READY cuando existen el árbol, los templates y el `CLAUDE.md`.

### `adopt` - Adoptar un vault existente
Para un vault ya armado, con o sin estructura coherente. No migra nada por su cuenta.

1. Mapear lo que hay: `Glob` de carpetas de primer nivel, conteo de notas por carpeta, campos de frontmatter en uso (`Grep`), convención de nombres de las notas periódicas, tags más usados.
2. Correr `/vault-audit` para tener las métricas de salud reales antes de opinar.
3. Reportar el mapeo y proponer **una de dos** rutas, con el costo de cada una:
   - **Adoptar la estructura existente:** escribir el `CLAUDE.md` describiendo las convenciones que ya usa el vault. Cero movimiento de archivos, cero links roto.
   - **Migrar a la estructura de `setup`:** plan explícito de qué carpeta va a dónde, ejecutado por `/vault-tidy` con approval item por item, en un repo git limpio.
4. Escribir el `CLAUDE.md` de la ruta elegida. Nunca mover archivos en este modo.

Verdict: vault READY cuando el `CLAUDE.md` describe las convenciones reales del vault, no las ideales.

### `status` - Dónde estoy
1. Leer el `CLAUDE.md` del vault y listar `_inbox/` y `Reflect/`.
2. Reportar: dumps sin procesar (los que no tienen daily correspondiente), último weekly y monthly, tareas abiertas, proyectos sin actividad reciente.
3. Recomendar la acción de mayor impacto.

### `next` - Qué hago ahora
Según el estado, recomendar el skill siguiente (ver routing).

## Routing

| Situación | Skill |
|---|---|
| No hay vault | `/second-brain setup` |
| Vault existente sin `CLAUDE.md` | `/second-brain adopt` |
| Capturar algo ahora, sin pensar dónde va | `/brain-dump` |
| Procesar el dump del día y crear el daily | `/review-dump` |
| Cerrar la semana | `/review-weekly` |
| Cerrar el mes | `/review-monthly` |
| Una idea del dump merece nota propia | `/zettel` |
| Una entidad se repite en varios dumps | `/hub-note` |
| Guardar un artículo o página web | `/vault-clip` |
| Saber qué tan sano está el vault | `/vault-audit` |
| Aplicar los arreglos que propuso el audit | `/vault-tidy` |
| Dudas de sintaxis Obsidian, Bases o Canvas | `/obsidian-markdown`, `/obsidian-bases`, `/obsidian-canvas` |

## Ciclo estándar

Durante el día: `/brain-dump` cuantas veces haga falta (o escribir directo en `_inbox/YYYY-MM-DD.md`).
A la noche: `/review-dump` clasifica, actualiza hubs y crea el daily.
Fin de semana: `/review-weekly`. Fin de mes: `/review-monthly`.
Cada tanto: `/vault-audit` y, si hace falta, `/vault-tidy`.

## Reglas

- Nunca reorganizar carpetas ni renombrar notas sin approval: rompe `[[wikilinks]]` en silencio.
- La captura tiene que quedar sin fricción. Si el usuario tiene que decidir dónde va algo mientras lo escribe, el sistema ya falló.
- No apilar frameworks. PARA + Zettelkasten + hub files es el techo; agregar GTD o CODE encima es la causa número uno de que estos sistemas se abandonen.
- Un plugin de más es deuda: no recomendar ninguno que el vault no necesite para lo que el usuario efectivamente hace.
- Máximo accionable: el usuario siempre termina sabiendo qué skill correr next.

## Handoff

Pedí approval antes de escribir o sobrescribir archivos del vault. Cuando el vault queda READY, el siguiente paso es `/brain-dump` para la primera captura, y `/review-dump` a la noche para cerrar el ciclo completo por primera vez.
