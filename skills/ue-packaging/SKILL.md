---
name: ue-packaging
description: "Packaging and cooking — build configurations, cook vs package, Game Default Map, RunUAT BuildCookRun, platform SDKs"
category: "gamedev"
argument-hint: "[platform o build config]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# UE Packaging & Cooking

Turn a UE5 project into a runnable, distributable build: choose the right build configuration, cook content, set the launch map, and package — from the editor or the command line.

Ask before writing: this skill edits `Config/Default*.ini`, packaging settings and CI build scripts. Propose the change and get approval before using Write or Edit.

## Context Check

Read `docs/unreal/project-context.md` before proceeding. Confirm:

- Engine version and whether the project is Blueprint-only (`DebugGame` is unavailable there)
- Target platforms and which platform SDKs are actually installed
- Whether builds run locally, on CI, or both — this decides editor flow vs `RunUAT`

## When to Use

- Producing a build (test or release), choosing Development vs Shipping, cooking content, configuring Packaging / Maps & Modes settings, or automating builds with `RunUAT BuildCookRun` for CI.
- The goal is a packaged player rather than running in-editor.

**When not to use:** storefront submission and release process → `/release-checklist`. Editor-time gameplay iteration is not packaging.

## Core Workflow

1. **Set the launch map.** Project Settings → **Maps & Modes** → **Game Default Map** is what a packaged build loads first. Wrong or empty here is the most common "packaged game is black" cause.
2. **Pick the build configuration.** **Development** (default; optimized but keeps logging/stats/console for testing) vs **Shipping** (all optimizations, debugging tools stripped — for release). `DebugGame`/`Debug` are for debugging engine/game code and aren't for distribution; `DebugGame` isn't available for Blueprint-only projects.
3. **Understand cook vs package.** **Cooking** converts assets to the target platform's format and packs them into `.pak` files. **Packaging** bundles the compiled executable plus cooked content into a standalone, distributable set of files. Packaging runs a cook as part of it.
4. **Package from the editor:** the **Platforms** menu → choose the platform → set the Binary Configuration → **Package Project** → pick an output folder.
5. **Or build from the command line** with the Unreal Automation Tool (`RunUAT BuildCookRun`) for repeatable and CI builds.
6. **Tune Packaging settings** (Project Settings → **Packaging**): which maps and directories to cook, full-rebuild, compression, and whether to build all maps.
7. **Verify by running the packaged build**, not just by a successful cook — launch the executable and confirm it loads the right map and runs.

## Patterns

### 1. Editor packaging (the menu path)

```text
Platforms (toolbar)
  -> Windows
     -> Binary Configuration -> Development | Shipping
     -> Content Management -> Package Project
  -> choose/confirm the staging output folder
```

### 2. Command-line build with UAT (CI-friendly)

```bash
# Cook + build + stage + pak + archive a Shipping Windows build.
RunUAT BuildCookRun \
  -project="C:/Path/MyGame.uproject" \
  -noP4 -platform=Win64 -clientconfig=Shipping \
  -cook -allmaps -build -stage -pak -archive \
  -archivedirectory="C:/Builds/MyGame"
```

`RunUAT` lives in `Engine/Build/BatchFiles/` (`RunUAT.bat` on Windows, `RunUAT.sh` on macOS/Linux). Drop `-allmaps` and pass `-map=Map1+Map2` to cook a subset.

### 3. Cook only (no packaging), e.g. to refresh content

```bash
RunUAT BuildCookRun -project="C:/Path/MyGame.uproject" -noP4 \
  -platform=Win64 -clientconfig=Development -cook -skipstage
```

## Common Mistakes

- **Packaged build loads a black or empty level** — Game Default Map isn't set, or that map wasn't cooked. Set it in Maps & Modes and ensure it's included in the cook.
- **Shipping a Development build** — Development keeps logging/console/stats and is slower; ship **Shipping**. Conversely, Shipping strips `UE_LOG` and the console, so debugging a Shipping-only issue needs Development or `Test`.
- **A referenced map or asset is missing at runtime** — it wasn't cooked. Add it to the Packaging settings' maps/directories to cook, or cook all maps.
- **Build fails on the platform** — the platform SDK or toolchain isn't installed (Windows build tools, Android SDK/NDK, console SDKs). Install the platform's prerequisites.
- **Expecting Blueprint Nativization** — it was **removed in UE5**. Don't rely on it for performance; profile and move hot logic to C++ instead.
- **First cook is very slow** — shaders and all assets cook from scratch, and subsequent cooks are incremental. Don't mistake a slow first cook for a hang.
- **Cooking secrets into the build** — config files staged into a packaged build are readable. Keep credentials out of `Config/`.

## Reference Files

Primary docs: [Packaging Your Project](https://dev.epicgames.com/documentation/en-us/unreal-engine/packaging-your-project), plus the Build Configurations and `BuildCookRun` references.

---

## Related Skills

- `/ue-module-build-system` — `Build.cs`/`Target.cs` and module wiring that packaging depends on
- `/ue-cpp-foundations` — moving hot logic to C++ now that BP nativization is gone
- `/ue-data-assets-tables` — Asset Manager and Primary Asset types that drive what gets cooked
- `/ue-testing-debugging` — automation tests that should gate a release build

---

## Checklist

Validate before considering the work done:

- [ ] Game Default Map is set and included in the cook
- [ ] Build configuration matches the intent (Shipping for release, Development for testing)
- [ ] The packaged executable was launched and verified, not just cooked successfully
- [ ] No credentials or internal config were staged into the build
- [ ] Conventions in `docs/unreal/project-context.md` were read and followed
- [ ] The Common Mistakes section of this skill was reviewed against the change

**PASS** — every item holds. **CONCERNS** — the work stands but at least one item is unresolved and worth flagging to the user. **FAIL** — an item is violated in a way that produces a broken or unshippable build; fix it before handing the work over.

## Next Steps

- `/release-checklist` — full release gate before distribution
- `/patch-notes` — user-facing notes for the packaged build
- `/code-review` — architectural and quality review of the change
- `/commit` — conventional commit once the change is verified
