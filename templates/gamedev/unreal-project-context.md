# Unreal Project Context: [Project Name]

> Lives at `docs/unreal/project-context.md`. Every `ue-*` skill reads this before acting, so
> keeping it accurate is what stops the advice from being generic. Generate or refresh it with
> `/ue-project-context`.

## Document Status
- **Version**: 1.0
- **Last Updated**: [Date]
- **Maintainer**: [Agent/Person]
- **Drafted from**: [codebase scan / interview / both]

## 1. Engine & Project Overview

| Field | Value |
|-------|-------|
| **Project name** | [Name] |
| **One-line description** | [What this is] |
| **Engine version** | [e.g. 5.4.4] |
| **Build kind** | [launcher build / source build] — decides where `.mcp.json` is written |
| **Project type** | [game / simulation / visualization / tool / plugin] |
| **Genre or domain** | [e.g. first-person shooter, architectural viz, training sim] |
| **Target platforms** | [Windows, Mac, Linux, PS5, Xbox, iOS, Android, VR] |

## 2. Module Structure

| Module | Type | Primary? | Public deps | Private deps |
|--------|------|----------|-------------|--------------|
| [Name] | [Runtime / Editor / Developer / ThirdParty] | [yes/no] | [...] | [...] |

- **Modules under active development**: [...]
- **Modules stable or locked**: [...]
- **Standalone plugins or shared libraries**: [...]

## 3. Plugin Dependencies

| Plugin | Source | Critical to gameplay? | Notes |
|--------|--------|-----------------------|-------|
| [e.g. GameplayAbilities] | [engine / Fab / in-house] | [yes/no] | [licence restrictions, version pins] |

Engine plugins to record if enabled: GameplayAbilities, EnhancedInput, CommonUI, Niagara, PCG,
MetaSounds, Chaos, OnlineSubsystem, MassEntity, StateTree, ModelContextProtocol + AllToolsets.

## 4. Coding & Asset Conventions

### Asset naming

- **Pattern**: [`Prefix_BaseAssetName_Variant_Suffix`, or the project's own]
- **Static Mesh prefix**: [`SM_` or `S_` — the two common conventions disagree; pick one]
- **Structs / enums authored in Blueprint**: [`F`/`E` like C++, or `F_`/`E_` to distinguish]
- **Texture packing order**: [e.g. `_RAM` = Roughness/AO/Metallic in RGB]
- **Prefix collisions resolved**: [e.g. `Submix_` vs `SM_`, `GEOC_` vs `GC_`]
- **Top-level content folder**: [`Content/MyProject/`]
- **`Developers/` in use?**: [yes/no]

> Full prefix tables live in `/ue-naming-conventions`. Record here only what this project
> decided or does differently.

### Code conventions

- **Naming prefixes**: [Epic standard `F`/`U`/`A`/`E`/`I`, plus any exceptions]
- **Header guards**: [`#pragma once` / traditional]
- **Log categories**: [`DEFINE_LOG_CATEGORY` names used most]
- **C++ vs Blueprint boundary**: [where the line sits, and who decides]
- **Formatting / linting**: [clang-format config, .editorconfig, enforcement]
- **Anything that deviates from Epic's conventions**: [and why]

> Record what the codebase **actually does**, not what it aspires to. These lines are what the
> `ue-*` skills follow.

## 5. Subsystems in Use

| Subsystem | In use? | How it is used here |
|-----------|---------|---------------------|
| Gameplay Ability System | [yes/no] | [scope: all combat? just abilities?] |
| Enhanced Input | [yes/no] | [mapping context strategy] |
| CommonUI | [yes/no] | [activatable stacks, input routing] |
| Replication / multiplayer | [yes/no] | [server-authoritative? listen server? dedicated?] |
| World Partition / level streaming | [yes/no] | [data layers, streaming sources] |
| Niagara | [yes/no] | [budget expectations] |
| Mass Entity / StateTree | [yes/no] | [what runs at scale] |
| Save system | [yes/no] | [versioning approach] |

## 6. Build Configuration

- **Target types built**: [Game, Editor, Server, Client]
- **Configurations used**: [Development, Shipping, Test, DebugGame]
- **Game Default Map**: [map path — the usual cause of a black packaged build]
- **Packaging**: [maps/directories cooked, compression, full rebuild policy]
- **CI**: [does `RunUAT BuildCookRun` run automatically? where?]
- **Platform SDKs installed**: [...]
- **Performance targets**: [target FPS, frame budget, platform floor]

## 7. Team Context (Optional)

- **Team size and roles**: [...]
- **Source control**: [Perforce / Git + LFS / other]
- **Review expectations**: [what needs a second pair of eyes]
- **Definition of done**: [tests? functional test? packaged build verified?]
- **Known pain points**: [what keeps breaking]

## Open Questions

- [Anything the scan could not determine and nobody has confirmed yet]

> **Rule**: an unanswered item here is an item the `ue-*` skills will have to ask about. Closing
> them is what makes the rest of the workflow fast.
