# Ren'Py Quick Reference

## Characters
```renpy
define s = Character("Sakura", who_color="#ff69b4", image="sakura")
define narrator = Character(None, kind=nvl)  # NVL narrator
```

## Layered Images
```renpy
layeredimage sakura:
    always "chars/sakura/base.png"
    group expression:
        attribute neutral default "chars/sakura/face_neutral.png"
        attribute happy "chars/sakura/face_happy.png"
        attribute sad "chars/sakura/face_sad.png"
    group outfit:
        attribute casual default "chars/sakura/outfit_casual.png"
        attribute formal "chars/sakura/outfit_formal.png"
```

## Scene Setup
```renpy
scene bg school_classroom with dissolve
show sakura happy at right with dissolve
play music "bgm/peaceful.ogg" fadein 2.0
play sound "sfx/door_open.ogg"
```

## Dialogue
```renpy
s "Regular dialogue."
s "This has a {b}bold{/b} word and a {i}italic{/i} word."
s "Dramatic pause here.{w} Then this appears."
extend " And this continues the same line."
narrator "Narration without a speaker."
```

## Choices
```renpy
menu:
    "What should I do?"          # Optional caption
    "Option A" if flag_unlocked: # Conditional option
        $ variable += 10
        jump path_a
    "Option B":
        jump path_b
```

## Variables & Flags
```renpy
default sakura_affinity = 0
default flags = {
    "met_sakura": False,
    "chapter_1_complete": False,
}

# In script:
$ sakura_affinity += 10
$ flags["met_sakura"] = True

if sakura_affinity >= 50:
    s "Special dialogue."
elif sakura_affinity >= 25:
    s "Friendly dialogue."
else:
    s "Default dialogue."
```

## Transitions
```renpy
with dissolve        # Cross-dissolve
with fade            # Fade through black
with Fade(0.5, 0, 0.5, color="#fff")  # Custom fade
with vpunch          # Vertical shake
with hpunch          # Horizontal shake
with flash           # White flash
with pixellate       # Pixelation
with move            # Slide movement
with CropMove(1.0, "wiperight")  # Wipe
```

## Transforms & Positions
```renpy
transform my_pos:
    xalign 0.3 yalign 1.0

# ATL animation
show sakura at Transform:
    xalign 0.5 yalign 1.0 zoom 1.0
    linear 1.0 zoom 1.1
    linear 1.0 zoom 1.0
    repeat
```

## Audio
```renpy
play music "bgm/track.ogg" fadein 2.0
play music "bgm/track.ogg" loop       # Default loops
play sound "sfx/effect.ogg"            # One-shot
play audio "sfx/ambient.ogg" loop      # Ambient layer
stop music fadeout 1.0
queue music "bgm/next_track.ogg"
voice "voice/sakura/line_001.ogg"
```

## Screens
```renpy
screen phone_notification(message):
    frame:
        xalign 0.95 yalign 0.05
        text message size 20
    timer 3.0 action Hide("phone_notification")

# Show/call screens
show screen phone_notification("New message!")
call screen my_menu_screen   # Blocks until screen returns
```

## Persistent Data
```renpy
default persistent.endings_seen = set()
default persistent.cg_unlocked = set()

# Unlock a CG
$ persistent.cg_unlocked.add("cg_001")

# Check ending
if "true_ending" in persistent.endings_seen:
    # Unlock secret route
```

## Save/Load
```renpy
$ renpy.save("auto-1")    # Manual save
$ renpy.load("auto-1")    # Manual load
# Ren'Py handles save/load screens automatically
```

## Useful Config
```renpy
define config.name = "My Visual Novel"
define config.version = "1.0"
define config.screen_width = 1920
define config.screen_height = 1080
define config.has_autosave = True
define config.autosave_on_choice = True
define config.default_language = None  # Or "spanish", etc.
```

## Image Prediction
```renpy
$ renpy.start_predict("bg school_classroom")
$ renpy.start_predict("sakura *")  # All sakura variants
# ... later ...
$ renpy.stop_predict("bg school_classroom")
```

## NVL Mode
```renpy
define n = Character(None, kind=nvl)
label nvl_scene:
    window show
    n "First line of NVL text."
    n "Second line appears below."
    n "Third line continues."
    nvl clear  # Clear all NVL text
    window hide
```
