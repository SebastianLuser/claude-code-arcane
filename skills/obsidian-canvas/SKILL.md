---
name: obsidian-canvas
description: "Crea y edita archivos .canvas (JSON Canvas): nodos de nota, texto, archivo y link, grupos y edges con direccion y color. Triggers: obsidian canvas, json canvas, mapa visual, diagrama de notas, archivo .canvas, pizarra obsidian."
argument-hint: "[create <descripcion> | explain <archivo.canvas> | edit <archivo.canvas>]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Obsidian Canvas - JSON Canvas

Un `.canvas` es JSON plano con dos arrays: `nodes` y `edges`. El formato es JSON Canvas, un spec abierto, así que el archivo se puede generar y leer sin Obsidian. Adaptado de `kepano/obsidian-skills` al formato de este repo.

Modo: `$ARGUMENTS`

## Modos

- **`create`**: generar un canvas nuevo desde una descripción o desde un conjunto de notas del vault.
- **`explain`**: leer un canvas y describir su estructura en texto. Read-only.
- **`edit`**: agregar o reacomodar nodos de un canvas existente. Pedí approval antes de escribir, y avisá que un canvas abierto en Obsidian sobrescribe el archivo al guardar: hay que cerrarlo antes.

## Estructura

```json
{
  "nodes": [
    {
      "id": "n1",
      "type": "file",
      "file": "03_Resources/Indices parciales.md",
      "x": 0, "y": 0, "width": 400, "height": 300
    },
    {
      "id": "n2",
      "type": "text",
      "text": "Hipotesis: el costo esta en las lecturas",
      "x": 480, "y": 0, "width": 300, "height": 120,
      "color": "4"
    },
    {
      "id": "g1",
      "type": "group",
      "label": "Investigacion",
      "x": -40, "y": -60, "width": 900, "height": 440
    }
  ],
  "edges": [
    {
      "id": "e1",
      "fromNode": "n1", "fromSide": "right",
      "toNode": "n2", "toSide": "left",
      "label": "sugiere"
    }
  ]
}
```

**Nodos.** Campos obligatorios: `id`, `type`, `x`, `y`, `width`, `height`. Tipos:

| `type` | Campo propio |
|---|---|
| `text` | `text` (markdown) |
| `file` | `file` (ruta en el vault), `subpath` opcional para un heading o bloque |
| `link` | `url` |
| `group` | `label`, `background`, `backgroundStyle` opcionales |

**Edges.** Obligatorio `id`, `fromNode`, `toNode`. Opcionales: `fromSide` y `toSide` (`top`, `right`, `bottom`, `left`), `fromEnd`/`toEnd` (`none`, `arrow`), `label`, `color`.

**Color.** Un preset `"1"` a `"6"` (rojo, naranja, amarillo, verde, cyan, violeta) o un hex `"#ff0000"`.

**Coordenadas.** El eje Y crece hacia abajo. Un grupo no contiene nodos por referencia: los contiene **geométricamente**, por solaparse con su rectángulo. Si movés un nodo fuera del rectángulo, sale del grupo.

## Reglas para generar uno usable

- **Los `id` tienen que ser únicos.** Si se repiten, Obsidian se queda con uno solo y el resto desaparece sin error.
- **Layout en grilla, no apilado en el origen.** Separar los nodos al menos 60px: un canvas con todo en `x: 0, y: 0` se abre como una pila ilegible y reacomodarlo a mano cuesta más que generarlo de nuevo.
- **Verificar que cada `file` exista** antes de escribir el canvas: un nodo que apunta a una nota inexistente renderiza vacío.
- Un canvas es para pensar visualmente, no para almacenar conocimiento. Lo que se aprende en un canvas se escribe después como nota atómica.

Canvas READY cuando el JSON es válido, los ids son únicos, las rutas existen y el usuario confirmó que abre bien en Obsidian.

## Reglas

- No inventar campos que el spec no define: Obsidian los ignora y ensucia el archivo.
- No reescribir un canvas entero para agregar un nodo: `Edit` sobre el array.
- Pedí approval antes de escribir o sobrescribir un `.canvas`, y verificá que no esté abierto en Obsidian.
- Sin guiones largos en labels ni en nodos de texto.

## Handoff

Si lo que hacía falta era una vista tabular y no un mapa visual, el skill correcto es `/obsidian-bases`. Cuando el canvas dejó una conclusión, el siguiente paso es `/zettel` para escribirla como nota atómica: el canvas es el andamio, la nota es lo que queda.
