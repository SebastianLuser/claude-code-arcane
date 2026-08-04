# <NOMBRE DEL VAULT>

Vault de Obsidian usado como segundo cerebro. Este archivo es el contrato: Claude Code lo lee al inicio de cada sesión y de acá saca dónde va cada cosa. Si una convención cambia, se cambia acá primero.

## Quién soy

<Rol, en qué proyectos estoy, qué temas me interesan. Dos o tres líneas: sirve para que las síntesis tengan contexto y no sean genéricas.>

## Rutas

Contrato de rutas: los skills escriben en **roles**, y esta tabla dice qué carpeta es cada rol en este vault. Si cambiás una carpeta de lugar, se cambia acá y todo lo demás sigue funcionando.

| Rol | Ruta en este vault |
|---|---|
| `inbox` | `_inbox` |
| `daily` | `Reflect/Daily` |
| `weekly` | `Reflect/Weekly` |
| `monthly` | `Reflect/Monthly` |
| `atomic` | `03_Resources` |
| `hubs` | `Hubs` |
| `projects` | `01_Projects` |
| `areas` | `02_Areas` |
| `archive` | `04_Archive` |
| `templates` | `Templates` |

Y tres archivos fijos en la raíz: este `CLAUDE.md` (el contrato), `hot.md` (el caché de contexto reciente, lo reescribe `/review-dump`) y `codebases.md` (el puente a los repos, si hay código).

Un rol que este vault no usa se marca `(no usa)` en vez de borrar la fila: así queda explícito que la ausencia fue una decisión.

Los scripts reciben esto por flag: `--role hubs=Hubs --role atomic=03_Resources`.

## Estructura

| Carpeta | Qué vive acá |
|---|---|
| `_inbox/` | Captura cruda, un archivo por día (`YYYY-MM-DD dump.md`). Sin estructura, sin tags, sin pensar. El sufijo evita que el nombre choque con el del daily. |
| `Reflect/Daily/` | Síntesis del día (`YYYY-MM-DD.md`), la crea `/review-dump`. |
| `Reflect/Weekly/` | Retrospectiva semanal (`YYYY-Www.md`). |
| `Reflect/Monthly/` | Balance del mes (`YYYY-MM.md`). |
| `01_Projects/` | Algo con deadline o resultado definido. Cuando cierra, va a `04_Archive/`. |
| `02_Areas/` | Responsabilidad continua sin fecha de fin (salud, finanzas, un rol). |
| `03_Resources/` | Notas atómicas: una idea por nota, plano, sin subcarpetas. |
| `04_Archive/` | Cerrado. Nunca se borra nada, se archiva. |
| `Hubs/` | Una nota por entidad que importa: persona, herramienta, concepto, empresa. |
| `Bases/` | Vistas `.base`. |
| `Templates/` | Mis plantillas. Claude no las edita. |

## Contrato de frontmatter

Todo campo que se escriba tiene que estar acá. Un campo que no está declarado no se inventa: se propone y se agrega primero.

```yaml
---
created: YYYY-MM-DD        # ISO, nunca se reescribe
type: daily                # daily | weekly | monthly | dump | atomic | hub | project | area | clip
status: seed               # madurez, solo en atomic, hub y clip (ver abajo)
tags: []
---
```

### `status`: madurez de la nota

Solo para `atomic`, `hub` y `clip`. Las notas periódicas (`daily`, `weekly`, `monthly`, `dump`) no lo llevan: son registro, no conocimiento, y no maduran.

| Valor | Significa | Efecto |
|---|---|---|
| `seed` | Apenas plantada, incompleta a propósito | No cuenta como hueca. Si sigue `seed` a los 30 días, el audit la marca: una semilla que no crecio es la falla clasica del vault. |
| `provisional` | Tiene cuerpo pero no la sostendría en una discusión | Default de una nota recién escrita con contenido |
| `evergreen` | Dice lo que tiene que decir. Puede quedarse quieta años | **No cuenta como stale.** Es lo que distingue una nota que ya hizo su trabajo de una abandonada. |
| `contested` | Contradice a otra nota del vault y no está resuelto | El audit la lista para que un review la mire. La contradicción se preserva, no se resuelve sola. |
| `archived` | Cerrada | Fuera del alcance del audit, viva donde viva |

