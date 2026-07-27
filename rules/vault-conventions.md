# Vault Conventions Rule (second brain en Obsidian)

Reglas que gobiernan toda escritura dentro de un vault de Obsidian. Existen porque un agente que escribe notas sin restricciones degrada el vault mas rapido de lo que lo construye: linkea todo con todo, arrastra tareas en silencio y renombra archivos rompiendo `[[wikilinks]]`.

Las rutas son relativas al vault (`--vault`, env `OBSIDIAN_VAULT`, o el directorio actual si contiene `.obsidian/`).

## Cuando aplica

- Cualquier skill del profile `second-brain` que cree o edite notas.
- Cualquier escritura en un directorio que contenga `.obsidian/`, incluso desde otro skill.
- NO aplica a los archivos de configuracion del vault (`.obsidian/**`): no se tocan nunca sin pedido explicito del usuario.

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

## Git como red de seguridad

El vault deberia ser un repo git. Antes de una corrida que escribe varias notas (`/review-dump`, `/vault-tidy`), verificar que el arbol este limpio y avisar al usuario si no lo esta. Es lo que permite deshacer una corrida completa sin revisar nota por nota.
