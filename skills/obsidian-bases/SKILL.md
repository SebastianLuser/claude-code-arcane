---
name: obsidian-bases
description: "Crea y edita archivos .base de Obsidian: vistas table/cards/list/map, filtros, formulas y summaries sobre las propiedades de las notas. Incluye migracion desde queries de Dataview. Triggers: obsidian bases, archivo .base, base de datos en obsidian, vista de notas, dashboard obsidian, migrar dataview."
argument-hint: "[create <descripcion> | explain <archivo.base> | migrate <query dataview>]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Obsidian Bases - Vistas nativas

Bases es el core plugin de Obsidian (1.9+) que convierte las propiedades de las notas en tablas y cards vivas. No se instala nada. Adaptado de `kepano/obsidian-skills` al formato de este repo.

Modo: `$ARGUMENTS`

La referencia completa de sintaxis está en `references/bases-syntax.md`. Leela antes de escribir un `.base`: la mitad de los errores son de quoting de YAML, no de lógica.

## Fase 1 - Verificar que Bases esté disponible

Leer `.obsidian/core-plugins.json` del vault. Si `bases` no está habilitado, decirlo y ofrecer las dos salidas: habilitarlo (es core, no requiere instalar) o resolver la vista con una tabla markdown estática. **Nunca escribir un `.base` en un vault que no lo tiene habilitado:** queda como un archivo que Obsidian muestra en crudo.

## Fase 2 - Modos

### `create` - Vista nueva
1. Entender qué pregunta responde la vista. Una vista sin pregunta concreta termina siendo una tabla de todo el vault que nadie mira.
2. **Verificar que las propiedades existan**: `Grep` en el frontmatter del vault por los campos que vas a filtrar. Filtrar por una propiedad que ninguna nota declara produce una vista vacía y parece un bug de Bases.
3. Escribir el `.base` en `Bases/`, con approval antes de crear el archivo.
4. Avisar que hay que abrirlo en Obsidian para confirmar que renderiza: la sintaxis se valida ahí, no acá.

### `explain` - Leer un `.base` existente
Traducir el archivo a lenguaje llano: qué notas entran, qué columnas muestra, qué calcula cada fórmula. Read-only.

### `migrate` - Desde Dataview
Traducir la query, y **decir explícitamente qué no se puede traducir**. Bases no cubre campos inline (`campo:: valor` en medio de la nota) ni texto computado ni `dataviewjs`. Si la query depende de eso, la respuesta honesta es que se quede en Dataview: una migración a medias deja al usuario con una vista que miente.

## Estructura de un `.base`

```yaml
filters:
  and:
    - file.inFolder("03_Resources")
    - 'type == "atomic"'

formulas:
  edad_dias: '(now() - file.mtime).days'

properties:
  formula.edad_dias:
    displayName: "Dias sin tocar"

views:
  - type: table
    name: "Notas atomicas"
    filters:
      not:
        - file.hasTag("archivada")
    order:
      - file.name
      - created
      - formula.edad_dias
    summaries:
      formula.edad_dias: Average
```

Los cinco bloques top-level son `filters`, `formulas`, `properties`, `summaries` y `views`. Los filtros globales aplican a todas las vistas; cada vista puede agregar los suyos.

## Los tres errores que se repiten

1. **Quoting de YAML.** Cualquier expresión con `:`, `{`, `}`, `[`, `]` va entre comillas. Si la expresión ya tiene comillas dobles adentro, el string va en comillas simples: `'if(done, "Si", "No")'`.
2. **Duraciones.** Restar dos fechas da una `Duration`, no un número: hay que acceder al campo antes de operar (`.days`, `.hours`). `round(now() - file.mtime)` falla; `(now() - file.mtime).days` funciona.
3. **Nulls.** Una propiedad ausente rompe la fórmula. Envolver en `if(propiedad, ...)` cuando el campo puede faltar, que en un vault real es casi siempre.

Una fórmula referenciada en `order` que no está declarada en `formulas` falla en silencio: la columna simplemente no aparece.

## Reglas

- `file.backlinks` es caro: no lo pongas en una vista que se abre seguido.
- No crear una vista que dependa de una propiedad que el vault todavía no usa: primero se agrega al contrato de frontmatter del `CLAUDE.md`.
- Un `.base` por pregunta. Un archivo con ocho vistas es un dashboard que nadie lee.
- Pedí approval antes de escribir o sobrescribir un `.base`.
- Sin guiones largos.

## Handoff

Base READY cuando el archivo existe y el usuario confirmó que renderiza en Obsidian. Si la vista necesitaba campos que las notas no tienen, el siguiente paso es actualizar el contrato de frontmatter con `/second-brain` y completar las notas con `/vault-tidy frontmatter`.
