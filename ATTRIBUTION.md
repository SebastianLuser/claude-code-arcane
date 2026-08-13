# Attribution

Parts of Arcane are derived from third-party open-source work. This file records what came
from where, what was changed, and the notices those licenses require us to keep.

Arcane itself is MIT licensed (see `LICENSE`). Nothing here changes the license of Arcane's
own content; it records the terms attached to the imported material.

---

## The `unreal-dev` profile

The `ue-*` skills installed by the `unreal-dev` profile were brought over from four
upstream sources and adapted to Arcane's skill contract.

Note on MCP: Arcane deliberately ships no skill that *operates* an engine's MCP server. For
Unity that skill comes from the CoplayDev package; for Unreal it comes from the engine and
Epic's plugin. Arcane's `install-mcp` only enables and connects the server, which is why the
upstream Epic skills that drive and extend the MCP were left out — see the Epic section below.

### Common adaptations

Every imported skill was modified. Across the board:

- Frontmatter was rewritten to Arcane's contract: `name`, `description`, `category`,
  `argument-hint`, `user-invocable`, `allowed-tools`. Upstream `metadata.version` fields and
  long trigger-word descriptions were dropped or compressed.
- Cross-skill references were remapped to Arcane slash commands (`ue-input-system` →
  `/ue-input-system`) and, where upstream and Arcane names differ, to the Arcane name.
- An ask-before-write line, a `## Checklist` section with an explicit PASS/CONCERNS/FAIL
  verdict, and a `## Next Steps` handoff section were injected, because Arcane's
  `/skill-test static` requires them.
- The project context document path was moved from `.agents/ue-project-context.md` to
  `docs/unreal/project-context.md`, matching Arcane's convention of keeping generated
  project docs under `docs/`.

Reference files under each skill's `references/` directory carry their upstream technical
content; only the path and cross-reference remaps above were applied to them.

---

### quodsoler/unreal-engine-skills — MIT

Source: <https://github.com/quodsoler/unreal-engine-skills>

Provides 27 skills: `ue-project-context`, `ue-cpp-foundations`,
`ue-actor-component-architecture`, `ue-gameplay-framework`, `ue-gameplay-abilities`,
`ue-animation-system`, `ue-character-movement`, `ue-game-features`,
`ue-networking-replication`, `ue-materials-rendering`, `ue-niagara-effects`,
`ue-audio-system`, `ue-sequencer-cinematics`, `ue-world-level-streaming`,
`ue-procedural-generation`, `ue-physics-collision`, `ue-serialization-savegames`,
`ue-data-assets-tables`, `ue-ai-navigation`, `ue-state-trees`, `ue-mass-entity`,
`ue-ui-umg-slate`, `ue-input-system`, `ue-editor-tools`, `ue-testing-debugging`,
`ue-async-threading`, `ue-module-build-system`.

Changes: the common adaptations above. Skill names were kept as upstream.

```
MIT License

Copyright (c) 2025 quodsoler

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

### EpicGames/unreal-engine-skills-for-claude-code-plugin — MIT

Source: <https://github.com/EpicGames/unreal-engine-skills-for-claude-code-plugin>

Provides 1 hook and the Unreal half of one skill:

| Upstream | Arcane |
|----------|--------|
| `hooks/unreal-context.sh` | `hooks/detect-unreal.sh` |
| `unreal-mcp/references/setup.md` | `install-mcp` Phase 2B (Unreal branch) |
| `unreal-mcp/references/operations.md` | `install-mcp/references/unreal-operations.md` |

Changes:

- `detect-unreal.sh` was restructured to Arcane's hook conventions (`set +e`, `main()`,
  `exit 0`) and its injected context now points at `/ue-project-context` and `/install-mcp`.
  The project-root detection logic, including the `Engine` directory caveat, is upstream's.
- The Unreal MCP setup procedure (enabling the `ModelContextProtocol` and `AllToolsets`
  engine plugins, `bAutoStartServer`, `.mcp.json` generation and its source-build vs
  installed-build destinations) became the Unreal branch of Arcane's existing `install-mcp`
  skill, alongside the pre-existing Unity branch.
- The operations reference was carried over with its upstream `setup.md` cross-references
  remapped to that skill's Phase 2B, and the safety rules from the upstream `unreal-mcp`
  skill body appended to it.

Upstream's `unreal-mcp`, `create-toolset` and `unreal-skill` skills are **not** shipped by
Arcane. Unreal's MCP server, its toolsets and its in-editor Agent Skills come from the engine
and Epic's own plugin; Arcane does not duplicate the skills that operate or extend them. It
only enables and connects the server.

```
MIT License

Copyright (c) 2026 Epic Games, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Unreal Engine is a trademark of Epic Games, Inc. Arcane is not affiliated with or endorsed
by Epic Games.

---

### gamedev-skills/awesome-gamedev-agent-skills — Apache 2.0

