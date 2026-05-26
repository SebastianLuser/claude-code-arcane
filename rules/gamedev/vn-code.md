---
name: vn-code
description: "Coding rules for Ren'Py visual novel development"
---

# Visual Novel Code Rules

## Ren'Py Script Rules
- Use `default` for variable declarations, not `$ var = value` at init
- Use layered images for characters — never hardcode expression paths in dialogue
- Every `jump` must have a matching `label` — validate before committing
- Every `menu` choice must affect at least one variable (no cosmetic-only choices)
- Keep dialogue lines under 200 characters to fit standard textboxes
- Use `nvl` mode for long exposition, letters, or documents — not ADV mode
- Flag names use snake_case: `flag_met_sakura`, `flag_chapter_2_complete`
- Relationship variables use pattern: `[character]_affinity`

## File Organization
- One file per chapter: `game/chapters/chapter_NN.rpy`
- Character definitions in `game/characters.rpy` — nowhere else
- Variables and flags in `game/variables.rpy` — nowhere else
- Game logic (inventory, relationships) in `game/logic/` — not in chapters
- Custom screens in `game/screens.rpy` — not inline in chapters

## Asset Naming Convention
- Backgrounds: `bg_[location]_[variant].png` (e.g., `bg_school_night.png`)
- Character sprites: `chars/[id]/[layer]_[variant].png`
- CG illustrations: `cg_[NNN]_[description].png`
- BGM: `bgm/[mood_or_name].ogg`
- SFX: `sfx/[description].ogg`
- Voice: `voice/[character]/[id].ogg`

## Quality Gates
- No `TODO`, `FIXME`, or `[PLACEHOLDER]` in committed scripts
- Run `/vn-testing paths` before merging any chapter
- All new flags must be declared in `variables.rpy` before use
- Every chapter must end with a `jump` to the next chapter or an ending label
