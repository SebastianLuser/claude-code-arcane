---
name: blender-modeling
description: "Blender modeling for game assets: triangle budget, topology (quads, edge loops, poles), modifier stack, booleans, LODs and retopo, bmesh via script. Use for: modeling in blender, topology, modifiers, retopo, LOD, decimate."
category: "gamedev"
argument-hint: "[asset-slug] [--budget <tris>] [--lod]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# blender-modeling — Geometry

Models or fixes geometry headed for an engine. What comes out of here has to deform well,
fit the budget and export without surprises.

> Requires `/blender-context`. If it has not run, run it first: without a defined destination the tri budget
> and the axes are guesswork.

---

## Phase 1: Budget before modeling

The budget is declared first and measured afterwards. The other way around does not work: nobody deletes half of
a finished asset.

| Asset role | Tri range | Note |
|---|---|---|
| Background prop, mobile | 300 - 2k | A single material |
| Interactive prop | 2k - 8k | |
| Mobile / VR character | 8k - 20k | VR pays double: it renders twice |
| Desktop character | 20k - 60k | |
| Hero / cinematic | 60k+ | Needs its own LODs |

If the user gives a number, that number rules. If not, propose the range by role and destination and **ask for
confirmation** — do not pick silently.

In UE5 static meshes go to Nanite and the tri budget stops mattering; **skeletal
meshes do not go to Nanite** and still need LODs. Tell them apart before giving a number.

---

## Phase 2: Mesh diagnosis

On an asset that already exists, measure before giving an opinion. Headless:

```bash
blender --background <file.blend> --python-expr "
import bpy
for o in bpy.data.objects:
    if o.type != 'MESH': continue
    m = o.data
    ngons = sum(1 for p in m.polygons if len(p.vertices) > 4)
    tris  = sum(len(p.vertices) - 2 for p in m.polygons)
    print(f'{o.name}: verts={len(m.vertices)} tris={tris} ngons={ngons} '
          f'uv_layers={len(m.uv_layers)} materials={len(o.material_slots)} scale={tuple(o.scale)}')
"
```

What to look at, in this order:

1. **Scale other than 1** → unapplied unit conversion. Fix it before anything else.
2. **N-gons in deforming geometry** → they get resolved, not documented.
3. **Tris over budget** → decide with the user whether to reduce or raise the budget.
4. **Zero UV layers** → the asset cannot be textured; that is work for `/blender-materials`.
5. **Many materials** → each one is a draw call.

---

## Phase 3: Topology

Non-negotiable rules for deforming geometry:

- **Quads.** Tris only on static geometry, n-gons nowhere.
- **Edge loops at joints**: shoulder, elbow, knee, jaw. Without loops no deformation is
  possible, and weights will not fix that.
- **Poles of 5 edges or fewer.** A 6+ pole pinches the shading.
- Density proportional to deformation: the face carries more mesh than the torso.

On static geometry the only things that matter are the silhouette and efficiency. A cube with 12 tris is
perfect; subdividing it "for tidiness" is waste.

---

## Phase 4: Modifiers

The stack is non-destructive and **the order changes the result**. An order that works almost always:

```
Mirror → Array → Solidify → Bevel → Subdivision Surface → Triangulate (only on export)
```

- **Mirror before Subdivision**, never the other way around: otherwise the seam gets subdivided twice.
- **Bevel before Subdivision** for hard edges; with `Harden Normals` if the destination has no
  custom normals support.
- **Triangulate does not belong in the working stack.** The exporter triangulates on its own; keeping it on only
  clutters editing.
- Do not apply the stack "to leave it clean". Apply it when you need to edit the result, and
  at that point you lose the way back.

Booleans: `Exact` solver for precision, `Fast` for volume. Both leave garbage — a topology cleanup
always follows a boolean. An uncleaned boolean on something that deforms is a bug
waiting to happen.

---

## Phase 5: LODs and reduction

| Method | When | What it breaks |
|---|---|---|
| Decimate `Collapse` | LOD1/LOD2 of props | Topology; useless for deformation |
| Decimate `Planar` | Hard geometry, flat surfaces | Detail on curves |
| Manual retopo | Heroes, anything that deforms | Nothing, it costs time |
| Remesh (or `meshy_remesh`) | Scans and AI outputs with unusable topology | UVs, they must be redone |

Typical LOD chain: 100% → 50% → 25%. Check the silhouette at gameplay distance, not up close in the
viewport.

**A Decimate is not a finished LOD**, it is a draft. For heroes, state explicitly that
retopo is needed and do not deliver it as final.

---

## Phase 6: Scripting with bmesh

For programmatic edits, `bmesh` over `bpy.ops`:

- `bpy.ops.*` depends on context (mode, selection, active area) and under `--background` it fails or does
  something else.
- `bmesh.from_edit_mesh(me)` / `bmesh.new()` + `bm.to_mesh(me)` is deterministic.
- **Never `bpy.ops` inside a loop**: each call revalidates the whole scene and the cost is
  quadratic.

Every script that deletes data (`bpy.data.meshes.remove`, `objects.remove`) is shown to the user
before running it. No exceptions.

Scripts are versioned in the repo. **Ask for approval before writing** any new `.py` or
modifying an existing one, showing what it will do.

---

## Phase 7: Summary

Report per object: verts, tris, n-gons, materials, scale, and tris against the budget.

**Verdict:**
- **PASS** — within budget, no n-gons where it matters, scale applied.
- **CONCERNS** — it fits but carries debt: n-gons on static geometry, spare materials, a Decimate LOD
  on something that deforms. List each point.
- **FAIL** — over budget, n-gons in deforming geometry, or unapplied scale.
  State the fix per object.

## Next Steps

- `/blender-materials` for UVs, shader nodes and bake
- `/blender-animation` if the asset carries a rig
- `/blender-export` when the geometry is closed
- `/asset-audit` to validate the result once integrated into the project

---

> → Topology, budgets, axes and the rules for destructive scripts are in
> `.claude/rules/blender-files.md`.
