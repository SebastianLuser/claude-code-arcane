---
name: asset-spec
description: "Generate per-asset visual specs: description, AI prompts, dimensions, format, naming, art bible anchors. Produces spec files and updates manifest."
category: "gamedev"
argument-hint: "[system:<name>|level:<name>|character:<name>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# asset-spec — Per-Asset Visual Specifications

Genera specs visuales por asset con prompts para AI generation, ancladas al art bible.

## Cuándo usar

- Después de art bible y GDD/level design aprobados, antes de producción
- Para cualquier batch de assets que necesite specs consistentes

## Requisito

Art bible debe existir (`design/art/art-bible.md` o equivalente). Sin art bible → "Correr `/art-bible` primero."

---

## Phase 1: Contexto

Leer antes de preguntar nada:
- **Art bible**: Visual Identity, Color System, Shape Language, Asset Standards (sección 8)
- **Source doc** según target type:
  - `system:` → GDD del sistema (sección Visual/Audio Requirements)
  - `level:` → Level design doc (art requirements, asset list)
  - `character:` → Character profile (visual description, rol)
- **Manifest existente** (`design/assets/asset-manifest.md`) → evitar duplicados
- **Specs existentes** → detectar assets compartidos reutilizables

---

## Phase 2: Identificar assets

Extraer de source doc todo asset mencionado o implícito:

| Categoría | Qué buscar |
|-----------|-----------|
| **Sprite / 2D** | Character sprites, UI icons, tile sheets |
| **VFX / Particles** | Hit effects, ambient particles, screen effects |
| **Environment** | Props, tiles, backgrounds, skyboxes |
| **UI** | HUD elements, menu art, fonts custom |
| **Audio** | SFX, music, ambient (descripción only, no generation prompt) |
| **3D** | Meshes, materials (si aplica) |

Presentar lista agrupada al usuario. **No avanzar sin confirmación** de la lista.

### Assets compartidos

Antes de specear, verificar si ya existe spec para un asset equivalente en otro contexto. Si existe → referenciar el ASSET-ID existente en lugar de duplicar.

---

## Phase 3: Generar specs

> → Read references/spec-output-format.md for [formato de spec por asset, campos requeridos y asset IDs]

---

## Phase 4: Escribir

Después de aprobación:
1. Spec file → `design/assets/specs/[target-name]-assets.md`
2. Actualizar/crear `design/assets/asset-manifest.md` con tabla de progress (Total/Needed/In Progress/Done)

---

> → Read references/anti-patterns-checklist.md for [anti-patterns y checklist de validación]
