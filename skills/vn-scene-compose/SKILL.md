---
name: vn-scene-compose
description: "Compose complete visual novel scenes: character positioning, background selection, music, transitions, and camera direction. Visual storyboarding for Ren'Py."
category: "visualnovel"
argument-hint: "[chapter:<name> scene:<number>] [--storyboard]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
---

When this skill is invoked:

1. **Parse target** — chapter and scene number
2. **Load context**:
   - Read `design/narrative/story-outline.md` — scene descriptions
   - Read target chapter .rpy if exists
   - Read `game/characters.rpy` — available characters
   - Glob `game/images/bg/` — available backgrounds
   - Glob `game/audio/bgm/` — available music tracks
   - Read `design/ui/ui-spec.md` — UI layout reference

---

## Phase 1: Scene Breakdown

For each beat in the scene, define:

| Beat | BG | Characters | Expressions | Music | SFX | Transition |
|------|-----|-----------|-------------|-------|-----|-----------|
| 1 | school_hallway | mc(center), sakura(right) | mc:neutral, sakura:happy | school_theme | — | dissolve |
| 2 | — (same) | mc(center), sakura(right) | mc:surprised, sakura:embarrassed | — | heart_beat | — |
| 3 | school_rooftop | mc(left), sakura(right) | mc:determined, sakura:sad | melancholy_piano | wind | fade |

---

## Phase 2: Character Staging

### Position System
Define character positions using Ren'Py transforms:

```renpy
transform left_pos:
    xalign 0.15
    yalign 1.0

transform center_left:
    xalign 0.35
    yalign 1.0

transform center_pos:
    xalign 0.5
    yalign 1.0

transform center_right:
    xalign 0.65
    yalign 1.0

transform right_pos:
    xalign 0.85
    yalign 1.0
```

### Staging Rules
- **2 characters**: left (0.3) + right (0.7)
- **3 characters**: left (0.15) + center (0.5) + right (0.85)
- **Speaker focus**: active speaker slightly larger or forward (`zoom 1.05`)
- **Emotional distance**: characters physically closer = emotionally closer
- **Power dynamics**: higher position = more authority

### Character Enter/Exit Patterns
```renpy
# Entrance
show sakura happy at right_pos with dissolve

# Expression change
show sakura sad

# Move
show sakura at center_pos with move

# Exit
hide sakura with dissolve
```

---

## Phase 3: Camera Direction

Ren'Py camera-like effects for cinematic scenes:

### Zoom/Pan (ATL)
```renpy
# Slow zoom on character during emotional moment
show sakura at Transform(zoom=1.0):
    linear 2.0 zoom 1.2 xoffset -100

# Pan across background
scene bg school_panorama:
    xalign 0.0
    linear 5.0 xalign 1.0
```

### Focus Shifts
```renpy
# Blur background, focus character
show bg school with Dissolve(0.5):
    blur 5

# Darken scene for internal monologue
show black at Transform(alpha=0.4)
```

### Split Screen (for parallel events)
```renpy
screen split_scene(left_image, right_image):
    hbox:
        frame:
            xsize 960
            add left_image
        frame:
            xsize 960
            add right_image
```

---

## Phase 4: Audio Direction

### Music Layer System
```renpy
# Base BGM
play music "bgm/school_peaceful.ogg" fadein 2.0

# Transition to tense version
play music "bgm/school_tense.ogg" fadein 1.0 fadeout 1.0

# Layer ambient sounds
play audio "sfx/ambience_classroom.ogg" loop fadein 1.0
```

### Sound Design Per Beat
- **Emotional peak**: music swell + specific SFX
- **Silence**: stop music for dramatic pause (`stop music fadeout 2.0`)
- **Transition**: crossfade between tracks for smooth scene changes
- **Impact moments**: SFX + screen effect (vpunch + impact sound)

---

## Phase 5: Storyboard Mode (--storyboard)

When `--storyboard` flag is set, generate a visual storyboard document:

```markdown
## Scene 3.2: Rooftop Confession

### Beat 1: Arrival
```
┌─────────────────────────────────────┐
│          [school_rooftop_sunset]    │
│                                     │
│   ┌────┐                  ┌────┐   │
│   │ MC │                  │SAK │   │
│   │neut│                  │happ│   │
│   └────┘                  └────┘   │
│ ┌─────────────────────────────────┐ │
│ │ Sakura: "Thanks for coming up   │ │
│ │ here. I needed to talk to you." │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
🎵 melancholy_piano (fadein 2s)
```

### Beat 2: The Question
```
┌─────────────────────────────────────┐
│          [school_rooftop_sunset]    │
│                                     │
│         ┌────┐      ┌────┐         │
│         │ MC │      │SAK │         │
│         │surp│      │emba│         │
│         └────┘      └────┘         │
│ ┌─────────────────────────────────┐ │
│ │ [CHOICE]                        │ │
│ │ ▶ "I feel the same way."       │ │
│ │   "I need time to think."      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
🔊 heart_beat.ogg
```
```

---

## Phase 6: Generate Ren'Py Code

Convert the scene composition into a complete .rpy scene block:

```renpy
label chapter_3_scene_2:
    scene bg school_rooftop_sunset with fade
    play music "bgm/melancholy_piano.ogg" fadein 2.0

    show sakura happy at right_pos with dissolve
    sak "Thanks for coming up here. I needed to talk to you."

    show mc neutral at left_pos with dissolve
    mc "Of course. What's on your mind?"

    show sakura embarrassed
    play sound "sfx/heart_beat.ogg"
    sak "I... I've been meaning to tell you something."

    show mc surprised
    menu:
        "I feel the same way.":
            $ sakura_affinity += 15
            jump ch3_s2_confess
        "I need time to think.":
            $ sakura_affinity += 5
            jump ch3_s2_delay
```

---

## Phase 7: Output

1. Ren'Py scene code → `game/chapters/[chapter]_scene_[N].rpy` or inline
2. Storyboard → `design/narrative/storyboards/[chapter]_scene_[N].md`
3. Missing asset list → assets referenced but not yet generated
4. Audio cue sheet → `design/audio/[chapter]_audio_cues.md`

Suggest next:
- `/vn-script` to fill in complete dialogue
- `/vn-comfyui-gen` for any missing assets flagged
- `/vn-testing` to validate the scene plays correctly
