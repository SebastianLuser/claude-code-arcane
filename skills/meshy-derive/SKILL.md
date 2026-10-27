---
name: meshy-derive
description: "Derives targets (FBX for Unity/UE5, optimized web GLB, blend, STL) from an asset's master GLB. Uses convert (1 credit) or gltf-transform (free), never regenerates. Use for: export asset, unity target, web target, optimize glb, web lod."
category: "gamedev"
argument-hint: "<slug> [game|web|edit|print|all]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# meshy-derive — Master to targets

Every target comes from `master.glb`. **Never regenerate from the prompt** — that is 20-30 credits for something that costs 1 or 0.

## Input

- `<slug>` (required). No argument → show usage and stop.
- Target (optional, default `all`): `game` | `web` | `edit` | `print` | `all`.

---

## Phase 1: Validate the master

- `assets/3d/<slug>/master.glb` must exist. If not, stop: "Run `/meshy-generate <slug>` first."
- Read `assets/3d/<slug>/meshy.json`. If the requested target is already in `derived[]` and the file exists on disk, **do not redo it**: report it and stop.

The master is immutable. No phase of this skill writes it.

---

## Phase 2: Pick the tool

| Target | Output | How | Credits |
|---|---|---|---|
| `game` | `targets/game.fbx` | `mcp__meshy__convert` -> `fbx` | 1 |
| `edit` | `targets/edit.blend` | `mcp__meshy__convert` -> `blend` | 1 |
| `print` | `targets/print.stl` (`.3mf` if multicolor) | `mcp__meshy__convert` | 1 |
| `web` | `targets/web.glb` | `npx gltf-transform` | **0** |

A single `game.fbx` works for both Unity and UE5. Do not generate one per engine.

**Never use `remesh` (5) where `convert` (1) is enough.** `remesh` changes topology; it is not a format converter. And never use `remesh` for web LODs: `gltf-transform` does decimation, meshopt and KTX2 locally and for free.

---

## Phase 3A: Web — free, local

```bash
npx --yes @gltf-transform/cli optimize \
  assets/3d/<slug>/master.glb \
  assets/3d/<slug>/targets/web.glb \
  --simplify --texture-compress ktx2 --compress draco
```

Budget: ≤15k tris, 1024 textures. Check the result:

```bash
npx --yes @gltf-transform/cli inspect assets/3d/<slug>/targets/web.glb
```

Report the final tris and size. If it is over budget, lower it with `--simplify-ratio` before calling it done — do not silently accept the default.

Zero credits: this phase needs no spend confirmation.

## Phase 3B: convert — 1 credit per target

Every `convert` spends. Show the user **the full list of targets and the total** in a single message and ask for one confirmation for the whole batch:

> `game` + `edit` = 2 credits. Current balance: N.

With `all`, do web first (free) and then the `convert` calls — that way the user sees a result before approving any spend.

Poll with `mcp__meshy__get_task_status`, download with `mcp__meshy__download_model`.

---

## Phase 4: Axes and scale

Check once per asset and **record it in the ledger** so nobody has to think about it again:

| Destination | Convention |
|---|---|
| GLB | Y-up, meters |
| Unity | Y-up, 1 unit = 1 m |
| UE5 | Z-up, 1 unit = 1 cm — rotation + factor 100 on import |
| Blender | Z-up, meters |

The FBX imports the same way in both engines; what changes is the import config, not the file.

**Rigging**: if the asset is rigged, Meshy's skeleton is not the UE5 mannequin — retargeting is manual. In UE5, static meshes go to Nanite and do not need LODs; skeletal meshes do.

---

## Phase 5: Update the ledger

Add each target to `derived[]` in `meshy.json`, add the `convert` credits to `tasks[]` and to `credits_total`. **In the same turn.** Show the ledger diff and **ask for approval before writing**.

Check LFS on the new files (`git check-attr filter`).

---

## Phase 6: Summary

Report: targets generated, actual credits spent (delta from `check_balance`), tris/size of the web target, and what was left undone.

**Verdict:**
- **COMPLETE** — every requested target is on disk and in the ledger.
- **PARTIAL** — one failed or the user did not approve the spend. Say which one and why.
- **SKIPPED** — they already existed, nothing was spent.

## Next Steps

- `/asset-audit` to validate naming, budgets and formats against the standards
- `/meshy-print <slug>` if it also goes to print (it has its own printability flow)
- `/blender-context` if the derived `.blend` needs cleanup: the topology Meshy produces is not
  built to deform, and the UVs usually need redoing. From there, `/blender-modeling`,
  `/blender-materials` and `/blender-export` with its glTF validator

---

> Budgets, `targets/` structure and ledger format: `.claude/rules/meshy-files.md`. Full credit table: `.claude/rules/meshy-assets.md`.
