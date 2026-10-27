---
name: meshy-generate
description: "Generates a 3D asset with Meshy: preview -> approval -> refine, with a credit gate, dedupe against the ledger and writing of meshy.json. Use for: generate a 3D model, text to 3d, image to 3d, create an asset with meshy."
category: "gamedev"
argument-hint: "<slug> [--from-image <path>] [--spec <path>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# meshy-generate — Generate a 3D asset

One asset per run. **Never in batch.** Every generation call costs 20-30 real credits.

## Input

- `<slug>` (required): kebab-case, no dates or task_ids. It is the folder name. No argument → show usage and stop.
- `--from-image <path>` (optional): uses `image_to_3d` instead of `text_to_3d`. With several images, `multi_image_to_3d`.
- `--spec <path>` (optional): an `asset-spec` spec the prompt comes from.

---

## Phase 1: Dedupe — before spending

```bash
grep -rl "<term>" assets/3d/*/meshy.json 2>/dev/null
```

Search by slug and by the prompt's keywords. **If there is an equivalent asset, stop**: show it to the user, with its `credits_total`, and ask whether they want to reuse it, derive a new target with `/meshy-derive`, or generate anyway.

If `assets/3d/<slug>/` already exists, don't overwrite it. Stop and ask.

---

## Phase 2: Prompt

- **With `--spec`**: the prompt comes from the spec, verbatim.
- **Without a spec**: if an art bible exists (`design/art/art-bible.md` or equivalent), derive the prompt from it — style, palette, level of detail. If it doesn't exist, draft it with the user.
- Never invent a style that contradicts the art bible.

Show the final prompt and ask for approval. The approved prompt goes into the ledger verbatim: that is what makes the next session's dedupe work.

---

## Phase 3: Credit gate

Before the first call that spends:

```
mcp__meshy__check_balance
```

Present to the user, in a single message:

| | |
|---|---|
| Operation | `text_to_3d` preview |
| Estimated cost | 20-30 credits (preview + refine) |
| Current balance | (from `check_balance`) |

**Wait for explicit confirmation.** Don't generate on a vague "go ahead" about something else — the confirmation has to be about the cost shown.

---

## Phase 4: Preview

Call `mcp__meshy__text_to_3d` (or `image_to_3d` / `multi_image_to_3d`) in preview mode. Poll with `mcp__meshy__get_task_status` — it is free, there is no reason to guess.

Download the preview with `mcp__meshy__download_model` and **show it to the user**. Record the `task_id` and the preview's credits in the ledger at this point already: if the refine is canceled, the preview spend still happened and has to be recorded.

---

## Phase 5: Refine — only with the preview approved

If the preview isn't convincing: **don't refine**. Options, in order of cost:
1. Adjust the prompt and preview again.
2. `retexture` (10) if the geometry works and the problem is the texture.
3. Discard.

With the preview approved, call `mcp__meshy__text_to_3d_refine`. The resulting GLB is the **master** and is immutable — nothing edits it afterwards.

---

## Phase 6: Write to disk

```
assets/3d/<slug>/
  meshy.json
  master.glb
  thumb.png
```

Show the contents of `meshy.json` and **ask for approval before writing**. It is written **in this same turn**, with the verbatim prompt, `ai_model`, one entry per task with its credits, and `credits_total`. The exact format is in the rule.

Check that `master.glb` is covered by Git LFS (`git check-attr filter assets/3d/<slug>/master.glb`). If it isn't, warn — committing a GLB without LFS pollutes the repo in a way that is hard to revert.

---

## Phase 7: Summary

Report:
- Slug, the prompt used and where it came from (spec / art bible / drafted).
- Task ids and **real credits spent** (run `check_balance` again and report the delta against Phase 3).
- Files written.
- LFS status.

**Verdict:**
- **COMPLETE** — master on disk, ledger written, LFS ok.
- **PARTIAL** — credits were spent on the preview but there was no refine. The ledger has to reflect it anyway. State how much was spent.
- **ABORTED** — nothing was spent. State why.

## Next Steps

- `/meshy-derive <slug>` for the targets (FBX, web, blend) — the master is not touched
- `/meshy-print <slug>` if it is going to print
- `/asset-audit` to validate against the project's standards

---

> Full credit table, spending rules, ledger format and axis/scale conventions: `.claude/rules/meshy-assets.md` and `.claude/rules/meshy-files.md`. Read them before Phase 3.
