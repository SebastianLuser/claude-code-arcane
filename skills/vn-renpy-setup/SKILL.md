---
name: vn-renpy-setup
description: "Initialize and configure a Ren'Py visual novel project with best-practice structure, screens, config, and build targets."
category: "visualnovel"
argument-hint: "[project-name] [--lang en|es|ja] [--resolution 1920x1080|1280x720]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, AskUserQuestion
---

When this skill is invoked:

1. **Parse arguments** for project name, language, and resolution. Defaults:
   - Language: `es` (Spanish)
   - Resolution: `1920x1080`

2. **Check for existing Ren'Py project** — look for `game/script.rpy` or
   `game/options.rpy`. If found, offer to audit the existing project instead
   of creating a new one.

3. **Locate Ren'Py SDK** — search common paths:
   - `C:\Users\*\renpy-*\`
   - `C:\Program Files\RenPy\`
   - `%APPDATA%\RenPy\`
   - Ask user if not found

---

## Phase 1: Project Scaffolding

Create the full Ren'Py project structure:

```
[project-name]/
├── game/
│   ├── script.rpy              # Main entry point
│   ├── options.rpy             # Game config (title, version, resolution)
│   ├── gui.rpy                 # GUI customization
│   ├── screens.rpy             # Custom screen definitions
│   ├── characters.rpy          # Character definitions (name, color, image)
│   ├── variables.rpy           # Global variables, flags, relationship stats
│   ├── chapters/               # Story chapters (one .rpy per chapter)
│   │   ├── chapter_01.rpy
│   │   └── _chapter_template.rpy
│   ├── dialogue/               # Reusable dialogue fragments
│   ├── logic/                  # Game logic (inventory, affinity, conditions)
│   │   ├── relationships.rpy
│   │   ├── inventory.rpy
│   │   └── flags.rpy
│   ├── images/                 # All image assets
│   │   ├── bg/                 # Backgrounds
│   │   ├── chars/              # Character sprites (layered)
│   │   │   └── [char_name]/    # Per-character folder
│   │   │       ├── base.png
│   │   │       ├── happy.png
│   │   │       ├── sad.png
│   │   │       └── angry.png
│   │   ├── cg/                 # CG event illustrations
│   │   ├── ui/                 # UI elements
│   │   └── misc/               # Icons, items, etc.
│   ├── audio/
│   │   ├── bgm/                # Background music
│   │   ├── sfx/                # Sound effects
│   │   └── voice/              # Voice acting clips
│   │       └── [char_name]/
│   ├── gui/                    # GUI image overrides
│   └── tl/                     # Translations
│       └── [lang]/
├── design/                     # Design documents (not in game/)
│   ├── gdd/
│   ├── narrative/
│   ├── characters/
│   └── assets/
└── comfyui/                    # ComfyUI workflows for asset gen
    ├── workflows/
    └── outputs/
```

## Phase 2: Core Configuration

### options.rpy
- Set `config.name`, `config.version`
- Set `gui.text_size`, `gui.name_text_size`
- Configure `config.screen_width` and `config.screen_height` from --resolution
- Set `config.save_directory` to unique identifier
- Enable `config.has_autosave`, `config.autosave_on_choice`
- Set `config.default_language` from --lang
- Configure `build.classify` for distribution

### gui.rpy
- Configure text box position, size, margins
- Set character name box styling
- Configure choice button styling
- Set frame backgrounds and opacity
- Configure quick menu position

### characters.rpy
- Template with `define` statements
- Include `image`, `who_color`, `what_color`, `voice_tag`
- Document layered image syntax:
  ```renpy
  layeredimage character_name:
      group expression:
          attribute neutral default
          attribute happy
          attribute sad
          attribute angry
      group outfit:
          attribute casual default
          attribute formal
  ```

## Phase 3: Starter Script

Generate a minimal `script.rpy` with:
- Label `start`
- Scene transition example
- Character dialogue example
- Menu/choice example
- Variable flag example
- Jump to chapter example

## Phase 4: Build Targets

Configure `options.rpy` build targets:
- Windows (exe)
- macOS (app)
- Linux (tar.bz2)
- Web (HTML5 via progressive download)
- Android (if requested)

## Phase 5: Report

Show summary:
- Project structure created
- Key files and their purpose
- Suggested next steps: `/vn-narrative-design` → `/vn-character-design` → `/vn-comfyui-gen`
