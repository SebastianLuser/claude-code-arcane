# Vault Conventions Rule (second brain en Obsidian)

Reglas que gobiernan toda escritura dentro de un vault de Obsidian. Existen porque un agente que escribe notas sin restricciones degrada el vault mas rapido de lo que lo construye: linkea todo con todo, arrastra tareas en silencio y renombra archivos rompiendo `[[wikilinks]]`.

Las rutas son relativas al vault (`--vault`, env `OBSIDIAN_VAULT`, o el directorio actual si contiene `.obsidian/`).

## Cuando aplica

- Cualquier skill del profile `second-brain` que cree o edite notas.
- Cualquier escritura en un directorio que contenga `.obsidian/`, incluso desde otro skill.
- NO aplica a los archivos de configuracion del vault (`.obsidian/**`): no se tocan nunca sin pedido explicito del usuario.

## Quién escribe cada archivo

Antes de tocar cualquier cosa, la pregunta es de quién es ese archivo. Hay tres clases y el permiso de escritura es distinto en cada una. Adaptado de la distinción **autorado / proyectado** de la base de conocimiento de producto de Educabot, que es la que hace que un agente y una persona escriban en el mismo repositorio sin pisarse.

| Clase | Quién escribe | Qué puede hacer el agente | Ejemplos |
|---|---|---|---|
| **Autorado** | La persona. Cambia lento | **Nada sin approval.** Ni reformatear, ni "mejorar" | Dumps, notas atómicas, hubs, clips, proyectos, el `CLAUDE.md` del vault, la sección `## Reflexión` de los reviews |
| **Sintetizado** | El agente, con approval, y queda como nota permanente | Proponer y escribir tras el OK. Idempotente: correr dos veces no duplica | Dailies, weeklies, monthlies, el `## Historial` de un hub |
| **Proyectado** | El agente, sin preguntar. Derivado y descartable | Reescribir completo cuando corresponda | `hot.md`, el índice `.vault-index.json`, las vistas `.base` |

Tres consecuencias que resuelven las dudas que aparecen en la práctica:

- **Lo proyectado no se edita a mano.** Si el usuario lo edita, el próximo review lo pisa. Por eso `hot.md` lleva la advertencia adentro.
- **Lo proyectado no es fuente de verdad.** Si contradice a una nota, la nota gana. Se puede borrar sin perder nada.
- **Lo autorado no se toca ni para arreglarlo.** Si una nota del usuario tiene el frontmatter roto, se propone el arreglo; no se aplica solo. La excepción son las categorías que `/vault-tidy` aplica con approval item por item.

Si no sabés en qué clase cae un archivo, es autorado. El default es no escribir.

## El vault apunta, no copia

Cuando algo ya tiene una fuente de verdad afuera, el vault guarda **el puntero y el porqué**, nunca una copia:

| Contenido | Fuente de verdad | En el vault |
|---|---|---|
| Código y arquitectura | El repo | `repos:` en el frontmatter, y `codebases.md` con el path local |
| Tickets, estados, sprints | Jira, ClickUp, Linear | Link, y la decisión que salió de ahí |
| Diseños | Figma | Link en la nota del tema |
| Artículos, papers | La web | El clip, con `source:` y **tu** resumen |

Una copia se desactualiza en silencio y después hay dos verdades y ninguna gana. Lo que sí acumula el vault es lo que ninguna de esas fuentes tiene: **qué decidiste, por qué, y qué aprendiste**. Eso no vive en Jira ni en el código.

## Resolución de rutas: roles, no carpetas

Ningún skill escribe en una ruta literal. Escribe en un **rol**, y el `## Rutas` del `CLAUDE.md` del vault dice qué carpeta es ese rol en este vault. Es lo que hace que un vault adoptado con otra estructura funcione sin tocar los skills.

| Rol | Qué contiene | Default del `setup` |
|---|---|---|
| `inbox` | captura cruda del día | `_inbox` |
| `daily` | síntesis diaria | `Reflect/Daily` |
| `weekly` | retrospectiva semanal | `Reflect/Weekly` |
| `monthly` | balance mensual | `Reflect/Monthly` |
| `atomic` | notas atómicas | `03_Resources` |
| `hubs` | hub files por entidad | `Hubs` |
| `projects` | proyectos con deadline | `01_Projects` |
| `areas` | responsabilidades continuas | `02_Areas` |
| `archive` | cerrado, nunca borrado | `04_Archive` |
| `templates` | plantillas del usuario | `Templates` |

Orden de resolución, sin excepciones:

1. El `## Rutas` del `CLAUDE.md` del vault.
2. Si el vault no lo declara, el default de la tabla, **avisándole al usuario que se está asumiendo**.
3. Si el rol no existe en este vault (no todos tienen `areas`), preguntar antes de crear la carpeta.

