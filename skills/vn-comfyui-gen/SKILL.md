---
name: vn-comfyui-gen
description: "Generate visual novel assets using ComfyUI: character sprites, backgrounds, CG illustrations, and UI elements. Manages workflows, consistency, and batch generation."
category: "visualnovel"
argument-hint: "[character:<name> | bg:<name> | cg:<name> | ui] [--batch] [--style <style>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, WebSearch, AskUserQuestion
---

When this skill is invoked:

1. **Parse target type**: character sprites, backgrounds, CG illustrations, or UI elements
2. **Load context**:
   - Read `design/art/art-bible.md` — visual style guide
   - Read target spec file from `design/characters/` or `design/assets/`
   - Read `comfyui/workflows/` for existing workflow configs
   - Check ComfyUI is running: `curl http://127.0.0.1:8188/system_stats`

---

## Phase 0: ComfyUI Environment Check

Verify ComfyUI setup:
- ComfyUI server accessible at `http://127.0.0.1:8188` (or custom port)
- Required custom nodes installed:
  - ComfyUI-Manager
  - ComfyUI-Impact-Pack (for face detection/inpainting)
  - ComfyUI-IPAdapter (for character consistency)
  - ComfyUI-ControlNet (for pose control)
  - ComfyUI-LayerDiffuse (for transparent backgrounds)

If missing nodes, provide installation commands:
```bash
cd ComfyUI/custom_nodes
git clone [repo-url]
```

### Required Models (recommend to user)
- **Base model**: Anything V5 / Pony Diffusion V6 XL / NovelAI (for anime style)
  or Juggernaut XL / RealVis XL (for semi-realistic)
- **ControlNet**: control_v11p_sd15_openpose (pose), control_v11p_sd15_lineart (line)
- **IP-Adapter**: ip-adapter-plus_sd15 or ip-adapter-plus_sdxl
- **LayerDiffuse**: layer_diffuse_sd15 (for transparent bg sprites)
- **LoRAs**: style-specific (recommended: flat-color-anime, visual-novel-style)

---

## Phase 1: Character Sprite Generation

### Workflow: `comfyui/workflows/character-sprite.json`

**Strategy: Base + Expression Inpainting**

1. **Generate base character** (neutral expression, default outfit):
   - Load character prompt from `design/characters/[name]-comfyui-prompts.md`
   - Use LayerDiffuse for transparent background
   - Generate at 2x resolution (e.g., 1200x2160 for 600x1080 final)
   - Apply ControlNet with reference pose (front-facing, arms at sides)

2. **Expression variants** (inpaint face region only):
   - Use the approved base as img2img reference
   - Mask face region (forehead to chin, ear to ear)
   - For each expression in the expression sheet:
     - Modify prompt to add expression-specific terms
     - Inpaint at high denoising (0.6-0.75) for expression change
     - Keep rest of body identical
   - IP-Adapter with base image for consistency

3. **Outfit variants** (inpaint body, keep face):
   - Use approved base face as reference
   - Mask body region (neck down)
   - For each outfit in the character spec:
     - Modify prompt for outfit description
     - Inpaint body at high denoising (0.7-0.85)

4. **Post-processing**:
   - Upscale with 4x-UltraSharp or SwinIR
   - Remove background artifacts (LayerDiffuse cleanup)
   - Crop to consistent canvas size
   - Export as PNG with transparency

### Output Structure:
```
game/images/chars/[character_id]/
├── base.png              # Full body, neutral, default outfit
├── face_neutral.png      # Face layer — neutral
├── face_happy.png        # Face layer — happy
├── face_sad.png          # Face layer — sad
├── face_angry.png        # Face layer — angry
├── face_surprised.png    # Face layer — surprised
├── face_embarrassed.png  # Face layer — embarrassed
├── outfit_casual.png     # Body layer — casual
├── outfit_formal.png     # Body layer — formal
└── outfit_sleep.png      # Body layer — sleepwear
```

