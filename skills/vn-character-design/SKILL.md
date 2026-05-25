---
name: vn-character-design
description: "Design complete visual novel characters: personality, visual spec, expression sheet, sprite layers, relationship system, and AI generation prompts for ComfyUI."
category: "visualnovel"
argument-hint: "[character-name] [--role protagonist|love-interest|support|antagonist]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebSearch, AskUserQuestion
---

When this skill is invoked:

1. **Parse arguments** for character name and role
2. **Load context**:
   - Read `design/narrative/story-outline.md` — character web section
   - Read `design/art/art-bible.md` — visual style guide (if exists)
   - Read existing character profiles in `design/characters/`
   - Read `game/characters.rpy` — existing character definitions

---

## Phase 1: Character Profile

Build the character profile interactively with the user.

### Identity
| Field | Value |
|-------|-------|
| **Full Name** | |
| **Nickname/Alias** | |
| **Age** | |
| **Gender/Pronouns** | |
| **Role** | Protagonist / Love Interest / Support / Antagonist / Mentor |
| **Archetype** | (e.g., Tsundere, Kuudere, Genki, Dandere, Yandere, or custom) |

### Personality
- **Core trait**: The one word that defines them
- **Secondary traits**: 2-3 supporting traits
- **Flaw**: What holds them back
- **Speaking style**: Formal/casual, verbal tics, vocabulary level, speech patterns
- **Inner vs outer**: How they present vs how they truly feel

### Narrative Role
- **Want**: External goal they actively pursue
- **Need**: Internal growth they must achieve
- **Secret**: Hidden information revealed during the story
- **Ghost**: Past event that shaped who they are
- **Arc**: How they change from beginning to end (or don't)
- **Key relationship**: Primary dynamic with protagonist

---

## Phase 2: Visual Specification

### Character Sheet Description

Write a detailed visual description for art generation:

```markdown
## Visual Spec: [Name]

### Base Appearance
- **Height/Build**: [e.g., 165cm, slender]
- **Hair**: [color, length, style, notable features]
- **Eyes**: [color, shape, distinctive features]
- **Skin tone**: [description]
- **Distinguishing features**: [scars, accessories, birthmarks]

### Default Outfit
- **Top**: [description with colors]
- **Bottom**: [description with colors]
- **Footwear**: [description]
- **Accessories**: [jewelry, glasses, etc.]

### Alternate Outfits
1. [Casual/Home] — [description]
2. [Formal/Event] — [description]
3. [Sleepwear] — [description] (if applicable)
4. [Special/Climax] — [description] (route-specific)

### Color Palette
- Primary: #[hex] — [where used]
- Secondary: #[hex] — [where used]
- Accent: #[hex] — [where used]
- Text color (dialogue): #[hex]
- Name color (textbox): #[hex]
```

---

## Phase 3: Expression Sheet

Define all required expressions for the character sprite:

| Expression | Description | Eyebrows | Eyes | Mouth | Use Context |
|-----------|-------------|----------|------|-------|-------------|
| neutral | Default resting face | relaxed | normal | slight curve | Default/narration |
| happy | Genuine smile | raised | bright | open smile | Good news, friendship |
| sad | Downcast, melancholy | furrowed down | half-lidded | frown | Loss, disappointment |
| angry | Frustrated or furious | furrowed in | narrowed | tight | Conflict, argument |
| surprised | Shock or wonder | raised high | wide | open 'o' | Reveals, twists |
| embarrassed | Blushing, flustered | raised | looking away | wobbly | Romance, compliments |
| thinking | Contemplative | one raised | looking up | pursed | Puzzles, decisions |
| smirk | Confident or teasing | one raised | half-lidded | asymmetric | Flirting, scheming |
| crying | Tears, distressed | furrowed | tears | trembling | Emotional scenes |
| determined | Resolute, brave | set | focused | firm line | Climax, confrontation |

For each expression, note if it's required (core 6) or optional (nice-to-have).

---

## Phase 4: Sprite Layer Architecture

Design the layered image system for Ren'Py:

```renpy
layeredimage [character_id]:
    always:
        "chars/[character_id]/base.png"

    group body:
        attribute casual default:
            "chars/[character_id]/outfit_casual.png"
        attribute formal:
            "chars/[character_id]/outfit_formal.png"
        attribute sleepwear:
            "chars/[character_id]/outfit_sleep.png"

    group expression:
        attribute neutral default:
            "chars/[character_id]/face_neutral.png"
        attribute happy:
            "chars/[character_id]/face_happy.png"
        attribute sad:
            "chars/[character_id]/face_sad.png"
        attribute angry:
            "chars/[character_id]/face_angry.png"
        attribute surprised:
            "chars/[character_id]/face_surprised.png"
        attribute embarrassed:
            "chars/[character_id]/face_embarrassed.png"

    group accessory:
        attribute none default:
            Null()
        attribute glasses:
            "chars/[character_id]/acc_glasses.png"
```

### Asset Dimensions
- **Sprite height**: 80% of screen height (default 1080 * 0.8 = 864px)
- **Sprite width**: proportional, typically 400-600px
- **Position presets**: left (0.2), center (0.5), right (0.8)
- **Layer alignment**: all layers must share the same canvas size and anchor point

---

## Phase 5: ComfyUI Generation Prompts

Generate structured prompts for ComfyUI character generation:

### Base Character Prompt
```
[art_style], [character_description], [outfit_description],
[hair_description], [eye_description], [pose],
visual novel character sprite, full body, transparent background,
front-facing, consistent lighting, clean lines
```

### Per-Expression Prompt Template
```
[base_character_prompt], [expression_description],
[expression_specific_details], same character same outfit,
character sheet consistency, visual novel sprite
```

### Negative Prompt (shared)
```
multiple characters, group shot, background scenery,
extra limbs, extra fingers, deformed, blurry, low quality,
inconsistent design, chibi, pixel art (unless art style calls for it)
```

### ComfyUI Workflow Notes
- Use ControlNet for pose consistency across expressions
- Use IP-Adapter for character consistency across outfits
- Recommended: generate base → inpaint expressions on face region
- Resolution: generate at 2x target, downscale for crisp lines

Write all prompts to `design/characters/[character_id]-comfyui-prompts.md`

---

## Phase 6: Ren'Py Character Definition

Generate the `define` statement for `characters.rpy`:

```renpy
define [char_id] = Character(
    "[Full Name]",
    who_color="#[name_hex]",
    what_color="#[dialogue_hex]",
    image="[char_id]",
    voice_tag="[char_id]"
)
```

---

## Phase 7: Output Files

1. `design/characters/[character_id].md` — full character profile
2. `design/characters/[character_id]-visual-spec.md` — visual specification
3. `design/characters/[character_id]-comfyui-prompts.md` — generation prompts
4. Update `game/characters.rpy` with new character definition
5. Update `design/assets/asset-manifest.md` with required sprite assets

Suggest next:
- `/vn-comfyui-gen character:[name]` to generate sprite assets
- `/vn-character-design [next-character]` to design another character
- `/vn-dialogue-tree` to map their story branches
