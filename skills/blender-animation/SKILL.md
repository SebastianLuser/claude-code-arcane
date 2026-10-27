---
name: blender-animation
description: "Rigging and animation in Blender for engines: armature and bone naming, weights, constraints and IK that must be baked, FCurves, actions and NLA as clips, root motion, Mixamo retargeting, shape keys. Use for: animating in blender, rig, armature, mixamo retarget, root motion, shape keys."
category: "gamedev"
argument-hint: "[asset-slug] [--retarget <fbx>] [--bake]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# blender-animation — Rig and animation

Rig and animation bound for an engine. The rule that organizes the whole skill: **the engine receives
keyframes, not a rig.** Everything clever in the rig exists to produce those keyframes and then
disappears.

> Requires `/blender-context`. With unfinished geometry, rigging is not worth it: every
> topology change invalidates the weights.

---

## Phase 1: What gets exported and what doesn't

| In Blender | To the engine | What to do |
|---|---|---|
| Keyframes on bones | **Exported** | This is the path |
| Armature + weights | Exported | |
| Shape keys / morph targets | Exported | Check the engine's limit |
| **Constraints** (IK, Copy Rotation, Limit) | **Not exported** | **Bake** |
| Drivers | Not exported | Bake |
| Helper-rig bone constraints | No | Bake and exclude the helper bones |
| Animated modifiers | No | Bake to shape keys or to keyframes |

A rig with IK exported without baking reaches the engine with the character in rest pose and **no
visible error**. It is the most common failure and the most confusing one to diagnose.

---

## Phase 2: Armature

- A single armature per character, with the object at the origin and scale 1.
- **Naming with a `.L` / `.R` suffix** (`upper_arm.L`). Without it, pose and weight mirroring don't
  work, and neither do the symmetry tools.
- A hierarchy with a single root. If the target is UE5 and you want to reuse the mannequin's animation, follow
  its nomenclature from the start: renaming later is worse.
- Consistent **bone roll**: coherent rotation axes between symmetric bones, or the animation
  curves become unreadable.
- Helper and control bones marked in a recognizable way (prefix, or their own collection) so
  they can be excluded from the export.

Diagnostics:

```bash
blender --background <file.blend> --python-expr "
import bpy
for o in bpy.data.objects:
    if o.type == 'ARMATURE':
        bones = o.data.bones
        print(f'{o.name}: bones={len(bones)} scale={tuple(o.scale)}')
        print('  without L/R suffix:', [b.name for b in bones if not b.name.endswith(('.L','.R'))][:10])
for a in bpy.data.actions:
    print(f'action {a.name}: frames={tuple(a.frame_range)} fcurves={len(a.fcurves)}')
"
```

---

## Phase 3: Weights

- Start with `Automatic Weights` and fix by hand; not the other way around.
- **At most 4 influences per vertex.** That is the practical limit of most engines: if there are
  more, the engine drops the extras and the deformation changes compared to Blender.
- Normalize everything before exporting.
- A vertex with weight 0 on every bone stays at the origin. It looks like a spike coming out
  of the character.

---

## Phase 4: Actions, FCurves and NLA

- **One action = one clip** in the engine. Name them the way they will be called there (`Idle`, `Run`,
  `Attack_01`), not `Action.003`.
- Interpolation: `Bezier` for organic motion, `Linear` for mechanical, `Constant` for
  stop-motion. The curve is part of the animation, not a technical detail.
- Cycles with the `Cycles` F-Modifier while working, but **on export you need real frames**:
  the modifier doesn't travel.
- NLA is for organizing and for baking combinations. The engine receives the actions, not the
  NLA structure.
- **The `.blend` frame rate equals the engine's.** A mismatch looks like slowed-down or sped-up
  animation and gets mistaken for a blending problem.
- Loops: the last frame doesn't repeat the first. If it does, the loop has a one-frame hitch.

---

## Phase 5: Root motion

Decide **before** animating, because it changes how you animate:

| | In-place | Root motion |
|---|---|---|
| Root bone | Still at the origin | Moves with the character |
| Who moves the character | The code | The animation |
| When | Locomotion with responsive control | Attacks, finishers, cinematics |

Mixing both in the same set without saying so produces foot sliding that people later try to
fix with runtime IK. Record the decision per clip.

---

## Phase 6: Bake before exporting

```bash
blender --background <file.blend> --python <bake_script.py>
```

The script has to, in this order:

1. Select the armature and enter Pose Mode.
2. Bake with **visual keying** (respects constraints and IK) over the action's real range.
3. Remove or disable the constraints already baked.
4. Keep only the deform bones in the export; the control bones stay out.
5. Save to a separate `.blend` or to a new action — **don't overwrite the working rig.**

That last point is not optional: a bake over the original rig destroys the ability to animate
again. **Ask for approval before writing** the bake script and before generating the output
`.blend`, saying explicitly which file is created and which one is left untouched.

---

## Phase 7: Mixamo retargeting

When the animation comes from Mixamo:

1. **Scale**: Mixamo exports in centimeters. Apply a 0.01 factor or the import ends up 100x.
2. **Reference pose**: Mixamo is T-pose. If the target rig is A-pose, align the rest pose
   before mapping or the shoulders come out broken.
3. **Bone mapping**: `mixamorig:Hips` → the rig's root, and down from there. Mixamo's
   names are stable, so the mapping is written once and reused.
4. Bake the result (Phase 6) and **delete the Mixamo bones** that don't belong to the rig.
5. Check foot contact with the floor, which is the first thing to break.

If the project uses another tool's Mixamo toolkit, respect it instead of writing a
parallel mapping.

---

## Phase 8: Summary

Report: total bones and how many lack an L/R suffix, actions with name and range, frame rate,
max influences per vertex, what was baked, and the root motion decision per clip.

**Verdict:**
- **PASS** — keyframes baked, consistent naming, frame rate equal to the engine's, weights
  normalized with 4 influences or fewer.
- **CONCERNS** — exportable with debt: bones without a suffix, actions with autogenerated names, root
  motion undecided. List each point.
- **FAIL** — constraints or IK not baked, frame rate different from the engine's, or weights not
  normalized. State the fix.

## Next Steps

- `/blender-export` to export the skeletal mesh and the clips
- `/adaptive-music` or `/sfx-design` if the animation needs synced audio
- `/asset-audit` to validate the integrated result
- In UE5, `/ue-animation-system` for the engine side

---

> → Constraint baking, frame rate and axes are covered in `.claude/rules/blender-files.md`.
