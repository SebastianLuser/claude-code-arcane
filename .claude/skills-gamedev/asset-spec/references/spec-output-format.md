# Asset Spec Output Format

For each asset, produce:

```markdown
## ASSET-[NNN] — [Nombre]

| Campo | Valor |
|-------|-------|
| Category | [Sprite / VFX / Environment / UI / Audio / 3D] |
| Dimensions | [ej: 256x256px, 4-frame sprite sheet] |
| Format | [PNG / SVG / WAV / etc.] |
| Naming | [ej: vfx_frost_hit_01.png] |
| Polycount | [si 3D — ej: <800 tris] |
| Texture Res | [ej: 512px — Art Bible §8 Tier 2] |

**Visual Description:**
[2-3 oraciones. Suficientemente específico para que dos artistas produzcan resultados consistentes.]

**Art Bible Anchors:**
- §3 Shape Language: [regla aplicada]
- §4 Color System: [rol del color — ej: "Threat Blue per semantic rules"]

**Generation Prompt:**
[Prompt ready-to-use para AI (Midjourney/SD style). Incluir: style keywords, composición, paleta, lighting, negative prompts.]

**Status:** Needed
```

For audio: descripción del carácter sónico en lugar de generation prompt.

## Asset IDs

Secuenciales a nivel proyecto (no por contexto). Leer manifest para encontrar el último ID asignado. Si no hay manifest → empezar en ASSET-001.
