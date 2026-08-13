# Content Directory Structure

> Adapted from the [Gamemakin UE Style Guide](https://github.com/Allar/ue5-style-guide) (MIT, Gamemakin LLC), sections 2.1–2.9. The layout is engine-version-agnostic; the UE5 notes below are additions.

## Example layout

```
Content/
  MyProject/                     <- one top-level folder, named after the project
    Core/                        <- fundamental classes; "don't touch" for non-engineers
      Character/
      GameModes/
      Pickups/                   <- base Pickup class lives here
    Characters/
      Bob/
        Animations/
        Materials/
        Textures/
        Meshes/
    Placeables/
      Pickups/                   <- Health, Ammo: designers tune these freely
    Maps/                        <- every level, subfolders welcome
      Campaign1/
      Arenas/
      Test/
    MaterialLibrary/             <- master materials, layered materials, shared utility
      Debug/                     <- strippable before shipping
      Utility/                   <- generic noise, gradients
    Input/                       <- IA_, IMC_ (UE5)
    Abilities/                   <- GA_, GE_ (UE5)
      GameplayCues/              <- GC_
    Data/                        <- DA_, DT_
    UI/
  Developers/                    <- per-person sandboxes, hidden by default
    Sebastian/
```

Plugin and marketplace content stays outside `MyProject/`, which is exactly why the top-level folder matters: without it, dropping in third-party content mixes it into your tree irreversibly.

## Folder rules

**PascalCase, always.** `DesertEagle`, `RocketPistol`. No spaces — they break batch tools and cooking. No Unicode — `Zoë` becomes `Zoe`. This extends to the project's own location on disk: prefer `D:\Project` over a path containing your user name, especially if that name has a non-ASCII character.

**One top-level project folder.** All project content in `Content/MyProject/`. Nothing loose in `Content/`.

**`Maps/` holds every level.** Whatever sublevel or streaming scheme the project uses, all levels live under `Content/MyProject/Maps`. This makes "open this map" self-explanatory, keeps cook wrangling simple, and makes it hard to accidentally omit a map from a build.

**`Core/` for fundamentals.** Base GameMode, GameState, PlayerController, PlayerState, Character and their close relatives. The folder is a social boundary as much as a technical one: designers extend these in child classes elsewhere rather than editing the base and breaking the project.

**`MaterialLibrary/` for shared materials.** Master materials, layered materials, material functions, and shared utility textures that belong to no particular asset. The payoff is enforceability — if the policy is "instances only", any plain material outside this folder is a violation you can find by search. `MaterialLibrary/Debug` keeps debug materials strippable and makes it obvious when production content references one.

**`Developers/` for sandboxes.** Hidden in the Content Browser by default, so a world builder cannot accidentally place an asset that is still being iterated on. Promotion is a move into the project folder plus a redirector fix-up.

**No `Assets` or `AssetTypes` folders.** Everything is an asset, so the name carries no information, and grouping by type duplicates what the Content Browser's filters already do better.

**Very large asset sets get their own layout.** A set of hundreds of related assets — a modular environment kit, a large vehicle — earns an internal folder structure of its own rather than being flattened into the parent. Judgement call: the threshold is when the parent folder stops being scannable.

**No empty folders.**

## Removing a stubborn empty folder

An empty folder that will not delete almost always means an unfixed redirector. The safe sequence:

1. Confirm you are on source control and your state is clean.
2. Run **Fix Up Redirectors** on the project.
3. If it persists, navigate to the folder on disk and delete the assets inside.
4. Close the editor.
5. Sync source control state (Perforce: *Reconcile Offline Work* on the content directory).
6. Reopen the editor and confirm everything still works. If it does not, revert, find out what was actually referencing the folder, and try again.
7. Confirm the folder is gone, then submit.

Steps 1 and 4–6 are the ones people skip, and they are the ones that make the difference between a clean removal and a broken reference hunt.

## Renaming safely

Renaming is a reference rewrite, not a cosmetic edit:

- Clean source-control state first, so the change is revertible as a unit.
- Rename through the editor, never on disk — the editor creates the redirector that keeps existing references working.
- Run **Fix Up Redirectors** afterwards, then submit the rename and the fix-up together.
- Bulk renames deserve a dry run: list what will change and get it approved before touching anything.

A rename that leaves redirectors behind will appear to work and then fail at cook time, which is the worst possible moment to discover it.
