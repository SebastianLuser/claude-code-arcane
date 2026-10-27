---
paths:
  - "**/*.blend"
  - "**/*.fbx"
  - "**/*.glb"
  - "**/*.gltf"
---

# Blender Files

How a Blender asset has to come out toward an engine or the web. How to operate Blender without breaking anything is in `.claude/rules/blender-pipeline.md`, which is always loaded.

## Axes, scale and units

Verify once per project, write it down, do not think about it again.

| Target | Convention | When exporting from Blender |
|---|---|---|
| Blender | Z-up, right-handed, 1 unit = 1 m | — |
| glTF / GLB | Y-up, meters | The exporter converts on its own (`+Y up`) |
| Unity | Y-up, left-handed, 1 unit = 1 m | glTF comes out straight; with FBX check the axis |
| UE5 | Z-up, left-handed, 1 unit = 1 cm | Factor 100 |

Hard rules:

- **Apply scale before exporting** (`Object → Apply → Scale`). An object that leaves with a `scale`
  other than 1 drags the problem into the engine and breaks physics and skinning.
- Origin at the floor for props and characters; at the center for objects that rotate around themselves.
- A node with scale `100` or `0.01` in the exported file is an unapplied unit conversion,
  not a design decision. It gets fixed, not documented.

## Topology

- **Quads on everything that deforms.** Tris only on static geometry. N-gons on nothing that deforms.
- Edge loops at joints, poles of 5 edges or fewer.
- Triangle budget declared **before** modeling, not measured afterwards.
- A LOD generated with Decimate is a draft. Hero assets get a manual retopo.

## Materials and textures

- **Principled BSDF and nothing else** on what gets exported. Procedural nodes do not survive
  glTF or FBX: if the look depends on them, bake it to a texture.
- Color space: Base Color in sRGB; Normal, Roughness, Metallic and AO in **Non-Color**. It is the most
  common bug and the quietest.
- Normal maps: Blender, glTF and Unity use OpenGL (+Y). **UE5 uses DirectX (-Y)**: invert
  the green channel or flag it on import.
- Power-of-two resolutions. Consistent texel density across assets of the same set.
- Number of materials = draw calls. Atlas before adding materials.

## Animation

- **Constraints are not exported, keyframes are.** Every rig with IK, drivers or constraints gets
  baked (`nla.bake` with visual keying) before exporting.
- The `.blend` frame rate equals the engine's. A mismatch shows up as slow or sped-up animation,
  not as an error.
- Bones with a `.L` / `.R` suffix so symmetry works.
- Root motion: root bone at the origin. Decide in-place vs root motion **before** animating.

## Git

- `*.blend *.fbx *.glb *.gltf` through **Git LFS**. Check `git lfs version` before adding the
  entries: worse than not having them is having them without LFS installed.
- `*.blend1` and `*.blend2` (Blender backups) go in `.gitignore`, never in the repo.
- Source textures (`.psd`, `.kra`, bake `.exr`) through LFS; final `.png` files too.

## Integration with the rest of the stack

`asset-spec` defines which asset is needed → Meshy or manual modeling produces it → **Blender
cleans it up and exports it** → `asset-audit` validates the result in the project.

Blender is the middle step, not the beginning or the end. If the asset came from `meshy-derive`, the
`.blend` it downloaded is the entry point; it is not regenerated from Meshy to fix topology.
