---
name: obsidian-markdown
description: "Sintaxis de Obsidian Flavored Markdown: wikilinks, embeds, callouts, block IDs, propiedades, tags, highlights, math y mermaid. Valida o corrige una nota. Triggers: sintaxis obsidian, wikilink, callout, embed, block id, obsidian markdown, esto renderiza bien en obsidian, frontmatter obsidian."
argument-hint: "[reference | check <archivo> | fix <archivo>]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Obsidian Markdown - Sintaxis nativa

Obsidian extiende CommonMark y GFM. Este skill cubre **solo las extensiones propias de Obsidian**: el markdown estándar (títulos, negrita, listas, tablas, código) se da por sabido. Adaptado de `kepano/obsidian-skills` al formato de este repo.

Modo y archivo: `$ARGUMENTS`

## Modos

- **`reference`** (default): responder la duda de sintaxis con la tabla de abajo, sin tocar archivos.
- **`check <archivo>`**: leer la nota y reportar qué no va a renderizar. Read-only.
- **`fix <archivo>`**: corregir lo que `check` encontró. Pedí approval antes de escribir, mostrando el diff propuesto.

## Links y embeds

```markdown
[[Nota]]                          link interno
[[Nota|Texto visible]]            alias
[[Nota#Titulo]]                   link a un heading
[[Nota#^block-id]]                link a un bloque
[[#Titulo en esta nota]]          link interno a la misma nota

![[Nota]]                         embed de la nota completa
![[Nota#Titulo]]                  embed de una seccion
![[imagen.png|300]]               embed con ancho
![[doc.pdf#page=3]]               embed de una pagina de PDF
```

Un block ID se define agregando `^mi-id` al final del párrafo. En listas y citas va en una línea aparte después del bloque.

**`[[wikilinks]]` para lo interno, `[texto](url)` solo para URLs externas.** No es estilo: Obsidian actualiza los wikilinks cuando renombrás una nota dentro de la app, y no toca los markdown links.

## Callouts

```markdown
> [!note]
> Callout basico.

> [!warning] Titulo propio
> Con titulo custom.

> [!faq]- Colapsado por default
> El `-` lo colapsa, el `+` lo abre.
```

Tipos: `note`, `tip`, `info`, `warning`, `danger`, `bug`, `example`, `quote`, `success`, `failure`, `question`, `abstract`, `todo`. Un tipo inventado renderiza como `note` sin avisar, y ese es el error de callout más común.

## Propiedades (frontmatter)

```yaml
---
title: Mi nota
date: 2026-07-27
tags:
  - proyecto
  - activo
aliases:
  - Nombre alternativo
cssclasses:
  - custom
---
```

`tags`, `aliases` y `cssclasses` son las tres propiedades que Obsidian entiende de forma nativa. El resto son campos propios y los consume Bases o Dataview.

## Resto de la sintaxis propia

```markdown
#tag  #anidado/tag              tags inline (no pueden empezar con numero)
==resaltado==                   highlight
%%comentario%%                  invisible en lectura
$e^{i\pi}+1=0$   y   $$...$$    math LaTeX inline y en bloque
texto[^1]  /  ^[nota inline]    footnotes
```

Los bloques ` ```mermaid ` renderizan diagramas nativamente.

## Qué revisa `check`

| Check | Qué busca | Verdict |
|---|---|---|
| Tipo de callout | `> [!tipo]` con un tipo que no existe | FAIL: renderiza como `note` |
| Links externos como wikilink | `[[https://...]]` | FAIL: no resuelve |
| Links internos como markdown | `[texto](Nota.md)` dentro del vault | CONCERNS: se rompe al renombrar |
| Frontmatter | Abre con `---` en la primera línea y cierra | FAIL si no cierra: Obsidian lo muestra como texto |
| `tags` con `#` en frontmatter | `tags: [#foo]` | CONCERNS: el `#` no va en frontmatter |
| Block IDs | Duplicados en la misma nota | FAIL: el link resuelve al primero |
| Embeds de imagen | Ancho no numérico (`![[img.png|grande]]`) | CONCERNS: se ignora |
| Espacios en `[[ Nota ]]` | Espacios internos al principio o final del target | CONCERNS: puede no resolver |

Nota COMPLIANT cuando ninguna de estas falla.

## Reglas

- No reformatear la nota entera cuando el pedido es arreglar un detalle: `Edit` sobre citas textuales, no `Write` del archivo completo.
- No convertir markdown links externos a wikilinks: los externos van como markdown link.
- No inventar tipos de callout ni propiedades que Obsidian no reconoce.
- Sin guiones largos en lo que agregues.

## Handoff

Si la duda era de vistas agregadas y no de sintaxis de nota, el skill correcto es `/obsidian-bases`; si era de un canvas, `/obsidian-canvas`. Cuando la nota queda COMPLIANT, seguí con el flujo que la produjo (`/zettel`, `/review-dump` o `/vault-clip`).
