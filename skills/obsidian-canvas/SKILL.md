---
name: obsidian-canvas
description: "Creates and edits .canvas files (JSON Canvas): note, text, file and link nodes, groups, and edges with direction and color. Triggers: obsidian canvas, json canvas, visual map, note diagram, .canvas file, obsidian whiteboard."
argument-hint: "[create <description> | explain <file.canvas> | edit <file.canvas>]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Obsidian Canvas - JSON Canvas

A `.canvas` is plain JSON with two arrays: `nodes` and `edges`. The format is JSON Canvas, an open spec, so the file can be generated and read without Obsidian. Adapted from `kepano/obsidian-skills` to this repo's format.

Mode: `$ARGUMENTS`

## Modes

- **`create`**: generate a new canvas from a description or from a set of vault notes.
- **`explain`**: read a canvas and describe its structure in text. Read-only.
- **`edit`**: add or rearrange nodes in an existing canvas. Ask for approval before writing, and warn that a canvas open in Obsidian overwrites the file on save: it has to be closed first.

## Structure

```json
{
  "nodes": [
    {
      "id": "n1",
      "type": "file",
      "file": "03_Resources/Partial indexes.md",
      "x": 0, "y": 0, "width": 400, "height": 300
    },
    {
      "id": "n2",
      "type": "text",
      "text": "Hypothesis: the cost is in the reads",
      "x": 480, "y": 0, "width": 300, "height": 120,
      "color": "4"
    },
    {
      "id": "g1",
      "type": "group",
      "label": "Research",
      "x": -40, "y": -60, "width": 900, "height": 440
    }
  ],
  "edges": [
    {
      "id": "e1",
      "fromNode": "n1", "fromSide": "right",
      "toNode": "n2", "toSide": "left",
      "label": "suggests"
    }
  ]
}
```

**Nodes.** Required fields: `id`, `type`, `x`, `y`, `width`, `height`. Types:

| `type` | Own field |
|---|---|
| `text` | `text` (markdown) |
| `file` | `file` (path in the vault), optional `subpath` for a heading or block |
| `link` | `url` |
| `group` | optional `label`, `background`, `backgroundStyle` |

**Edges.** Required: `id`, `fromNode`, `toNode`. Optional: `fromSide` and `toSide` (`top`, `right`, `bottom`, `left`), `fromEnd`/`toEnd` (`none`, `arrow`), `label`, `color`.

**Color.** A preset `"1"` to `"6"` (red, orange, yellow, green, cyan, purple) or a hex `"#ff0000"`.

**Coordinates.** The Y axis grows downward. A group doesn't contain nodes by reference: it contains them **geometrically**, by overlapping with its rectangle. If you move a node outside the rectangle, it leaves the group.

## Rules for generating a usable one

- **`id`s must be unique.** If they repeat, Obsidian keeps only one and the rest disappear without an error.
- **Grid layout, not stacked at the origin.** Keep nodes at least 60px apart: a canvas with everything at `x: 0, y: 0` opens as an unreadable pile, and rearranging it by hand costs more than generating it again.
- **Check that every `file` exists** before writing the canvas: a node pointing to a nonexistent note renders empty.
- A canvas is for thinking visually, not for storing knowledge. What you learn in a canvas is written afterwards as an atomic note.

Canvas READY when the JSON is valid, the ids are unique, the paths exist and the user confirmed it opens correctly in Obsidian.

## Rules

- Don't invent fields the spec doesn't define: Obsidian ignores them and they clutter the file.
- Don't rewrite a whole canvas to add a node: `Edit` the array.
- Ask for approval before writing or overwriting a `.canvas`, and check that it isn't open in Obsidian.
- No em dashes in labels or text nodes.

## Handoff

If what was needed was a tabular view and not a visual map, the right skill is `/obsidian-bases`. When the canvas produced a conclusion, the next step is `/zettel` to write it as an atomic note: the canvas is the scaffolding, the note is what remains.
