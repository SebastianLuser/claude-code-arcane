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

Un rol que este vault no usa se marca `(no usa)` en vez de borrar la fila: así queda explícito que la ausencia fue una decisión.

Los scripts reciben esto por flag: `--role hubs=Hubs --role atomic=03_Resources`.

## Estructura

| Carpeta | Qué vive acá |
|---|---|
| `_inbox/` | Captura cruda, un archivo por día (`YYYY-MM-DD.md`). Sin estructura, sin tags, sin pensar. |
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
tags: []
---
```

Campos adicionales por tipo:

| `type` | Campos propios |
|---|---|
| `project` | `status: activo \| pausado \| cerrado`, `deadline` (opcional) |
| `clip` | `source` (URL), `author` (opcional) |
| `hub` | `aliases` (nombres alternativos de la entidad) |

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

## Git

Este vault es un repo git. Antes de una corrida que escribe varias notas, el árbol tiene que estar limpio: es el único undo confiable.