Source: <https://github.com/gamedev-skills/awesome-gamedev-agent-skills>

Provides 2 skills and 6 reference files:

| Upstream | Arcane |
|----------|--------|
| `unreal-blueprints` | `/ue-blueprints` |
| `unreal-packaging` | `/ue-packaging` |
| `unreal-cpp-gameplay` | `ue-cpp-foundations/references/gameplay-classes-cpp.md` |
| `unreal-cpp-gameplay/references/components-and-gc.md` | `ue-cpp-foundations/references/components-and-gc.md` |
| `unreal-enhanced-input` | `ue-input-system/references/enhanced-input-workflow.md` |
| `unreal-enhanced-input/references/cpp-setup.md` | `ue-input-system/references/cpp-setup.md` |
| `unreal-behavior-trees` | `ue-ai-navigation/references/behavior-tree-workflow.md` |
| `unreal-behavior-trees/references/custom-bttask.md` | `ue-ai-navigation/references/custom-bttask.md` |
| `unreal-niagara` | `ue-niagara-effects/references/niagara-workflow.md` |
| `unreal-blueprints/references/communication.md` | `ue-blueprints/references/communication.md` |

Changes, as required by Apache 2.0 §4(b) — each modified file also carries its own
provenance note:

- `unreal-blueprints` and `unreal-packaging` became `/ue-blueprints` and `/ue-packaging`
  with the common adaptations above. A Context Check section was added to match the other
  `ue-*` skills, `steam-publish`/`itch-publish` references were remapped to
  `/release-checklist`, and one Common Mistakes item was added to each (Blueprint graph
  size; not staging credentials into a packaged build).
- The four skills that overlap a quodsoler skill were folded into that skill's
  `references/` directory rather than shipped as competing slash commands, because
  gamedev-skills covers the editor-side workflow while quodsoler covers the C++ side. Their
  frontmatter was stripped and their `# H1` retitled as a reference file.

Required NOTICE, reproduced from the upstream `NOTICE` file:

```
awesome-gamedev-agent-skills
Copyright 2026 Abhishek Barali and the awesome-gamedev-agent-skills contributors

This product is licensed under the Apache License, Version 2.0 (see LICENSE).

All skills in this repository are original works. They were authored from primary
documentation (engine and framework docs, language references, and platform
specifications). Third-party sources and other skill collections were studied for
general patterns only; no text or code was copied from them.

Game engine, framework, and platform names referenced in this repository
(including but not limited to Godot, Unity, Unreal Engine, Phaser, PixiJS,
three.js, Babylon.js, Bevy, GameMaker, LÖVE, and MonoGame) are trademarks of
their respective owners and are used for identification and descriptive purposes
only. Their use does not imply any affiliation with or endorsement by those owners.
```

The full Apache License 2.0 text is available at
<https://www.apache.org/licenses/LICENSE-2.0>.

---

### Allar/ue5-style-guide (Gamemakin UE Style Guide) — MIT

Source: <https://github.com/Allar/ue5-style-guide>

Provides the `ue-naming-conventions` skill and its two reference files.

**On currency:** despite the repository name, the content is UE4-era. The `main` branch says so
explicitly, and the `v2` branch intended to modernise it is an unfinished draft last touched in
October 2023. The naming and directory conventions are engine-version-agnostic and remain the
de-facto community standard, so those were carried over; the dated parts were not.

Changes:

- Sections 00.1 (forbidden characters), 1.1–1.2 (asset naming), and 2.1–2.9 (content directory
  structure) were adapted into `ue-naming-conventions` plus
  `references/asset-name-modifiers.md` and `references/content-structure.md`, with Arcane
  frontmatter, the ask-before-write gate, a PASS/CONCERNS/FAIL checklist and Next Steps added.
- **Static Mesh defaults to `SM_`, not upstream's `S_`.** Upstream notes many teams use `SM_`;
  Epic's own tooling, including the asset prefixes its MCP server keys off, assumes `SM_`. The
  divergence and how to resolve it are called out in the skill.
- **UE5 asset types the guide predates were added**: Niagara, Control Rig, IK Rig/Retargeter,
  Enhanced Input, Gameplay Ability System, MetaSounds, State Tree, PCG, Level Instances, Data
  Layers, Chaos, Material Layers, Composite Data Tables.
- **Deprecated entries are marked rather than carried silently**: Cascade `PS_`, Matinee,
  Destructible Mesh. A prefix-collision section was added for cases the guide does not cover
  (`SM_`, `MT_`, `GC_`, `PM_`).
- Not carried over: the UE4-specific asset-hygiene sections (built lighting, marketplace
  submission rules, Paper 2D beyond naming) and the Blueprint graph rules already covered by
  `/ue-blueprints`.

```
The MIT License

Copyright (c) 2016 Gamemakin LLC. https://gamemak.in

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
