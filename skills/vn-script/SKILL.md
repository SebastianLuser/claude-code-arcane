---
name: vn-script
description: "Write and edit Ren'Py script files — dialogue, choices, branching, transitions, and screen language. The core implementation skill for VN content."
category: "visualnovel"
argument-hint: "[chapter:<name> | scene:<name> | screen:<name>] [--from-outline]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
---

When this skill is invoked:

1. **Parse target** — chapter, scene, or screen to write/edit
2. **Load context** — read existing characters, variables, flags, and story state

---

## Phase 0: Context Gathering

### Required reads:
- `game/characters.rpy` — all defined characters, their images and tags
- `game/variables.rpy` — flags, relationship vars, inventory state
- `game/logic/flags.rpy` — story progression flags
- `design/narrative/story-outline.md` — if exists, use as source of truth

### Optional reads:
- Target chapter file if editing existing
- Previous chapter for continuity
- `design/characters/*.md` — character profiles for voice consistency

---

## Phase 1: Script Structure

For **chapters**, follow this structure:

```renpy
# Chapter N: [Title]
# Scenes: [list]
# Characters: [list]
# New flags set: [list]
# Choices: [count]

label chapter_N:
    # --- Scene 1: [description] ---
    scene bg [background] with dissolve
    play music "[track]" fadein 1.0

    show [character] [expression] at [position] with dissolve
    [character] "Dialogue line."

    # Choice point
    menu:
        "Choice text A":
            $ flags.choice_N_a = True
            jump chapter_N_path_a
        "Choice text B":
            $ flags.choice_N_b = True
            jump chapter_N_path_b

label chapter_N_path_a:
    # Path A content...
    jump chapter_N_merge

label chapter_N_path_b:
    # Path B content...
    jump chapter_N_merge

label chapter_N_merge:
    # Converge paths...
    jump chapter_N_plus_1
```

## Phase 2: Dialogue Writing Rules

- Each character has a consistent voice (read character profile)
- Use `extend` for same-character continuation
- Use `{w}` for dramatic pauses within lines
- Use `{b}`, `{i}`, `{size}` for emphasis sparingly
- Narration uses the narrator (no character prefix)
- Inner thoughts use `[char] "(Thought text.)" `  with italic style
- Keep lines under 200 characters for readability in textbox
- Use `nvl` mode for long exposition or letters/documents

## Phase 3: Advanced Ren'Py Patterns

### Conditional dialogue
```renpy
if relationship_score >= 50:
    [char] "Special high-affinity dialogue."
else:
    [char] "Default dialogue."
```

### Timed menus
```renpy
menu (screen="timed_choice"):
    "Quick! What do you do?"
    "Run" (timeout_label="timeout_action"):
        jump run_path
    "Hide":
        jump hide_path
```

### Screen language integration
```renpy
show screen phone_notification("New message from [char]")
call screen phone_chat([char], messages_list)
```

### Transitions and effects
```renpy
with vpunch          # Screen shake
with flash           # White flash
with pixellate       # Pixelation
scene black with fade  # Fade to black
```

### Audio integration
```renpy
play music "bgm/tense.ogg" fadein 2.0
play sound "sfx/door_knock.ogg"
voice "voice/[char]/line_001.ogg"
```

## Phase 4: Quality Checks

Before writing the file, verify:
- All referenced characters are defined in `characters.rpy`
- All referenced images exist or are noted as TODO
- All flags set are declared in `variables.rpy`
- All `jump` targets have corresponding `label` definitions
- Choice paths either converge or lead to valid endpoints
- No orphaned labels (labels never jumped to)

## Phase 5: Write and Report

- Write the .rpy file to `game/chapters/` (or appropriate location)
- Update `game/variables.rpy` if new flags were introduced
- Show summary: scenes count, choices count, new flags, referenced assets
- Suggest: "Run `/vn-testing` to validate paths" or "Use `/vn-scene-compose` for a specific scene"
