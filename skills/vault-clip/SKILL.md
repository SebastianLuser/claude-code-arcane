---
name: vault-clip
description: "Guarda una pagina web en el vault como nota limpia: extrae el contenido sin menus ni banners, con frontmatter de fuente y un resumen propio. Triggers: clipear, guardar este articulo, clip web, guardar link en el vault, archivar esta pagina, web clipper."
argument-hint: "<url> [--full | --summary]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch
---

# Vault Clip - Captura web

Convertís una URL en una nota del vault que se lee dentro de cinco años, cuando la página original ya no exista. Lo que guardás es el contenido, no el HTML.

URL: `$ARGUMENTS`

Aplica la rule `vault-conventions`.

**Rutas por rol:** los destinos se nombran por rol y la ruta real de cada uno sale del `## Rutas` del `CLAUDE.md` del vault. Los defaults entre paréntesis solo aplican si el vault no declara otra cosa.

## Fase 1 - Traer el contenido

1. **Ubicar el vault** y leer su `CLAUDE.md`.
2. **Validar la URL** antes de tocarla: tiene que ser `http(s)` y pública. Si el usuario pasó algo que no es una URL, preguntar.
3. **Traer la página con `WebFetch`** pidiendo el contenido principal en markdown, sin navegación, sidebars, banners de cookies, footers ni bloques de "artículos relacionados". Un artículo crudo son decenas de miles de tokens de los cuales el 80 por ciento es chrome del sitio.
4. **Si la página es un paywall, un login o un JS shell vacío**, decirlo y parar. Ofrecer que el usuario pegue el texto a mano. No inventes el contenido a partir del título ni de lo que sepas del tema: un clip fabricado es peor que no tener el clip.

## Fase 2 - Decidir qué se guarda

| Modo | Qué guarda | Cuándo |
|---|---|---|
| `--summary` (default) | Resumen propio de 5 a 10 líneas + los puntos clave + link a la fuente | Casi siempre. El vault es para tus ideas, no para copias de internet. |
| `--full` | El texto completo limpio | Referencia técnica que vas a citar, o contenido que puede desaparecer |

En los dos modos, **el resumen lo escribís vos y va arriba**: si dentro de un año el usuario abre la nota, lo primero que tiene que ver es qué había ahí y por qué lo guardó, no el primer párrafo del autor.

## Fase 3 - Escribir

Con approval sobre destino y modo, crear la nota en `<atomic>` (default `03_Resources/`):

```yaml
---
created: YYYY-MM-DD
type: clip
source: <URL>
author: <si la página lo declara>
status: seed
tags: []
---
```

Estructura del cuerpo:

1. `# <Título del artículo>`
2. **Por qué lo guardé:** una línea. Si el usuario no lo dijo, preguntar; es el campo que decide si la nota sirve o es basura acumulada.
3. `## Resumen` con los puntos clave.
4. `## Contenido` solo en modo `--full`, con el texto limpio.
5. `## Relacionado`: al menos un `[[wikilink]]`. Un clip sin link es una huérfana con URL. Si no hay a qué linkearlo, el hub del tema falta: `/hub-note`.

Nombre del archivo: el título del artículo, no el slug de la URL. Sin caracteres que rompan en Windows (`: \ / | ? * < >`).

Clip COMPLETE cuando la nota tiene fuente, resumen propio y al menos un link.

## Reglas

- Nunca guardar el HTML crudo ni el markdown con la navegación adentro.
- Nunca fabricar contenido que no vino de la página.
- Respetar el copyright: en modo `--full` la nota es de uso personal en el vault del usuario, y la fuente queda siempre atribuida. No proponer republicar nada.
- El clip es material crudo, no una nota atómica: si de acá sale una idea propia del usuario, esa idea es una nota aparte con `/zettel`.
- Sin guiones largos.

## Handoff

Con el clip guardado, el siguiente paso es `/zettel` si el artículo produjo una idea que el usuario quiere hacer propia, o `/hub-note` si el tema todavía no tiene hub desde donde encontrar este clip.
