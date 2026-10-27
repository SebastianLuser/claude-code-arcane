---
name: asset-spec
description: "Generate per-asset visual specs: description, AI prompts, dimensions, format, naming, art bible anchors. Produces spec files and updates manifest."
category: "gamedev"
argument-hint: "[system:<name>|level:<name>|character:<name>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# asset-spec — Per-Asset Visual Specifications

Generates per-asset visual specs with AI generation prompts, anchored to the art bible.

## When to use

- After the art bible and GDD/level design are approved, before production
- For any batch of assets that needs consistent specs

## Requirement

The art bible must exist (`design/art/art-bible.md` or equivalent). No art bible → "Run `/art-bible` first."

---

## Phase 1: Context

Read before asking anything:
- **Art bible**: Visual Identity, Color System, Shape Language, Asset Standards (section 8)
- **Source doc** by target type:
  - `system:` → the system's GDD (Visual/Audio Requirements section)
  - `level:` → Level design doc (art requirements, asset list)
  - `character:` → Character profile (visual description, role)
- **Existing manifest** (`design/assets/asset-manifest.md`) → avoid duplicates
- **Existing specs** → detect reusable shared assets

---

## Phase 2: Identify assets

Extract from the source doc every asset mentioned or implied:

| Category | What to look for |
|-----------|-----------|
| **Sprite / 2D** | Character sprites, UI icons, tile sheets |
| **VFX / Particles** | Hit effects, ambient particles, screen effects |
| **Environment** | Props, tiles, backgrounds, skyboxes |
| **UI** | HUD elements, menu art, custom fonts |
| **Audio** | SFX, music, ambient (description only, no generation prompt) |
| **3D** | Meshes, materials (if applicable) |

Present the grouped list to the user. **Don't move on without confirmation** of the list.

### Shared assets

Before writing a spec, check whether a spec already exists for an equivalent asset in another context. If it exists → reference the existing ASSET-ID instead of duplicating.

---

## Phase 3: Generate specs

> → Read references/spec-output-format.md for [per-asset spec format, required fields and asset IDs]

---

## Phase 4: Write

After approval:
1. Spec file → `design/assets/specs/[target-name]-assets.md`
2. Update/create `design/assets/asset-manifest.md` with a progress table (Total/Needed/In Progress/Done)

---

> → Read references/anti-patterns-checklist.md for [anti-patterns and validation checklist]
