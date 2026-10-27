# Meshy Assets

Rules that must be in place before any Meshy call, even if no file is touched: every call spends credits. On-disk structure, ledger, axes, rigging and Git are in `.claude/rules/meshy-files.md`, which loads when `assets/3d/` is touched.

## Credits — every call costs real money

| Operation | Credits |
|---|---|
| `meshy_analyze_printability` | **0** |
| `meshy_check_balance`, `meshy_get_task_status`, `meshy_list_tasks`, `meshy_download_model` | **0** |
| `meshy_convert`, `meshy_resize` | 1 |
| `meshy_animate` | 3 |
| `meshy_text_to_image` | 3-9 |
| `meshy_image_to_image` | 3-12 |
| `meshy_remesh`, `meshy_rig`, `meshy_uv_unwrap` | 5 |
| `meshy_retexture`, `meshy_repair_printability` | 10 |
| `meshy_text_to_3d`, `meshy_image_to_3d`, `meshy_multi_image_to_3d` | 20-30 |
| Print white model | 20 |
| `meshy_creative_lab` | 36 |
| Print multicolor | 40 |

### Hard rules

1. **Never generate without explicit confirmation.** Always ask, even if the request looks obvious. Report the estimated cost **before** the call.
2. **Preview first.** `meshy_text_to_3d_refine` only with the preview approved by the user.
3. **Never in batch.** One asset at a time, with confirmation per asset.
4. **Check the ledger before generating.** Grep `assets/3d/*/meshy.json` for an equivalent prompt. If one exists, warn and do **not** generate.
5. **0-credit operations need no confirmation.** `analyze_printability`, `check_balance`, `get_task_status`, `list_tasks`, `download_model` run freely.

If in any doubt about whether an operation spends credits, run `meshy_check_balance` before and after and report the real delta.

## Before spending

- No target is generated from the prompt: all of them come from the master with `meshy_convert` (1).
- Never use `remesh` (5) when `convert` (1) is enough, not even for web LODs: `gltf-transform` makes them for free.
- `meshy_rig` (5) is for humanoids only: with any other model the credits are spent and the result is useless.
- If the project has an art bible, the generation prompt is derived from it, not invented.
- `meshy_analyze_printability` (free) **always** before `meshy_repair_printability` (10). Print (20 white / 40 multicolor): double confirmation.

## Secrets

`MESHY_API_KEY` (format `msy_...`) goes in `.env`, **never** in the repo or in a SKILL.md.
