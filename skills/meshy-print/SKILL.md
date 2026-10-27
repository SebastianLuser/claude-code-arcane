---
name: meshy-print
description: "Prepares an asset for 3D printing with Meshy: analyze printability (free) -> repair -> resize to real mm -> STL/3MF. Use for: 3d print, printability, stl, resize mm, repair mesh for printing."
category: "gamedev"
argument-hint: "<slug> [--height-mm <n>] [--multicolor]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# meshy-print — Prepare for 3D printing

The flow is ordered by cost on purpose: free steps first, and the expensive ones only if the diagnosis justifies them.

## Input

- `<slug>` (required). No argument → show usage and stop.
- `--height-mm <n>` (optional): real height of the piece. Without it, scaling cannot be done right.
- `--multicolor` (optional): `3mf` output instead of `stl`.

Requires `assets/3d/<slug>/master.glb`. If it does not exist, stop: "Run `/meshy-generate <slug>` first."

---

## Phase 1: Analyze — free, always

```
mcp__meshy__analyze_printability
```

Costs **0 credits**. Always run it, without asking for confirmation, before anything else.

Report the diagnosis to the user concretely: non-manifold, flipped normals, thin walls, floating geometry, self-intersections. This report is what decides whether repair is worth paying for.

**If the analysis comes back clean, skip Phase 2 entirely.** Ten credits of `repair` on a healthy mesh are ten credits thrown away.

---

## Phase 2: Repair — 10 credits, only if needed

Present the gate before calling:

| | |
|---|---|
| Operation | `repair_printability` |
| Cost | 10 credits |
| Problems it fixes | (the ones Phase 1 listed) |
| Current balance | (from `check_balance`) |

With explicit confirmation, call `mcp__meshy__repair_printability` and poll with `get_task_status`.

After the repair, **run `analyze_printability` again** (free) to confirm it was fixed. Do not assume the repair worked.

If there are problems the repair does not fix, say so: some need manual editing in Blender and there is no point paying twice.

---

## Phase 3: Real scale — 1 credit

Meshy models come in arbitrary units. Without scaling, the slicer prints anything.

- **With `--height-mm`**: `mcp__meshy__resize` to that height.
- **Without `--height-mm`**: ask for the height before continuing. Do not guess.

Record the final height in the ledger — it is what prevents reprinting at the wrong scale.

Check the height against the user's printer volume if we know it; if not, tell them to verify it in the slicer.

---

## Phase 4: Export — 1 credit

`mcp__meshy__convert` to `stl` (or `3mf` with `--multicolor`, which preserves per-face color). Output: `assets/3d/<slug>/targets/print.stl` (or `.3mf`).

`mcp__meshy__send_to_slicer` is available if the user explicitly asks for it.

---

## Phase 5: Print via Meshy — only if asked

Meshy can print and ship the physical piece. It is the most expensive item in the catalog:

| | Credits |
|---|---|
| White model | 20 |
| Multicolor (`process_multicolor`) | 40 |

**Double confirmation**: show the cost, wait for confirmation, repeat the cost and the destination, wait again. Never enter this phase on your own initiative — only if the user asked for it.

---

## Phase 6: Ledger and summary

Add each task to `meshy.json` with its credits, add them to `credits_total`, add the STL/3MF to `derived[]`, record the height in mm. Show the diff and **ask for approval before writing**.

Report: verdict of the initial analysis, whether there was a repair and whether the re-analysis came back clean, final height, generated file, and **actual credits spent** (delta from `check_balance`).

**Verdict:**
- **PRINT-READY** — clean analysis, scale applied, file on disk.
- **NEEDS-MANUAL** — defects remain that the repair does not fix. List them and say what is needed in Blender.
- **BLOCKED** — the master is missing, or the height is missing and the user did not give it.

## Next Steps

- Check the piece in the slicer before printing: supports, orientation, volume
- `/meshy-derive <slug> game` if the same asset also goes into the game — the master is the same, the targets are independent

---

> Full credit table and spend rules: `.claude/rules/meshy-assets.md`. This flow's "free before paid" rule lives there too.
