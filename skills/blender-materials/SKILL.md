---
name: blender-materials
description: "Materials and textures in Blender for game assets: Principled BSDF, UVs and lightmap UV1, baking procedurals to texture, color space, OpenGL vs DirectX normal maps, atlases and draw calls. Use for: blender materials, textures, UV unwrap, bake, shader nodes, normal map."
category: "gamedev"
argument-hint: "[asset-slug] [--bake] [--target unity|ue5|web]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# blender-materials — Materials and textures

Leaves the asset with materials that **survive the export**. Half of the look bugs in the
engine originate here, and almost all of them are color space or normal map convention.

> Requires `/blender-context`. The target (Unity / UE5 / web) changes concrete decisions in this
> skill; it is not a detail.

---

## Phase 1: What survives the export

| In Blender | glTF / FBX | What to do |
|---|---|---|
| Principled BSDF with textures | **Survives** | This is the way |
| Principled BSDF with flat values | Survives | Ok for untextured assets |
| Procedural nodes (Noise, Voronoi, Musgrave) | **Does not survive** | Bake to texture |
| Custom node groups | Does not survive | Bake |
| Shader mixes, Geometry / Object Info | Does not survive | Bake |
| Emission | Survives (own channel) | |
| True displacement | Does not survive | Bake to normal, or put it in the mesh |

Rule of thumb: **if it is not a Principled BSDF fed by Image Textures, it does not exist outside
Blender.** Before polishing a procedural shader, decide whether it gets baked; if it does not, it is
wasted time.

---

## Phase 2: UVs

Headless diagnosis:

```bash
blender --background <file.blend> --python-expr "
import bpy
for o in bpy.data.objects:
    if o.type != 'MESH': continue
    uvs = [l.name for l in o.data.uv_layers]
    print(f'{o.name}: uv_layers={uvs or \"NONE\"} materials={len(o.material_slots)}')
"
```

- **No UVs, no textures.** It is the first thing to fix.
- **UV0**: the texture map. It can overlap if the texture is tileable; **it cannot overlap if it
  is going to be baked**.
- **UV1**: lightmaps. Unity and UE5 expect it **without overlap and with margin** between islands. If the
  asset will receive baked lighting and has no UV1, the lightmap comes out blotchy and nobody knows why.
- Consistent texel density within the same set of assets. A prop with twice the density of
  the one next to it is more noticeable than a prop with fewer polygons.
- Island margin proportional to resolution: 2px at 1K, 4px at 2K. Less margin = bleeding.

---

## Phase 3: Color space — the silent bug

This is not a preference, it is right or wrong:

| Texture | Color space |
|---|---|
| Base Color / Albedo / Emission | **sRGB** |
| Normal | **Non-Color** |
| Roughness / Metallic / AO / Displacement / Mask | **Non-Color** |

A Roughness in sRGB looks *almost* right in Blender and **wrong** in the engine, with an error that does not
look like a texture issue. Verify before exporting:

```bash
blender --background <file.blend> --python-expr "
import bpy
for img in bpy.data.images:
    print(f'{img.name}: colorspace={img.colorspace_settings.name} size={tuple(img.size)}')
"
```

And while you are at it: power-of-two resolutions. A 1000x1000 texture does not compress the same as a
1024x1024 one, and on mobile the difference is real.

---

## Phase 4: Normal maps

| Target | Convention | Green channel |
|---|---|---|
| Blender | OpenGL (+Y) | As is |
| glTF / GLB | OpenGL (+Y) | As is |
| Unity | OpenGL (+Y) | As is |
| **UE5** | **DirectX (-Y)** | **Inverted** |

If the target is UE5, there are two ways out: invert the green channel in the texture, or flag it on
engine import. **Pick one and write it down** — the symptom of getting it wrong is lighting that seems
to come from the opposite side, and it gets diagnosed late.

The Normal Map node in Blender needs the Image Texture in Non-Color and its own `Strength`. A
Strength other than 1 is not exported as such: it gets baked or lost.

---

## Phase 5: Bake

When there are procedurals that must be kept:

1. **UV0 without overlap** (a requirement, not a suggestion).
2. Create the target Image Texture at the final resolution.
3. Bake in Cycles (EEVEE does not bake everything). Useful types: `Diffuse` without lights for albedo,
   `Normal`, `Roughness`, `AO`, `Combined` only if you want lighting stuck to the texture.
4. Bake **margin** to avoid seams.
5. If baking from high-poly to low-poly: `Selected to Active` with a **cage** and adjusted `Extrusion`.
   Without a cage, the edges come out dirty.
6. Save the image to disk. A baked image that stayed only in memory is lost on close and
   gives no warning.

After the bake, replace the procedurals with the Image Textures and **verify the look did not
change**. If it changed, the bake is wrong, not the shader.

A bake writes images to the repo and can overwrite existing textures. **Ask for approval before
writing**, listing the target files, and never overwrite a source texture without confirming it.

---

## Phase 6: Materials and draw calls

Number of materials = number of draw calls per object. Before adding a material:

- Can it be solved with a mask in the same texture?
- Can it be atlased with the assets of the same set?

A prop with 6 materials and one with 1 atlased material look the same and cost differently. On mobile
and VR the difference is what decides whether the frame fits.

Name materials after the asset (`M_<asset>_<part>`); a `Material.001` that reaches the
engine is impossible to trace later.

---

## Phase 7: Summary

Report per object: UV layers, named materials, textures with their color space and resolution,
what was baked, and the chosen normal map convention.

**Verdict:**
- **PASS** — UVs present, correct color space, no unbaked procedurals, powers of two.
- **CONCERNS** — works but with debt: UV1 missing and the asset receives baked lighting, extra
  materials, non-power-of-two textures. List each point.
- **FAIL** — no UVs, inverted color space, unbaked procedurals the look needs, or
  a normal map with the wrong convention for the target. State the fix.

## Next Steps

- `/blender-animation` if the asset has a rig
- `/blender-export` when materials and UVs are closed
- `/asset-audit` to validate naming and formats once integrated
- `/shader-dev` if the look needs a custom shader in the engine, not a texture

---

> → Color space, normal map conventions and material budget are in
> `.claude/rules/blender-files.md`.