Los scripts reciben el mapeo por flag (`--role hubs=People`), nunca lo adivinan. **Si el `CLAUDE.md` del vault declara rutas distintas del default y un skill escribe en el default igual, eso es un bug del skill, no una preferencia.**

## Las tres reglas de estructura

### 1. Los links van hacia arriba, nunca hacia abajo

Cada nota linkea a su contexto, no a su detalle:

| Desde | Linkea a | Nunca a |
|---|---|---|
| Nota de `_inbox/` (dump) | hub files, proyectos, areas | otros dumps |
| Daily | el dump del dia, notas creadas ese dia | otros dailies |
| Weekly | los dailies de la semana | notas atomicas sueltas |
| Monthly | los weeklies del mes | dailies |
| Hub file | notas atomicas y proyectos del tema | dumps ni dailies |

Sin esta regla el agente crea links bidireccionales en todas las direcciones y el grafo se vuelve ruido: cada nota apunta a todo y ninguna relacion significa nada. Los backlinks de Obsidian ya dan la direccion inversa gratis, no hay que escribirla.

### 2. Ninguna nota se cierra sin al menos un `[[wikilink]]`

Es la unica regla que previene las huerfanas de raiz. Si al terminar una nota no hay a que linkearla, esa es la senal de que falta un hub file: crear el hub (ver `/hub-note`) antes de cerrar la nota, o dejarla en `_inbox/` en vez de archivarla en `03_Resources/`.

Excepcion: los dumps crudos de `_inbox/` pueden nacer sin links, porque los agrega `/review-dump`.

### 3. Las tareas no hechas no se arrastran en silencio

Una tarea abierta en el dump del lunes que sigue abierta el martes **se queda en el lunes**, marcada como cancelada (`- [-]`), y se crea de nuevo en el martes. No se mueve.

No haber hecho algo un dia determinado es informacion. Arrastrar la tarea hacia adelante produce una lista limpia y una historia falsa.

## Que no puede hacer el agente

- **Nunca borrar una nota.** Mover a `04_Archive/` preservando el nombre. El borrado es decision del usuario, siempre.
- **Nunca renombrar ni mover una nota sin approval explicito.** Rompe `[[wikilinks]]` en silencio: Obsidian solo los actualiza cuando el rename ocurre dentro de la app.
- **Nunca editar en masa.** Una corrida toca las notas de esa corrida. Los cambios que afectan a muchas notas se proponen como plan y los aplica `/vault-tidy` con approval item por item.
- **Nunca tocar `Templates/`** salvo pedido explicito: son el contrato del usuario, no del agente.
- **Nunca reescribir la seccion de reflexion del usuario.** Los reviews sintetizan hechos; la interpretacion la escribe el usuario.

## Contrato de frontmatter

Todo campo que un skill escriba tiene que estar declarado en el `CLAUDE.md` del vault. Un campo que no esta en el contrato no se inventa: se propone y se agrega al contrato primero.

Minimo por tipo de nota:

```yaml
---
created: 2026-07-27        # ISO, nunca se reescribe
type: daily                # daily | weekly | monthly | dump | atomic | hub | project | area | clip
tags: []
---
```

Los tipos con campos propios (`status` en proyectos, `source` en clips) los declara el skill que los crea.

## Convenciones de escritura

- Nada de guiones largos: si un texto generado trae em-dash o en-dash, normalizar a `-` antes de escribir.
- `[[wikilinks]]` para todo lo interno, `[texto](url)` solo para URLs externas. Obsidian trackea renames de wikilinks, no de markdown links.
- Fechas ISO (`YYYY-MM-DD`) en frontmatter y en nombres de archivo de notas periodicas.
- Una idea por nota atomica. Si una nota necesita dos titulos de nivel `##` que no se relacionan, son dos notas.

## La estructura no la sostiene este archivo

Una convención que solo vive en un documento se muere en tres meses. Lo que la sostiene es lo que corre:

| Convención | Qué la hace cumplir |
|---|---|
| Frontmatter completo, notas con al menos un link | El hook `PostToolUse` de `second-brain`, al escribir |
| Huérfanas, links roto, nombres duplicados, semillas que no crecen | `/vault-audit`, cada vez que se corre |
| Contradicciones sin resolver | `status: contested`, que el audit lista y el monthly mira |
| Rutas por rol | El `## Rutas` del contrato, que los skills leen antes de escribir |
| Tareas que no se arrastran | El paso de tareas de `/review-dump`, y `stale_open_tasks` en el audit |

Si una regla nueva de este archivo no tiene una columna derecha, es una intención, no una regla. Antes de agregarla, preguntá qué la va a hacer cumplir.

## Git como red de seguridad

El vault deberia ser un repo git. Antes de una corrida que escribe varias notas (`/review-dump`, `/vault-tidy`), verificar que el arbol este limpio y avisar al usuario si no lo esta. Es lo que permite deshacer una corrida completa sin revisar nota por nota.
