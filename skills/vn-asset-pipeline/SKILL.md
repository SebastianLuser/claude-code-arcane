---
name: vn-asset-pipeline
description: "Manage the full asset pipeline for a visual novel: from design spec to ComfyUI generation to Ren'Py integration. Tracks asset status, consistency, and completeness."
category: "visualnovel"
argument-hint: "[status | audit | integrate | manifest] [--filter chars|bg|cg|ui|audio]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, AskUserQuestion
---

When this skill is invoked:

1. **Parse subcommand**:
   - `status` — show pipeline overview (default)
   - `audit` — check for missing/inconsistent assets
   - `integrate` — wire generated assets into Ren'Py
   - `manifest` — create or update asset manifest

---

## Subcommand: status

Scan all asset directories and report pipeline status:

```markdown
## Asset Pipeline Status

### Characters (sprites)
| Character | Base | Expressions | Outfits | Status |
|-----------|------|-------------|---------|--------|
| sakura | ✅ | 8/10 | 2/3 | In Progress |
| ryu | ✅ | 10/10 | 3/3 | Complete |
| yuki | ❌ | 0/10 | 0/2 | Spec Only |

### Backgrounds
| Location | Day | Sunset | Night | Status |
|----------|-----|--------|-------|--------|
| school_classroom | ✅ | ✅ | ✅ | Complete |
| school_rooftop | ✅ | ✅ | ❌ | Partial |
| protagonist_room | ❌ | — | ❌ | Needed |

### CG Illustrations
| ID | Scene | Characters | Status |
|----|-------|-----------|--------|
| cg_001 | First meeting | mc, sakura | ✅ Approved |
| cg_002 | Confession | mc, sakura | 🔄 Generated |
| cg_003 | Festival | mc, sakura, ryu | ❌ Needed |

### Audio
| Type | Total Needed | Available | Gap |
|------|-------------|-----------|-----|
| BGM | 12 | 8 | 4 |
| SFX | 25 | 18 | 7 |
| Voice | 0 | 0 | — |

### Summary
- Total assets needed: [N]
- Spec complete: [N] ([%])
- Generated: [N] ([%])
- Approved: [N] ([%])
- Integrated: [N] ([%])
```

---

## Subcommand: audit

Deep check for pipeline issues:

### Consistency Checks
- All character sprites same canvas dimensions
- All backgrounds same resolution
- Character colors match art bible palette
- File naming follows convention: `[type]_[name]_[variant].png`

### Reference Checks
- Every `show [image]` in .rpy files → image exists in `game/images/`
- Every `play music/sound` → file exists in `game/audio/`
- Every `scene bg [name]` → background exists
- Every character `image` tag → sprite files exist

### Missing Asset Report
```
⚠ MISSING ASSETS:
- game/images/bg/cafe_interior_night.png (referenced in chapter_04.rpy:42)
- game/images/chars/yuki/face_angry.png (defined in characters.rpy but no file)
- game/audio/bgm/festival_theme.ogg (referenced in chapter_06.rpy:15)

⚠ ORPHANED ASSETS (exist but never referenced):
- game/images/bg/old_school_exterior.png
- game/audio/sfx/unused_bell.ogg
```

---

## Subcommand: integrate

Wire generated assets into the Ren'Py project:

1. **Scan `comfyui/outputs/`** for new generated files
2. **Match to manifest** — identify which spec each output fulfills
3. **Post-process**:
   - Verify dimensions match requirements
   - Strip metadata (ComfyUI embeds workflow in PNG)
   - Rename to convention: `[type]_[name]_[variant].png`
4. **Copy to game directories**:
   - Sprites → `game/images/chars/[name]/`
   - Backgrounds → `game/images/bg/`
   - CGs → `game/images/cg/`
   - UI → `game/gui/`
5. **Update Ren'Py image definitions** if needed
6. **Update manifest** with new status

---

## Subcommand: manifest

Create or update `design/assets/asset-manifest.md`:

```markdown
# Asset Manifest

## Generation Settings
- **Art style**: [from art bible]
- **Base model**: [model name]
- **Target resolution**: [resolution]
- **ComfyUI server**: http://127.0.0.1:8188

## Character Assets
[auto-generated table from character specs]

## Background Assets
[auto-generated from story outline locations]

## CG Assets
[auto-generated from story outline events]

## UI Assets
[auto-generated from UI spec]

## Audio Assets
[auto-generated from audio cue sheets]
```

---

## Pipeline Stages

Every asset moves through these stages:

```
Needed → Spec Written → Prompt Ready → Generated → Reviewed → Approved → Integrated
```

| Stage | Owner | Action |
|-------|-------|--------|
| Needed | /vn-narrative-design | Identified in story outline |
| Spec Written | /vn-character-design or /vn-asset-spec | Visual spec document |
| Prompt Ready | /vn-character-design | ComfyUI prompts written |
| Generated | /vn-comfyui-gen | Image generated via ComfyUI |
| Reviewed | User | Visual quality check |
| Approved | User | Marked for integration |
| Integrated | /vn-asset-pipeline integrate | Copied to game/, wired in Ren'Py |

Suggest next:
- `/vn-comfyui-gen --batch` to generate all pending assets
- `/vn-testing` to verify all references resolve
