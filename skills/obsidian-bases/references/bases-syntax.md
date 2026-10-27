# Bases Syntax Reference

Reference for the syntax of Obsidian `.base` files (core plugin, 1.9+). Source: `https://obsidian.md/help/bases/syntax`.

## Top-level blocks

| Block | What it does |
|---|---|
| `filters` | Global conditions, apply to every view. Optional. |
| `formulas` | Computed properties, available in every view. |
| `properties` | Display configuration for a property (`displayName`). |
| `summaries` | Custom aggregation formulas. |
| `views` | List of views: how the data is rendered. |

Without `filters`, the base includes **every** file in the vault.

## Filters

A filter object contains `and`, `or` or `not`, each holding a list of filter objects or statements (strings). They nest.

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

Operators:

- Arithmetic: `+`, `-`, `*`, `/`, `%`, `()`
- Comparison: `==`, `!=`, `>`, `<`, `>=`, `<=`
- Boolean: `!`, `&&`, `||`
- Dates: add or subtract durations with `+` and `-`. Units: `y/year/years`, `M/month/months`, `w/week/weeks`, `d/day/days`, `h/hour/hours`, `m/minute/minutes`, `s/second/seconds`

## Properties

Three sources:

| Form | Source |
|---|---|
| `note.property` or `property` | the note's frontmatter |
| `file.*` | file metadata |
| `formula.name` | formula declared in `formulas` |

File properties: `file.name`, `file.path`, `file.folder`, `file.ext`, `file.size`, `file.ctime`, `file.mtime`, `file.tags`, `file.links`, `file.embeds`, `file.backlinks`.

`file.backlinks` is expensive to compute: avoid it in frequently used views.

Data types: strings (in quotes), numbers, booleans (`true`/`false`), dates, durations, objects, lists, and files/links.

## Formulas

```yaml
formulas:
  formatted_price: 'if(price, price.toFixed(2) + " dollars")'
  ppu: "(price / age).toFixed(2)"
```

Common functions: `if()`, `date()`, `now()`, `duration()`, plus each type's methods (`toFixed`, `round`, `mean`).

Three traps:

1. **Durations:** subtracting dates returns a `Duration`. Access the numeric field before operating on it: `(now() - file.mtime).days`, not `round(now() - file.mtime)`.
2. **Nulls:** a missing property breaks the formula. Wrap it in `if(property, ...)`.
3. **References:** a `formula.x` used in `order` but not declared in `formulas` fails silently; the column does not appear.

## Views

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

View keys: `type`, `name`, `limit`, `groupBy`, `filters`, `order`, `summaries`.

Types: `table` (columns), `cards` (gallery), `list` (simple list), `map` (geographic).

## Default summaries

- Numeric: Average, Min, Max, Sum, Range, Median, Stddev
- Dates: Earliest, Latest
- Boolean: Checked, Unchecked
- Any type: Empty, Filled, Unique

Custom:

```yaml
summaries:
  customAverage: 'values.mean().round(3)'
```

## YAML quoting

Any expression containing `:`, `{`, `}`, `[`, `]` goes in quotes. If the expression has double quotes inside, the string goes in single quotes:

```yaml
formulas:
  label: 'if(done, "Yes", "No")'
```

It is the number one cause of a `.base` that does not load.
