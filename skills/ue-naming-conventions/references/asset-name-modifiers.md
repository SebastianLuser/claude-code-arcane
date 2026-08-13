# Asset Name Modifiers

> Adapted from the [Gamemakin UE Style Guide](https://github.com/Allar/ue5-style-guide) (MIT, Gamemakin LLC). The upstream guide is UE4-era — its `main` branch still says so and the `v2` branch is an unfinished draft last touched in 2023. The durable naming and structure conventions are reproduced here; the UE5 section below covers asset types the guide predates, and deprecated entries are marked rather than silently carried forward.

Combine with the base name: `Prefix_BaseAssetName_Variant_Suffix`.

## Most Common

| Asset Type | Prefix | Suffix | Notes |
|---|---|---|---|
| Level / Map | | | Belongs under `Maps/` |
| Level (Persistent) | | `_P` | |
| Level (Audio) | | `_Audio` | |
| Level (Lighting) | | `_Lighting` | |
| Level (Geometry) | | `_Geo` | |
| Level (Gameplay) | | `_Gameplay` | |
| Blueprint | `BP_` | | |
| Material | `M_` | | |
| Static Mesh | `SM_` | | Upstream uses `S_`; `SM_` matches Epic's own tooling. Pick one per project. |
| Skeletal Mesh | `SK_` | | |
| Texture | `T_` | `_?` | See Textures below |
| Widget Blueprint | `WBP_` | | |

## Blueprints

| Asset Type | Prefix | Suffix | Notes |
|---|---|---|---|
| Blueprint | `BP_` | | |
| Blueprint Component | `BP_` | `Component` | e.g. `BP_InventoryComponent` |
| Blueprint Function Library | `BPFL_` | | |
| Blueprint Interface | `BPI_` | | |
| Blueprint Macro Library | `BPML_` | | Avoid macro libraries where possible |
| Enumeration | `E` | | No underscore, matching C++ |
| Structure | `F` or `S` | | No underscore. Some teams prefer `F_`/`E_` for BP-authored types — pick one |
| Widget Blueprint | `WBP_` | | |

## Animation

| Asset Type | Prefix | Suffix | Notes |
|---|---|---|---|
| Animation Blueprint | `ABP_` | | |
| Animation Sequence | `A_` | | |
| Animation Montage | `AM_` | | |
| Animation Composite | `AC_` | | |
| Aim Offset (1D or 2D) | `AO_` | | |
| Blend Space (1D or 2D) | `BS_` | | |
| Level Sequence | `LS_` | | |
| Morph Target | `MT_` | | |
| Skeleton | `SKEL_` | | |
| Control Rig | `CR_` | | UE5 |
| IK Rig | `IK_` | | UE5 |
| IK Retargeter | `RTG_` | | UE5 |
| Pose Asset | `Pose_` | | |
| Rig | `Rig_` | | Legacy; prefer Control Rig |

## Artificial Intelligence

| Asset Type | Prefix | Suffix | Notes |
|---|---|---|---|
| AI Controller | `AIC_` | | |
| Behavior Tree | `BT_` | | |
| Blackboard | `BB_` | | |
| BT Decorator | `BTDecorator_` | | |
| BT Service | `BTService_` | | |
| BT Task | `BTTask_` | | |
| Environment Query | `EQS_` | | |
| EnvQueryContext | `EQS_` | `Context` | |
| State Tree | `ST_` | | UE5 |

## Materials

| Asset Type | Prefix | Suffix | Notes |
|---|---|---|---|
| Material | `M_` | | Only inside `MaterialLibrary/` if you enforce instances-only |
| Material Instance | `MI_` | | |
| Material Function | `MF_` | | |
| Material Parameter Collection | `MPC_` | | |
| Material (Post Process) | `PP_` | | |
| Subsurface Profile | `SP_` | | |
| Physical Material | `PM_` | | |
| Decal | `M_`, `MI_` | `_Decal` | |
| Material Layer | `ML_` | | UE5 |
| Material Layer Blend | `MLB_` | | UE5 |

## Textures

| Asset Type | Prefix | Suffix |
|---|---|---|
| Texture | `T_` | |
| Diffuse / Albedo / Base Color | `T_` | `_D` |
| Normal | `T_` | `_N` |
| Roughness | `T_` | `_R` |
| Metallic | `T_` | `_M` |
| Specular | `T_` | `_S` |
| Alpha / Opacity | `T_` | `_A` |
| Ambient Occlusion | `T_` | `_O` |
| Bump | `T_` | `_B` |
| Emissive | `T_` | `_E` |
| Mask | `T_` | `_M` |
| Packed | `T_` | `_*` |
| Texture Cube | `TC_` | |
| Media Texture | `MT_` | |
| Render Target | `RT_` | |
| Cube Render Target | `RTC_` | |
| Texture Light Profile | `TLP` | |

**Packing.** When channels are packed into one texture, the suffix lists the packed channels in RGBA order — a texture with roughness in R, ambient occlusion in G and metallic in B is `T_Rock_RAM`. Pack only channels a shader reads together, and record the packing order in the project context so nobody has to reverse-engineer it from a material graph.

## Effects

| Asset Type | Prefix | Suffix | Notes |
|---|---|---|---|
| Niagara System | `NS_` | | UE5 default VFX |
| Niagara Emitter | `NE_` | | |
| Niagara Function | `NF_` | | |
| Niagara Module | `NM_` | | |
| Niagara Parameter Collection | `NPC_` | | |
| Material (Post Process) | `PP_` | | |
| ~~Particle System (Cascade)~~ | ~~`PS_`~~ | | **Deprecated** — Cascade is legacy, use Niagara |

Niagara asset names must contain no spaces at all: some Niagara code paths mishandle them.

## Sounds

| Asset Type | Prefix | Suffix | Notes |
|---|---|---|---|
| Sound Wave | `A_` | | |
| Sound Cue | `A_` | `_Cue` | |
| Sound Attenuation | `ATT_` | | |
| Sound Concurrency | | `_SC` | Named after its Sound Class |
| Sound Class | | | No affix; put in a `SoundClasses` folder |
| Sound Mix | `Mix_` | | |
| Reverb Effect | `Reverb_` | | |
| Dialogue Voice | `DV_` | | |
| Dialogue Wave | `DW_` | | |
| MetaSound Source | `MSS_` | | UE5 |
| MetaSound Patch | `MSP_` | | UE5 |
| Submix | `SM_`, `Submix_` | | UE5 — `Submix_` avoids colliding with Static Mesh |

## User Interface

| Asset Type | Prefix | Suffix | Notes |
|---|---|---|---|
| Widget Blueprint | `WBP_` | | |
| Slate Widget Style | `Style_` | | |
| Font | `Font_` | | |
| Common UI Input Action Data | `IAD_` | | UE5 |

## Input (UE5 Enhanced Input)

| Asset Type | Prefix | Notes |
|---|---|---|
| Input Action | `IA_` | |
| Input Mapping Context | `IMC_` | |
| Input Modifier | `IM_` | |
| Input Trigger | `IT_` | |
| Player Mappable Input Config | `PMI_` | |

## Gameplay Ability System (UE5)

| Asset Type | Prefix | Notes |
|---|---|---|
| Gameplay Ability | `GA_` | |
| Gameplay Effect | `GE_` | |
| Gameplay Cue | `GC_` | Notify actors/statics under a `GameplayCues` folder |
| Ability Task | `AT_` | Usually C++ |

## Data

| Asset Type | Prefix | Suffix | Notes |
|---|---|---|---|
| Data Asset | `DA_` | | Upstream says "prefix based on class"; `DA_` is the common modern default |
| Primary Data Asset | `PDA_` | | |
| Data Table | `DT_` | | |
| Curve Table | `Curve_` | `_Table` | |
| Float Curve | `Curve_` | `_Float` | |
| Vector Curve | `Curve_` | `_Vector` | |
| Color Curve | `Curve_` | `_Color` | |
| Composite Data Table | `CDT_` | | UE5 |

## World & Streaming (UE5)

| Asset Type | Prefix | Notes |
|---|---|---|
| Level Instance | `LI_` | |
| Packed Level Actor | `PLA_` | |
| Data Layer Asset | `DL_` | |
| World Partition Builder settings | | Config, not an asset |
| PCG Graph | `PCG_` | |
| PCG Settings | `PCGS_` | |
| Landscape Grass Type | `LG_` | |
| Landscape Layer | `LL_` | |
| Foliage Type | `FT_` | |

## Physics

| Asset Type | Prefix | Notes |
|---|---|---|
| Physical Material | `PM_` | |
| Physics Asset | `PHYS_` | |
| Chaos Cache Collection | `CCC_` | UE5 |
| Geometry Collection | `GC_` | UE5 — collides with Gameplay Cue; prefer `GEOC_` if both are used |
| ~~Destructible Mesh~~ | ~~`DM_`~~ | **Deprecated** — replaced by Chaos Geometry Collections |

## Paper 2D

| Asset Type | Prefix |
|---|---|
| Paper Flipbook | `PFB_` |
| Sprite | `SPR_` |
| Sprite Atlas Group | `SPRG_` |
| Tile Map | `TM_` |
| Tile Set | `TS_` |

## Miscellaneous

| Asset Type | Prefix | Suffix | Notes |
|---|---|---|---|
| Media Player | `MP_` | | |
| File Media Source | `FMS_` | | |
| Force Feedback Effect | `FFE_` | | |
| Touch Interface Setup | `TI_` | | |
| Object Library | `OL_` | | |
| Sprite Sheet | `SS_` | | |
| Static Vector Field | `VF_` | | |
| Animated Vector Field | `VFA_` | | |
| Camera Anim | `CA_` | | Legacy; prefer Sequencer |
| Redirector | | | Not authored — fix these up promptly |
| ~~Matinee Data~~ | ~~`Matinee_`~~ | | **Removed in UE5** — use Sequencer / `LS_` |

## Prefix Collisions To Watch

`SM_` (Static Mesh vs Submix), `MT_` (Morph Target vs Media Texture), `PM_` (Physical Material — also used for Physics Material), `GC_` (Gameplay Cue vs Geometry Collection), `M_` (Material vs Montage in some houses). Where two apply in one project, disambiguate one of them and record the decision in `docs/unreal/project-context.md`.
