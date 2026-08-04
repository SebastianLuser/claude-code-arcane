---
name: vault-recall
description: "Busqueda con ranking sobre el vault via indice cacheado: BM25, acentos plegados y expansion con los alias que declaran tus notas. Tambien encuentra las notas mas parecidas a una dada. Triggers: buscar en el vault, que escribi sobre, encontrar la nota de, recall, donde anote, que tengo sobre, que se parece a esta nota, notas relacionadas."
argument-hint: "<consulta> | related <nota> [-n N] [--no-expand] [--refresh]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Vault Recall - Encontrar lo que ya escribiste

Respondés qué hay en el vault sobre algo. La diferencia con `Grep` es el ranking: `Grep` te da las 40 notas que contienen la palabra, esto te da las 5 que **tratan** del tema, y encuentra las que usaron otro nombre para la misma cosa.

Consulta: `$ARGUMENTS`

## Fase 1 - Buscar

```bash
python .claude/skills/vault-recall/scripts/vault_index.py "<vault>" search "<consulta>" -n 10
```

El índice vive en `<vault>/.vault-index.json` (dotfile, Obsidian lo ignora) y se actualiza solo lo que cambió: la primera corrida indexa todo, las siguientes cuestan milisegundos. Si no existe, el script lo construye sin que tengas que pedirlo.

Flags del skill, que son los del script y se pasan tal cual:

| Flag | Qué hace |
|---|---|
| `-n N` | máximo de resultados; `-n 0` para todos. Default 10 |
| `--no-expand` | consulta literal, sin expandir con los alias de los hubs |
| `--role nombre=ruta` | estructura del vault distinta de la default (sale del `## Rutas` de su `CLAUDE.md`) |

**`--refresh`** no es un flag del script: es un paso previo. Con `--refresh`, correr primero `vault_index.py "<vault>" refresh` y después la búsqueda. Sirve cuando el vault cambió por fuera de Claude (sync desde el teléfono, edición masiva en Obsidian): el índice es incremental por mtime, así que cuesta milisegundos y evita buscar contra un caché viejo.

### Modo `related`: qué se parece a esta nota

```bash
python .claude/skills/vault-recall/scripts/vault_index.py "<vault>" related "<nota o titulo>" -n 10
```

Ranquea por vocabulario compartido (tf-idf cosine) y devuelve qué términos comparten, así se ve **por qué** dos notas quedaron cerca. Sirve para dos cosas concretas:

- Antes de crear una nota atómica, ver si ya existe una que dice lo mismo con otras palabras.
- Buscar candidatos de conexión para `/review-weekly`, que es donde el vault empieza a producir ideas propias.

Si el título es ambiguo (dos notas con el mismo nombre), no elige: reporta las dos y para. Eso es el hallazgo `ambiguous_names` del audit apareciendo por otra puerta.

## Fase 2 - Leer y responder

1. **Leé las 2 o 3 primeras**, no las 10. El ranking está para que no tengas que abrir todo.
2. **Respondé la pregunta del usuario citando las notas**, con `[[wikilinks]]` para que pueda saltar. No pegues las notas enteras.
3. **Decí qué miraste y qué no.** Si el resultado 1 tenía score 8 y el 2 tenía 0.4, decilo: significa que hay una sola nota sobre el tema.
4. **Si la respuesta no está en el vault, decilo.** No la completes con conocimiento general disfrazado de nota del usuario: la utilidad del vault es que lo que sale de ahí es lo que él pensó.

## Qué encuentra y qué no

Esto es **recuperación léxica con sinónimos derivados del vault**, no búsqueda semántica. Concretamente:

| Caso | Resultado |
|---|---|
| Buscás `indice` y la nota dice `índices` | Lo encuentra: pliega acentos y colapsa plurales |
| Buscás `PG` y la nota dice `postgres` | Lo encuentra, **si existe el hub con `PG` en `aliases`** |
| La palabra aparece una vez en un dump de 900 palabras | Rankea bajo, como corresponde |
| Buscás `performance de queries` y la nota habla de `indices parciales` sin nombrar ninguna de esas palabras | **No lo encuentra.** No hay embeddings, ni en `search` ni en `related`: los dos necesitan palabras compartidas. |

Ese último caso es el límite real y hay que decirlo cuando pasa, en vez de responder "no tenés nada sobre eso". Las tres salidas, en orden de costo:

1. **Reformular con el vocabulario del usuario**, que es el que está en el vault.
2. **Agregar el alias** donde corresponda (`/hub-note --update`, o el frontmatter de la nota: `aliases:` de **cualquier** nota alimenta la expansión). Enseñarle un sinónimo al vault lo arregla para siempre, y es el mecanismo, no un workaround.
3. **Recorrer los hubs** del tema y leer sus `## Notas`: el mapa hecho a mano sigue siendo mejor que cualquier búsqueda.

## Reglas

- No escribir en el vault. Si de la búsqueda sale que falta un alias o un hub, proponelo y pedí approval: lo aplica `/hub-note`.
- No inventar contenido de notas que no leíste. Citá solo lo que abriste.
- El índice no es una fuente de verdad: es un caché. Si un resultado no coincide con la nota, la nota gana y hay que correr `refresh`.
- Sin guiones largos.

Recall COMPLETE cuando el usuario tiene la respuesta con los links a las notas, o sabe que en el vault no está y por qué.

## Handoff

Si la búsqueda mostró que el tema está disperso en varios lugares sin un mapa, el siguiente paso es `/hub-note` para crear el hub que falta. Si mostró que una idea aparece repetida en tres notas parecidas, `/zettel` para consolidarla y `/vault-tidy` para linkear las sobras.
