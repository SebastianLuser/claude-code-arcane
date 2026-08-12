---
name: ue-naming-conventions
description: "Asset naming y estructura de Content — Prefix_BaseAssetName_Variant_Suffix, prefijos por tipo de asset, layout de carpetas, identifiers seguros"
category: "gamedev"
argument-hint: "[asset, folder o review]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# UE Naming Conventions & Content Structure

Names and folder layout are the cheapest consistency win in an Unreal project and the most expensive thing to fix later — renaming assets breaks references, and redirectors accumulate. Settle the convention once, record it in the project context, then hold the line.

Ask before writing: this skill renames assets and moves folders, which rewrites references across the project. Never rename in bulk without approval, a clean source-control state, and a Fix Up Redirectors pass afterwards.

## Context Check

Read `docs/unreal/project-context.md` before proposing anything. Confirm:

- **Whether the project already has a naming convention.** If it does, that convention wins — even where it disagrees with this skill. Consistency beats correctness here.
- The top-level content folder name and whether `Developers/` is in use
- Source control system, because a rename is a source-control operation before it is an editor one

## The Prime Directive

> An existing convention beats a better one. All structure, assets and code in the project should look like a single person created it, no matter how many people contributed.

If the project has no convention yet, propose the one below, get it agreed, and write it into `docs/unreal/project-context.md` so every other `ue-*` skill follows it.

## Base Asset Name

Every asset follows `Prefix_BaseAssetName_Variant_Suffix`:

- **`Prefix`/`Suffix`** — determined by asset type. See the reference table.
- **`BaseAssetName`** — a short, recognizable name for the logical group. Every asset belonging to the character Bob uses `Bob`.
- **`Variant`** — either a recognizable name (`Bob_Evil`, `Bob_Retro`) or a two-digit number starting at `01` for generic variations (`Rock_01`, `Rock_02`). Three digits means you should have split the base name instead. Variants can chain: `Flooring_Marble_01`.

```
SK_Bob            Skeletal mesh
M_Bob             Material
T_Bob_D           Diffuse texture
T_Bob_N           Normal texture
T_Bob_Evil_D      Diffuse for the Evil variant
MI_Rock_Snow      Material instance variant
```

## Identifier Charset

In **any** identifier — asset, folder, C++ symbol, path — restrict to `[A-Za-z0-9_]` and use `_` sparingly. Never use:

- Whitespace of any kind
- Backslashes, or symbols like `#!@$%`
- Any Unicode character

A character named `Zoë` gets a folder named `Zoe`. This is not pedantry: spaces and Unicode break batch tools, cooking, and source control in ways that surface as unexplained failures far from the cause. The same applies to the project's own path on disk — prefer `D:\Project` over a `My Documents` subfolder.

## Content Directory Structure

- **One top-level folder named after the project.** All project content lives in `Content/MyProject/`, never loose in `Content/`. This is what makes the project safely mergeable with marketplace and plugin content.
- **`PascalCase` folder names, no spaces, no Unicode.**
- **`Maps/`** — every level lives under `Content/MyProject/Maps`, subfolders welcome. Keeps cooking, lighting and QA scripts sane, and means "open this map" needs no directions.
- **`Core/`** — the fundamental classes: base GameMode, GameState, PlayerController, PlayerState, Character. A visible "don't touch" boundary. Designers tweak child classes elsewhere.
- **`MaterialLibrary/`** — master materials, layered materials, material functions and shared utility textures. Makes a "material instances only" policy enforceable: any plain material outside this folder is a violation you can grep for. Put debug materials in `MaterialLibrary/Debug` so they are trivial to strip and obvious if referenced.
- **`Developers/`** — per-person sandbox, hidden in the Content Browser by default. Work here cannot be accidentally depended on. Promote an asset by moving it into the project folder and fixing up redirectors.
- **No folders named `Assets` or `AssetTypes`** — everything is an asset, and grouping by type instead of purpose fights the Content Browser's own filters.
- **No empty folders.** They clutter the browser and usually mean a redirector was never fixed up.

> → Read references/content-structure.md for the example project layout, the very-large-asset-set exception, and the safe procedure for deleting a stubborn empty folder

## Asset Prefixes

