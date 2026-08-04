# Bases Syntax Reference

Referencia de la sintaxis de los archivos `.base` de Obsidian (core plugin, 1.9+). Fuente: `https://obsidian.md/help/bases/syntax`.

## Bloques top-level

| Bloque | Qué hace |
|---|---|
| `filters` | Condiciones globales, aplican a todas las vistas. Opcional. |
| `formulas` | Propiedades calculadas, disponibles en todas las vistas. |
| `properties` | Configuración de display de una propiedad (`displayName`). |
| `summaries` | Fórmulas de agregación propias. |
| `views` | Lista de vistas: cómo se renderizan los datos. |

Sin `filters`, la base incluye **todos** los archivos del vault.

## Filtros

Un objeto de filtro contiene `and`, `or` o `not`, y cada uno una lista de objetos de filtro o de statements (strings). Se anidan.

```yaml
filters:
  or:
    - file.hasTag("tag")
    - and:
        - file.hasTag("book")
        - file.hasLink("Textbook")
    - not:
        - file.hasTag("book")
        - file.inFolder("Required Reading")
```

Operadores:

- Aritméticos: `+`, `-`, `*`, `/`, `%`, `()`
- Comparación: `==`, `!=`, `>`, `<`, `>=`, `<=`
- Booleanos: `!`, `&&`, `||`
- Fechas: sumar o restar duraciones con `+` y `-`. Unidades: `y/year/years`, `M/month/months`, `w/week/weeks`, `d/day/days`, `h/hour/hours`, `m/minute/minutes`, `s/second/seconds`

## Propiedades

Tres orígenes:

| Forma | Origen |
|---|---|
| `note.propiedad` o `propiedad` | frontmatter de la nota |
| `file.*` | metadata del archivo |
| `formula.nombre` | fórmula declarada en `formulas` |

Propiedades de archivo: `file.name`, `file.path`, `file.folder`, `file.ext`, `file.size`, `file.ctime`, `file.mtime`, `file.tags`, `file.links`, `file.embeds`, `file.backlinks`.

`file.backlinks` es costoso de calcular: evitarlo en vistas de uso frecuente.

Tipos de dato: strings (entre comillas), números, booleanos (`true`/`false`), fechas, duraciones, objetos, listas, y files/links.

## Fórmulas

```yaml
formulas:
  formatted_price: 'if(price, price.toFixed(2) + " dollars")'
  ppu: "(price / age).toFixed(2)"
```

Funciones habituales: `if()`, `date()`, `now()`, `duration()`, además de los métodos de cada tipo (`toFixed`, `round`, `mean`).

Tres trampas:

1. **Duraciones:** una resta de fechas devuelve `Duration`. Hay que acceder al campo numérico antes de operar: `(now() - file.mtime).days`, no `round(now() - file.mtime)`.
2. **Nulls:** una propiedad ausente rompe la fórmula. Envolver en `if(propiedad, ...)`.
3. **Referencias:** una `formula.x` usada en `order` pero no declarada en `formulas` falla en silencio, la columna no aparece.

## Vistas

```yaml
views:
  - type: table
    name: "My table"
    limit: 10
    groupBy:
      property: note.age
      direction: DESC
    filters:
      and:
        - 'status != "done"'
        - or:
            - "formula.ppu > 5"
            - "price > 2.1"
    order:
      - file.name
      - note.age
      - formula.ppu
    summaries:
      formula.ppu: Average
```

Claves de una vista: `type`, `name`, `limit`, `groupBy`, `filters`, `order`, `summaries`.

Tipos: `table` (columnas), `cards` (galería), `list` (lista simple), `map` (geográfico).

## Summaries por default

- Numéricos: Average, Min, Max, Sum, Range, Median, Stddev
- Fechas: Earliest, Latest
- Booleanos: Checked, Unchecked
- Cualquier tipo: Empty, Filled, Unique

Propios:

```yaml
summaries:
  customAverage: 'values.mean().round(3)'
```

## Quoting de YAML

Cualquier expresión que contenga `:`, `{`, `}`, `[`, `]` va entre comillas. Si la expresión tiene comillas dobles adentro, el string va entre comillas simples:

```yaml
formulas:
  label: 'if(done, "Yes", "No")'
```

Es la causa número uno de un `.base` que no carga.