Sin este campo el audit no puede distinguir una nota de referencia que terminó su trabajo de un stub que nunca creció, y reporta las dos como stale.

**Los proyectos usan el mismo campo con otro vocabulario** (`activo | pausado | cerrado`): es su ciclo de vida, no su madurez. El audit solo interpreta los cinco valores de arriba, así que un `activo` le resulta inerte y el proyecto se evalúa como cualquier otra nota. Si eso te molesta, renombralo acá y el contrato manda.

Campos adicionales por tipo:

| `type` | Campos propios |
|---|---|
| `project` | `status: activo \| pausado \| cerrado`, `deadline` (opcional), `repos:` si tiene código |
| `clip` | `source` (URL), `author` (opcional) |
| `hub` | `aliases` (nombres alternativos de la entidad), `repos:` si la entidad tiene código |

`repos:` es el puente al código: la lista de repos que implementan esa entidad. Se traduce a path local en `codebases.md`. **El vault apunta, no copia:** la arquitectura vive en el repo.

## Reglas de link

- **Los links van hacia arriba, nunca hacia abajo.** Dump linkea a hubs y proyectos. Daily linkea al dump. Weekly linkea a los dailies. Monthly linkea a los weeklies. Los backlinks de Obsidian dan la dirección inversa gratis.
- **Ninguna nota se cierra sin al menos un `[[wikilink]]`.** Si no hay a qué linkearla, falta un hub file.
- `[[wikilinks]]` para lo interno, `[texto](url)` solo para URLs externas.

## Tareas

Las tareas viven en la nota a la que pertenecen, no en una lista central. Una tarea de un proyecto vive en la nota del proyecto; una que apareció en el día vive en el dump de ese día.

**Una tarea abierta no se arrastra al día siguiente.** Queda en su día marcada como cancelada (`- [-]`) y se crea de nuevo donde corresponda. No haber hecho algo un día es información.

## Qué puede hacer Claude

- Crear y editar notas, clasificar el dump, actualizar hub files, generar dailies/weeklies/monthlies, buscar en el vault, proponer links.

## Qué no puede hacer Claude

- Borrar notas (mueve a `04_Archive/`).
- Renombrar o mover notas sin que yo lo apruebe.
- Editar `Templates/` ni nada dentro de `.obsidian/`.
- Escribir la sección de reflexión de los reviews: los hechos los sintetiza Claude, la interpretación la escribo yo.
- Editar en masa: los cambios que afectan muchas notas van por `/vault-tidy` con approval.

## Plugins instalados

<Completado por `/second-brain setup` con la detección real. Lo que no está en esta lista no se usa en las notas.>

## Quién escribe qué

- **Autorado** (lo escribo yo, Claude no lo toca sin approval): dumps, notas atómicas, hubs, clips, proyectos, este archivo, y la `## Reflexión` de los reviews.
- **Sintetizado** (Claude lo escribe con mi OK y queda como nota): dailies, weeklies, monthlies, el `## Historial` de los hubs.
- **Proyectado** (Claude lo reescribe sin preguntar, es derivado y descartable): `hot.md`, `.vault-index.json`, las vistas `.base`. No los edito a mano porque se pisan.

## Uso desde otros proyectos

Otros repos pueden leer este vault. El orden de lectura es `hot.md` → búsqueda con `vault_index.py` → el hub del tema → la nota. **No se lee el vault para preguntas generales de programación**, y no se escribe en él desde otro proyecto salvo pedido explícito. Receta completa: `/second-brain link`.

## Git

Este vault es un repo git. Antes de una corrida que escribe varias notas, el árbol tiene que estar limpio: es el único undo confiable.
