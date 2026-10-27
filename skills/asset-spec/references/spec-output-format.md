# Asset Spec Output Format

For each asset, produce:

```markdown
## ASSET-[NNN] — [Name]

| Field | Value |
|-------|-------|
| Category | [Sprite / VFX / Environment / UI / Audio / 3D] |
| Dimensions | [e.g.: 256x256px, 4-frame sprite sheet] |
| Format | [PNG / SVG / WAV / etc.] |
| Naming | [e.g.: vfx_frost_hit_01.png] |
| Polycount | [if 3D — e.g.: <800 tris] |
| Texture Res | [e.g.: 512px — Art Bible §8 Tier 2] |

**Visual Description:**
[2-3 sentences. Specific enough that two artists produce consistent results.]

**Art Bible Anchors:**
- §3 Shape Language: [rule applied]
- §4 Color System: [color role — e.g.: "Threat Blue per semantic rules"]

**Generation Prompt:**
[Ready-to-use AI prompt (Midjourney/SD style). Include: style keywords, composition, palette, lighting, negative prompts.]

**Status:** Needed
```

For audio: a description of the sonic character instead of a generation prompt.

## Asset IDs

Sequential at project level (not per context). Read the manifest to find the last assigned ID. If there is no manifest → start at ASSET-001.
