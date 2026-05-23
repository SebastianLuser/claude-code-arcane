---
name: vn-ui-design
description: "Design the complete UI/UX for a visual novel: textbox, menus, gallery, settings, transitions, and custom Ren'Py screens. Produces screen specs and gui.rpy customization."
category: "visualnovel"
argument-hint: "[textbox | menus | gallery | settings | all] [--style <style>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebSearch, AskUserQuestion
---

When this skill is invoked:

1. **Parse target** — which UI component(s) to design
2. **Load context**:
   - Read `design/art/art-bible.md` — visual identity
   - Read `game/gui.rpy` — current GUI config
   - Read `game/screens.rpy` — existing custom screens
   - Read `design/narrative/story-outline.md` — features that need UI

---

## Phase 1: UI Style Direction

Ask the user using `AskUserQuestion`:

**Tab "Style"**: What UI aesthetic fits your visual novel?
- Minimalist & Clean (modern, thin borders, lots of transparency)
- Ornate & Decorative (frames, flourishes, themed borders)
- Themed & Immersive (UI matches the game world — e.g., magical runes, sci-fi HUD)
- Retro & Nostalgic (classic VN style — opaque textbox, simple menus)

**Tab "Textbox"**: Where should the dialogue textbox appear?
- Bottom (ADV mode — standard, character sprites visible above)
- Full screen (NVL mode — text fills the screen, novel format)
- Hybrid (ADV default, NVL for specific scenes like letters/memories)

**Tab "Color"**: What's the primary UI color scheme?
- Match art bible palette
- Dark theme (dark backgrounds, light text)
- Light theme (light backgrounds, dark text)
- Custom (specify colors)

---

## Phase 2: Textbox Design (ADV Mode)

### Layout Specification

```
┌─────────────────────────────────────────────────────┐
│ Screen (1920 x 1080)                                │
│                                                     │
│  ┌──────┐            ┌──────┐           ┌──────┐   │
│  │ Char │            │ Char │           │ Char │   │
│  │ Left │            │Center│           │Right │   │
│  │      │            │      │           │      │   │
│  └──────┘            └──────┘           └──────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ┌──────────┐                                    │ │
│ │ │ Name     │                                    │ │
│ │ └──────────┘                                    │ │
│ │ Dialogue text appears here, line by line.       │ │
│ │ It wraps naturally within the textbox bounds.   │ │
│ │                                    [Auto] [Skip]│ │
│ └─────────────────────────────────────────────────┘ │
│  [Q.Save] [Q.Load] [Log] [Auto] [Skip] [Prefs]    │
└─────────────────────────────────────────────────────┘
```

### gui.rpy Parameters
```renpy
define gui.textbox_height = 278
define gui.textbox_yalign = 1.0
define gui.text_xpos = 268
define gui.text_ypos = 60
define gui.text_width = 1384
define gui.name_xpos = 280
define gui.name_ypos = 12
define gui.name_xalign = 0.0
define gui.text_size = 33
define gui.name_text_size = 45
define gui.text_color = "#ffffff"
define gui.name_text_color = "#ffffff"  # Override per character
```

### Textbox Features
- Semi-transparent background with blur (or custom image)
- Character name plate with per-character color
- Click-to-advance indicator (animated arrow or pulse)
- Quick menu buttons (save, load, log, auto, skip, prefs)
- Text speed control (characters per second)
- Auto-advance timer display

---

## Phase 3: NVL Mode Design (if hybrid)

```renpy
screen nvl(dialogue, items=None):
    window:
        style "nvl_window"
        has vbox:
            spacing 15
        for d in dialogue:
            window:
                id d.window_id
                has hbox:
                    spacing 20
                if d.who:
                    text "[d.who]" style "nvl_name"
                text d.what style "nvl_dialogue"
        if items:
            for i in items:
                textbutton i.caption action i.action style "nvl_button"
```

---

## Phase 4: Menu Screens

### Title Screen
```
┌─────────────────────────────────────────────────┐
│                                                 │
│              [Title Art / Logo]                  │
│                                                 │
│              ▶ New Game                          │
│                Continue                         │
│                Load                             │
│                Gallery                          │
│                Settings                         │
│                Quit                             │
│                                                 │
│                         v1.0                    │
└─────────────────────────────────────────────────┘
```

### Save/Load Screen
- Grid layout: 3 columns × N rows with scroll
- Each slot shows: screenshot thumbnail, chapter name, date/time, playtime
- Empty slots show "Empty Slot" with subtle styling
- Page navigation (1-10+ pages)
- Auto-save slot at top (locked from manual save)

### Settings Screen
- **Display**: fullscreen/windowed, resolution
- **Text**: speed (slider), auto-advance speed, font size
- **Sound**: master, BGM, SFX, voice (per-character voice toggle)
- **Skip**: seen text only / all text, after choices
- **Accessibility**: dyslexia font toggle, high contrast mode

### History/Log Screen
- Scrollable dialogue history
- Character names color-coded
- Voice replay button (if voice acting exists)
- Jump-to-choice feature (optional)

### Gallery/CG Screen
- Grid of CG thumbnails (locked ones show silhouette)
- Full-screen viewer with zoom
- Progress counter: "12 / 24 CGs unlocked"
- Scene replay list (unlocked endings)
- Music player (unlocked BGM tracks)

---

## Phase 5: Choice UI Design

### Standard Choice
```
┌───────────────────────────────┐
│    Choice text option A       │  ← hover: highlight + scale
├───────────────────────────────┤
│    Choice text option B       │
├───────────────────────────────┤
│    Choice text option C       │
└───────────────────────────────┘
```

### Timed Choice (optional)
- Timer bar at top that depletes
- Default action on timeout
- Visual urgency (color shift, pulse)

### Stat-Gated Choice
- Locked options show grayed out with requirement: "[Courage 30 required]"
- Unlocked options show stat bonus: "+10 Affinity"

---

## Phase 6: Transitions and Effects

Define Ren'Py transitions for common VN moments:
```renpy
define fade = Fade(0.5, 0.0, 0.5)
define slow_fade = Fade(1.0, 0.5, 1.0)
define flashback = Fade(0.3, 0.5, 0.3, color="#ffffff")
define dream_dissolve = Dissolve(2.0)
define dramatic_reveal = CropMove(1.0, "wiperight")
```

Screen effects:
- `vpunch` / `hpunch` for impact
- Rain/snow particle overlay screen
- Vignette overlay for tense scenes
- Sepia filter for flashback scenes

---

## Phase 7: Output Files

1. `design/ui/ui-spec.md` — complete UI specification document
2. `game/gui.rpy` — updated GUI configuration
3. `game/screens.rpy` — custom screen definitions
4. `design/ui/mockups/` — ASCII mockups for each screen
5. Asset list for `/vn-comfyui-gen ui` — UI elements to generate

Suggest next:
- `/vn-comfyui-gen ui` to generate UI assets
- `/vn-scene-compose` to see full scenes with UI overlay
