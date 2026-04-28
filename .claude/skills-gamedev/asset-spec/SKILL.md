---
name: asset-spec
description: "Specs visuales por asset: descripción, AI generation prompts, dimensiones, formato, naming, art bible anchors. Produce archivos de spec y actualiza asset manifest. Usar para: asset spec, visual spec, AI prompt, asset manifest, spec de arte, producción de assets."
argument-hint: "[system:<name>|level:<name>|character:<name>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# asset-spec — Per-Asset Visual Specifications

Genera specs visuales por asset con prompts para AI generation, ancladas al art bible.

## Cuándo usar

- Después de art bible y GDD/level design aprobados, antes de producción
- Para cualquier batch de assets que necesite specs consistentes

## Requisito

Art bible debe existir (`design/art/art-bible.md` o equivalente). Sin art bible → "Correr `/art-bible` primero."

---

## Phase 1: Contexto

Leer antes de preguntar nada:
- **Art bible**: Visual Identity, Color System, Shape Language, Asset Standards (sección 8)
- **Source doc** según target type:
  - `system:` → GDD del sistema (sección Visual/Audio Requirements)
  - `level:` → Level design doc (art requirements, asset list)
  - `character:` → Character profile (visual description, rol)
- **Manifest existente** (`design/assets/asset-manifest.md`) → evitar duplicados
- **Specs existentes** → detectar assets compartidos reutilizables

---

## Phase 2: Identificar assets

Extraer de source doc todo asset mencionado o implícito:

| Categoría | Qué buscar |
|-----------|-----------|
| **Sprite / 2D** | Character sprites, UI icons, tile sheets |
| **VFX / Particles** | Hit effects, ambient particles, screen effects |
| **Environment** | Props, tiles, backgrounds, skyboxes |
| **UI** | HUD elements, menu art, fonts custom |
| **Audio** | SFX, music, ambient (descripción only, no generation prompt) |
| **3D** | Meshes, materials (si aplica) |

Presentar lista agrupada al usuario. **No avanzar sin confirmación** de la lista.

### Assets compartidos

Antes de specear, verificar si ya existe spec para un asset equivalente en otro contexto (ej: hit spark genérico ya speceado para Combat). Si existe → referenciar el ASSET-ID existente en lugar de duplicar.

---

## Phase 3: Generar specs

Para cada asset, producir:

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

Para audio: descripción del carácter sónico en lugar de generation prompt.

### Asset IDs

Secuenciales a nivel proyecto (no por contexto). Leer manifest para encontrar el último ID asignado. Si no hay manifest → empezar en ASSET-001.

---

## Phase 4: Escribir

Después de aprobación:
1. Spec file → `design/assets/specs/[target-name]-assets.md`
2. Actualizar/crear `design/assets/asset-manifest.md` con tabla de progress (Total/Needed/In Progress/Done)

---

## Anti-patterns

- Specs sin anclar al art bible — inconsistencia visual garantizada
- Duplicar assets que ya tienen spec en otro contexto
- Generation prompts genéricos ("a sword") sin style keywords ni color anchors
- Visual descriptions vagas ("looks cool") en lugar de específicas ("angular silhouette, Threat Blue glow, 3-frame pulse animation")
- Dimensiones inventadas que no matchean los tiers del Art Bible §8

---

## Checklist

```markdown
- [ ] Art bible leído, §8 Asset Standards identificados
- [ ] Source doc leído, assets explícitos e implícitos extraídos
- [ ] Lista de assets confirmada por usuario
- [ ] Assets compartidos detectados (no duplicar)
- [ ] Cada spec con: dimensions, format, naming, visual description, art bible anchors
- [ ] Generation prompts con style keywords y negative prompts
- [ ] Asset IDs secuenciales, manifest actualizado
```
