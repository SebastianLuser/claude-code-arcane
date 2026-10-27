---
paths:
  - "assets/3d/**"
---

# Meshy Files

How Meshy assets are stored. Credits and spending rules are in `.claude/rules/meshy-assets.md`, which is always loaded.

## Single master, cheap derivatives

The refined GLB is the source of truth and is **immutable**. No target is generated from the prompt: all of them come from the master.

| Target | How | Credits |
|---|---|---|
| Unity and UE5 | `meshy_convert` -> `fbx` (a single file serves both) | 1 |
| Blender | `meshy_convert` -> `blend` | 1 |
| Printing | `meshy_convert` -> `stl` (`3mf` if multicolor) | 1 |
| Web / three.js | `npx gltf-transform optimize --simplify` | **0** |

## On-disk structure

```
assets/3d/<slug>/
  meshy.json           # ledger, see below
  master.glb           # refined, immutable
  thumb.png
  targets/
    web.glb            # <=15k tris, 1024 textures, KTX2 + draco
    game.fbx           # Unity + UE5
    edit.blend
    print.stl
```

Slugs in kebab-case, no dates or task_ids in the path.

## Ledger: `meshy.json`

Mandatory per asset. Without it every new session starts blind and the same model is paid for twice.

```json
{
  "slug": "rune-pedestal",
  "prompt": "...",
  "ai_model": "meshy-5",
  "tasks": [
    { "id": "...", "op": "text_to_3d_preview", "credits": 5, "at": "2026-08-18T14:02:00Z" },
    { "id": "...", "op": "text_to_3d_refine", "credits": 25, "at": "2026-08-18T14:11:00Z" }
  ],
  "credits_total": 30,
  "derived": ["targets/web.glb", "targets/game.fbx"]
}
```

Update `meshy.json` **in the same turn** the generation happens. Do not leave it for later.

## Axes and scale

Verify once, record it in the ledger, do not think about it again.

| Target | Convention |
|---|---|
| GLB | Y-up, meters |
| Unity | Y-up, 1 unit = 1 m |
| UE5 | Z-up, 1 unit = 1 cm (rotation + factor 100) |
| Blender | Z-up, meters |

## 3D printing

`meshy_resize` to real millimeters before exporting STL.

## Rigging

The skeleton returned by `meshy_rig` is **not** the UE5 mannequin: retargeting is manual. In UE5 static meshes go to Nanite and need no decimation; skeletal meshes do need their own LODs.

## Git

- `*.glb *.fbx *.blend *.stl *.3mf` through **Git LFS**.
- `meshy.json` and `thumb.png` go in as regular files — they are small and they are what makes the catalog greppable.

## Integration with the rest of the stack

`asset-spec` defines which asset is needed -> Meshy generates it -> `asset-audit` validates the result. Meshy replaces neither of them.
