---
name: team-vn
description: "Orchestrate the complete visual novel production pipeline: coordinate narrative, art, UI, and implementation agents through the full VN content lifecycle."
category: "visualnovel"
argument-hint: "[phase:<name>] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Task, AskUserQuestion
model: sonnet
---

When this skill is invoked:

1. **Detect current project phase** by scanning existing files:
   - No design docs → Phase 1 (Concept)
   - Story outline exists, no characters → Phase 2 (Pre-Production)
   - Characters exist, no assets → Phase 3 (Asset Production)
   - Assets exist, no .rpy chapters → Phase 4 (Implementation)
   - Chapters exist → Phase 5 (Polish & QA)

2. **Override with argument** if `phase:<name>` is specified

3. **Resolve review mode**: `--review [full|lean|solo]` or read `production/review-mode.txt`

---

## Phase 1: Concept

Objective: establish the game concept and story foundation.

### Orchestration:
1. **Spawn `vn-narrative-director`** — interactive story brainstorming
   - Input: user's concept hint or blank slate
   - Output: `design/narrative/story-outline.md`

2. **After outline approval, spawn in parallel:**
   - `vn-narrative-director` → character web expansion into individual profiles
   - `art-director` → initial art direction and style exploration

3. **Gate**: Story outline + character profiles + art direction approved
   → Proceed to Phase 2

### Key deliverables:
- `design/gdd/game-concept.md`
- `design/narrative/story-outline.md`
- Initial character sketches (descriptions, not assets)

---

## Phase 2: Pre-Production

Objective: complete all design documents before production begins.

### Orchestration:
1. **Spawn sequentially:**
   - `/vn-gdd` → full game design document
   - `/vn-ui-design all` → complete UI specification

2. **Spawn in parallel (after GDD):**
   - `/vn-character-design [char]` → for each major character (run N in parallel)
   - `/vn-dialogue-tree` → for each chapter with choices

3. **Art Bible** (if not done in Phase 1):
   - Spawn `art-director` → establish art bible anchored to VN style

4. **Gate**: GDD + art bible + all character specs + all dialogue trees approved
   → Proceed to Phase 3

### Key deliverables:
- `design/gdd/visual-novel-gdd.md`
- `design/art/art-bible.md`
- `design/characters/[all characters].md`
- `design/characters/[all]-comfyui-prompts.md`
- `design/narrative/trees/[all chapters]-flow.md`
- `design/ui/ui-spec.md`

---

## Phase 3: Asset Production

Objective: generate and approve all visual and audio assets.

### Orchestration:
1. **Create asset manifest:**
   - `/vn-asset-pipeline manifest`

2. **Generate assets in priority order:**
   - Priority 1: Character sprites (needed for all scenes)
     - `/vn-comfyui-gen character:[name]` for each character
   - Priority 2: Key backgrounds (most-used locations first)
     - `/vn-comfyui-gen bg:[name]` for each location
   - Priority 3: UI elements
     - `/vn-comfyui-gen ui`
   - Priority 4: CG illustrations (scene-specific, can be last)
     - `/vn-comfyui-gen cg:[name]` for each event

3. **Review cycle per asset batch:**
   - Generate → user reviews → approve or re-generate
   - Approved assets → integrate into project

4. **Gate**: All assets at "Approved" or "Integrated" status
   → Proceed to Phase 4

### Key deliverables:
- All character sprites with expressions and outfits
- All backgrounds with time variants
- All UI elements
- CG illustrations for all key events
- Updated asset manifest

---

## Phase 4: Implementation

Objective: write all Ren'Py scripts and wire everything together.

### Orchestration:
1. **Setup (if not done):**
   - `/vn-renpy-setup [project-name]`

2. **Implement chapter by chapter, in order:**
   For each chapter:
   a. `/vn-scene-compose chapter:[N]` — visual storyboard
   b. `/vn-script chapter:[N]` — full Ren'Py implementation
   c. Spawn `vn-renpy-developer` to review code quality

3. **Integrate assets:**
   - `/vn-asset-pipeline integrate`

4. **Implement game systems:**
   - Spawn `vn-renpy-developer` for: gallery, save/load, settings, stats

5. **Gate**: All chapters implemented + all systems working
   → Proceed to Phase 5

### Key deliverables:
- All `game/chapters/*.rpy` files
- Complete `game/screens.rpy`
- Working game from start to all endings

---

## Phase 5: Polish & QA

Objective: test, fix, and polish the complete visual novel.

### Orchestration:
1. **Full test suite:**
   - `/vn-testing full`

2. **Fix critical issues** found in testing

3. **Polish pass (spawn in parallel):**
   - `vn-renpy-developer` → transitions, timing, effects polish
   - `vn-ui-designer` → UI refinement based on playtesting
   - `writer` → dialogue polish pass (voice consistency, typos)

4. **Playtest:**
   - Full playthrough of each route
   - Verify all endings reachable
   - Check CG gallery completeness
   - Verify save/load at every choice point

5. **Build:**
   - Generate distribution builds for target platforms
   - Test each build on target platform

### Key deliverables:
- `production/qa/vn-test-report-final.md`
- Distribution builds
- Release notes

---

## Cross-Phase Agent Assignments

| Agent | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|-------|---------|---------|---------|---------|---------|
| vn-narrative-director | ★ Lead | ★ Review | — | Consult | — |
| vn-comfyui-artist | — | Concepts | ★ Lead | — | Touch-up |
| vn-renpy-developer | — | — | — | ★ Lead | ★ Polish |
| vn-ui-designer | — | ★ Spec | Assets | Wire | ★ Polish |
| vn-scene-director | — | Trees | — | ★ Direct | Review |
| vn-producer | Coord | Coord | Coord | Coord | Coord |
| writer | Collab | ★ Write | — | Dialogue | ★ Polish |
| art-director | Consult | ★ Bible | ★ Review | — | Review |

★ = primary responsibility for that phase