> → Read references/asset-name-modifiers.md for the full prefix/suffix tables by asset type, including the UE5 types the original guide predates and the texture packing suffixes

The ones worth memorizing:

| Type | Prefix | Type | Prefix |
|------|--------|------|--------|
| Blueprint | `BP_` | Widget Blueprint | `WBP_` |
| Blueprint Interface | `BPI_` | Animation Blueprint | `ABP_` |
| Material | `M_` | Material Instance | `MI_` |
| Static Mesh | `SM_` | Skeletal Mesh | `SK_` |
| Texture | `T_` | Niagara System | `NS_` |
| Data Asset | `DA_` | Data Table | `DT_` |
| Input Action | `IA_` | Input Mapping Context | `IMC_` |
| Behavior Tree | `BT_` | Blackboard | `BB_` |

## Two Conflicts To Resolve Explicitly

**Static Mesh: `SM_` or `S_`?** The Gamemakin guide specifies `S_` and notes that many teams use `SM_`. Epic's own tooling — including the asset prefixes its MCP server keys off — assumes `SM_`. This skill defaults to **`SM_`** for that reason. If the project already uses `S_`, keep `S_` and record it in the project context.

**Structs and enums.** The guide uses `F`/`S` for structs and `E` for enums with no underscore, matching C++. For Blueprint-authored types many teams prefer `F_`/`E_` to keep them visually distinct from C++ types. Either is fine; pick one and record it.

## Common Mistakes

- **Renaming assets without a redirector pass**, leaving dangling references that only surface at cook time
- **Bulk renames without source control clean**, making the change impossible to revert cleanly
- **Content loose in `Content/`** rather than under a project folder, which collides with plugin and marketplace content
- **Grouping by asset type** (`Content/Meshes`, `Content/Textures`) instead of by feature — the Content Browser already filters by type
- **Spaces or Unicode** in a name, a folder, or the project path
- **Plain materials outside `MaterialLibrary/`**, quietly defeating a material-instance policy
- **Levels scattered outside `Maps/`**, making cook and lighting scripts fragile
- **Treating a UE4-era prefix list as current** — Cascade `PS_` is Niagara `NS_`/`NE_` now, Matinee is Sequencer, Destructible Mesh is Chaos

---

## Related Skills

- `/ue-project-context` — the document that records which convention this project actually uses
- `/ue-data-assets-tables` — `DA_`/`DT_` assets and the Asset Manager paths that depend on stable names
- `/ue-materials-rendering` — the `MaterialLibrary/` policy and `M_`/`MI_` split
- `/ue-blueprints` — Blueprint variable and function naming inside the graph
- `/ue-world-level-streaming` — `Maps/` layout, persistent level `_P` suffix, data layers
- `/asset-audit` — cross-engine audit for naming, size, format and orphaned assets

## Reference Files

- `references/asset-name-modifiers.md` — full prefix/suffix tables by asset type, plus UE5 additions and texture packing
- `references/content-structure.md` — example project layout, folder rules in depth, empty-folder removal procedure

---

## Checklist

Validate before considering the work done:

- [ ] The project's existing convention was checked first and takes precedence
- [ ] Every new asset follows `Prefix_BaseAssetName_Variant_Suffix` with the right prefix for its type
- [ ] No identifier, folder or path contains spaces, Unicode or symbols outside `[A-Za-z0-9_]`
- [ ] Project content sits under a single top-level project folder, with levels under `Maps/`
- [ ] Any rename ran with clean source control and a Fix Up Redirectors pass afterwards
- [ ] The agreed convention is written into `docs/unreal/project-context.md`
- [ ] Conventions in `docs/unreal/project-context.md` were read and followed
- [ ] The Common Mistakes section of this skill was reviewed against the change

**PASS** — every item holds. **CONCERNS** — the work stands but at least one item is unresolved and worth flagging to the user. **FAIL** — an item is violated in a way that breaks asset references or leaves the project inconsistent; fix it before handing the work over.

## Next Steps

- `/ue-project-context` — record the convention so the rest of the `ue-*` skills follow it
- `/asset-audit` — sweep the existing project for violations
- `/code-review` — architectural and quality review of the change
- `/commit` — conventional commit once the change is verified
