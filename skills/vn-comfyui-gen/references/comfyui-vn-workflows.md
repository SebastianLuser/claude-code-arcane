# ComfyUI Workflows for Visual Novel Assets

## Overview

This document describes the recommended ComfyUI workflow strategies for
generating visual novel assets with consistency and production quality.

## Prerequisites

### Required Custom Nodes
| Node Pack | Purpose | Install |
|-----------|---------|---------|
| ComfyUI-Manager | Node management | Pre-installed in most setups |
| ComfyUI-Impact-Pack | Face detection, inpainting | `git clone` in custom_nodes/ |
| ComfyUI-IPAdapter-plus | Character consistency | `git clone` in custom_nodes/ |
| comfyui_controlnet_aux | ControlNet preprocessors | `git clone` in custom_nodes/ |
| ComfyUI-LayerDiffuse | Transparent backgrounds | `git clone` in custom_nodes/ |
| ComfyUI-KJNodes | Utility nodes | `git clone` in custom_nodes/ |

### Recommended Models by Style

#### Anime / Classic VN
- **Checkpoint**: Anything V5 / AOM3A3 / Counterfeit V3
- **VAE**: kl-f8-anime2 or built-in
- **LoRA**: flat-color-anime, visual-novel-style
- **ControlNet**: control_v11p_sd15_openpose, control_v11p_sd15_lineart

#### Semi-Realistic
- **Checkpoint**: Juggernaut XL / RealVis XL 4.0
- **VAE**: sdxl_vae
- **LoRA**: detail-enhancer, skin-texture
- **ControlNet**: control_lora_rank128_v11p_sd15_openpose

#### Stylized / Painterly
- **Checkpoint**: DreamShaper XL / Pony Diffusion V6
- **VAE**: sdxl_vae
- **LoRA**: watercolor-style, cel-shading

---

## Workflow 1: Character Sprite (Base)

### Goal
Generate a front-facing character sprite with transparent background.

### Node Flow
```
[Checkpoint Loader] → [CLIP Text Encode (Positive)]
                    → [CLIP Text Encode (Negative)]
                    → [KSampler]
                    → [LayerDiffuse Decode] → [Save Image (PNG)]
                    
[Empty Latent Image (768x1344)] → [KSampler]
[ControlNet (OpenPose)] → [KSampler]  # For pose control
```

### Settings
- **Steps**: 30-40
- **CFG**: 7-9
- **Sampler**: DPM++ 2M Karras
- **Scheduler**: Karras
- **Resolution**: 768x1344 (SD1.5) or 1024x1792 (SDXL)
- **Denoising**: 1.0 (full generation)

### Prompt Template
```
Positive: masterpiece, best quality, [art_style], 1girl/1boy,
[character_description], [outfit_description], [hair], [eyes],
standing, front view, full body, arms at sides, looking at viewer,
simple pose, clean lines, visual novel character sprite

Negative: multiple people, background, scenery, watermark, text,
extra fingers, extra limbs, deformed, blurry, low quality, worst quality,
chibi, partial body, cropped, from behind, from side
```

---

## Workflow 2: Expression Swap (Inpainting)

### Goal
Change facial expression while keeping body identical.

### Node Flow
```
[Load Base Image] → [Create Face Mask (Impact Pack)] 
                  → [Set Latent Noise Mask]
                  → [KSampler (Inpaint)] 
                  → [Composite Original + Inpainted]
                  → [Save Image]

[IP-Adapter (base image as reference)] → [KSampler]
```

### Settings
- **Denoising**: 0.55-0.70 (enough to change expression, not identity)
- **Mask padding**: 30-50px around face
- **Steps**: 25-30
- **CFG**: 6-8 (lower for subtlety)

### Per-Expression Prompt Additions
| Expression | Add to Positive | Add to Negative |
|-----------|----------------|-----------------|
| happy | smiling, bright eyes, open mouth smile | sad, angry, crying |
| sad | downcast eyes, slight frown, melancholy | smiling, happy, laughing |
| angry | furrowed brows, intense eyes, tight mouth | smiling, relaxed, happy |
| surprised | wide eyes, raised eyebrows, open mouth | calm, relaxed, neutral |
| embarrassed | blushing, looking away, shy smile | confident, bold, direct |
| crying | tears, distressed, trembling lips | happy, smiling, calm |

---

## Workflow 3: Background Scene

### Goal
Generate consistent environment backgrounds at game resolution.

### Node Flow
```
[Checkpoint Loader] → [CLIP Text Encode]
                    → [KSampler]
                    → [Upscale (2x)]
                    → [Downscale to target resolution]
                    → [Save Image]
```

### Settings
- **Resolution**: 1920x1080 (or generate at 960x540 and upscale 2x)
- **Steps**: 35-50 (backgrounds benefit from more steps)
- **CFG**: 8-12
- **Denoising**: 1.0

### Time-of-Day Variants
Use img2img with the day version as base:
- **Sunset**: denoising 0.35, add "golden hour, warm lighting, orange sky"
- **Night**: denoising 0.40, add "nighttime, moonlight, dark sky, artificial lighting"
- **Rain**: denoising 0.30, add "rainy, wet surfaces, overcast, puddles"

---

## Workflow 4: CG Event Illustration

### Goal
Generate dramatic event illustrations with known characters.

### Node Flow
```
[Checkpoint Loader] → [CLIP Text Encode]
                    → [KSampler]
                    → [IP-Adapter (character refs)]
                    → [ControlNet (composition pose)]
                    → [Upscale + Detail Enhancement]
                    → [Save Image]
```

### Settings
- **Resolution**: 1920x1080 (landscape event) or 1080x1920 (portrait closeup)
- **Steps**: 40-60 (quality matters for CGs)
- **CFG**: 7-10
- **IP-Adapter weight**: 0.6-0.8 (balance identity vs scene freedom)

---

## Workflow 5: UI Elements

### Goal
Generate themed UI components (textbox, buttons, frames).

### Approach
- Use inpainting or img2img from a base layout
- Generate decorative elements separately and composite
- For semi-transparent elements: generate opaque, then adjust alpha in post

### Common UI Prompts
```
Textbox: ornate frame border, decorative, [style] aesthetic,
semi-transparent, dark background, golden trim, visual novel textbox,
UI element, isolated on black

Button: rounded rectangle, [style] button, normal state,
clean edges, readable text area, UI element

Menu BG: [atmosphere] scene, blurred, bokeh, visual novel menu background,
no characters, atmospheric, cinematic
```

---

## Tips for Consistency

1. **Save seeds**: record the seed for every approved generation
2. **IP-Adapter is key**: always reference the approved base character image
3. **Batch with same settings**: generate all expressions in one session
4. **ControlNet for poses**: use the same pose reference for all characters
5. **Color grading**: apply the same color adjustment to all assets in a batch
6. **Resolution consistency**: always generate at the same base resolution
7. **Style LoRA**: use the same style LoRA at the same weight for all assets