---

## Phase 2: Background Generation

### Workflow: `comfyui/workflows/background.json`

For each background listed in the story outline:

1. **Prompt structure**:
   ```
   [art_style] background, [location_description],
   [time_of_day], [mood/atmosphere], [lighting],
   visual novel background, no characters, wide shot,
   [resolution] aspect ratio
   ```

2. **Time variants**: generate day/sunset/night versions of key locations
   - Same seed + adjusted prompt for lighting/color shift
   - Or use img2img with low denoising (0.3-0.4) for consistency

3. **Resolution**: match game resolution (1920x1080 default)

### Output Structure:
```
game/images/bg/
├── school_classroom_day.png
├── school_classroom_sunset.png
├── school_classroom_night.png
├── school_rooftop_day.png
├── park_cherry_blossoms.png
├── protagonist_room_night.png
└── cafe_interior.png
```

---

## Phase 3: CG Illustration Generation

### Workflow: `comfyui/workflows/cg-event.json`

For each CG event in the story outline:

1. **Prompt structure**:
   ```
   [art_style], [scene_description], [characters_involved],
   [character_descriptions], [poses_and_interaction],
   [emotional_tone], [lighting_and_atmosphere],
   CG illustration, key visual, high detail,
   visual novel event CG, [aspect_ratio]
   ```

2. **Character consistency**: use IP-Adapter with approved character base images
3. **Composition**: reference composition guides (rule of thirds, golden ratio)
4. **Resolution**: 1920x1080 (landscape) or 1080x1920 (portrait) depending on scene

### Output:
```
game/images/cg/
├── cg_001_first_meeting.png
├── cg_002_confession_scene.png
├── cg_003_festival_night.png
└── cg_004_ending_embrace.png
```

---

## Phase 4: UI Element Generation

### Workflow: `comfyui/workflows/ui-elements.json`

Generate custom UI assets:
- **Textbox background**: semi-transparent, matches art style
- **Name plate**: character name display background
- **Choice button**: normal, hover, selected states
- **Menu backgrounds**: title screen, save/load, settings, gallery
- **Frame decorations**: borders, corners, dividers

Use img2img with design mockups or generate from style description.

---

## Phase 5: Batch Generation Mode (--batch)

When `--batch` is specified:
1. Read entire asset manifest from `design/assets/asset-manifest.md`
2. Filter for assets with status "Needed" or "Spec Ready"
3. Queue all generation prompts
4. Generate using ComfyUI API batch endpoint
5. Save outputs to correct directories
6. Update manifest status to "Generated — Pending Review"

### ComfyUI API Integration
```python
import json
import urllib.request

def queue_prompt(workflow, server="127.0.0.1:8188"):
    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"http://{server}/prompt", data=data)
    return json.loads(urllib.request.urlopen(req).read())
```

---

## Phase 6: Quality Review

After generation, for each asset:
- Show the generated image path for user review
- Ask: "Approve / Regenerate with tweaks / Reject and re-spec"
- If tweaking: adjust prompt and re-queue
- If approved: update asset manifest status to "Approved"

### Consistency Checks
- All character sprites use the same canvas dimensions
- All expressions maintain the same face position/size
- All backgrounds use the same resolution
- Color palette matches art bible
- Style consistency across all assets

---

## Phase 7: Workflow Export

Save all ComfyUI workflows as reusable JSON:
- `comfyui/workflows/character-sprite.json`
- `comfyui/workflows/background.json`
- `comfyui/workflows/cg-event.json`
- `comfyui/workflows/ui-elements.json`

Each workflow includes:
- Node graph configuration
- Default prompt templates
- Recommended settings (steps, CFG, sampler, scheduler)
- Model/LoRA recommendations

Suggest next:
- `/vn-asset-pipeline` for full pipeline management
- `/vn-ui-design` to design the UI using generated elements
- `/vn-scene-compose` to compose scenes with the approved assets
