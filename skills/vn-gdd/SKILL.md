---
name: vn-gdd
description: "Create a Visual Novel Game Design Document: concept, target audience, narrative structure, game systems, art direction, audio design, technical spec, and production plan."
category: "visualnovel"
argument-hint: "[project-name or empty]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebSearch, AskUserQuestion
---

When this skill is invoked:

1. **Check for existing work**:
   - Read `design/gdd/game-concept.md` — use if exists
   - Read `design/narrative/story-outline.md` — pull narrative data
   - Read `design/art/art-bible.md` — pull art direction
   - Read `design/characters/*.md` — pull character data

2. Use **incremental file writing**: create skeleton immediately, fill section by section.

---

## VN-GDD Structure

Write to `design/gdd/visual-novel-gdd.md`:

### Section 1: Game Overview
- **Title**: Working title
- **Logline**: One-sentence pitch (under 25 words)
- **Genre**: Primary + subgenres (e.g., Romance / Mystery / School Life)
- **Platform**: PC, Web, Mobile, Console
- **Engine**: Ren'Py [version]
- **Target playtime**: [hours] per route, [hours] total with all routes
- **Content rating**: target ESRB/PEGI rating and why
- **Unique selling point**: what makes this VN stand out

### Section 2: Target Audience
- **Primary audience**: age range, gender distribution, VN experience level
- **Player motivations**: story immersion, romance, mystery solving, collection
- **Comparable titles**: 3-5 reference VNs with what's borrowed from each
- **Market positioning**: where this sits relative to comparables

### Section 3: Narrative Design
- **Story brief**: [from story outline]
- **Theme statement**: core theme in one sentence
- **Act structure**: high-level act breakdown
- **Route map**: diagram of all routes and endings
- **Total word count estimate**: [scope × ~200 words/minute × playtime]
- **Choice count**: total meaningful choices across all routes
- **Ending count**: all endings by type (good/normal/bad/secret)

### Section 4: Character Design
- **Cast size**: protagonist + [N] major + [N] minor characters
- **Character summary table**: name, role, archetype, route (if applicable)
- **Relationship dynamics**: key tensions and alliances
- **Character arc summaries**: 2-3 sentences per major character

### Section 5: Game Systems
Visual novels may include gameplay systems beyond choices:

| System | Description | Complexity |
|--------|-------------|-----------|
| **Affinity tracking** | Relationship points per character | Core |
| **Flag system** | Boolean story progression flags | Core |
| **Route locking** | Conditions to enter each route | Core |
| **Gallery/CG unlock** | Collectible CG viewer | Standard |
| **Ending tracker** | Track which endings have been seen | Standard |
| **Stat system** | Player stats (courage, intelligence, etc.) | Optional |
| **Inventory** | Items that affect dialogue/choices | Optional |
| **Mini-games** | Embedded gameplay segments | Optional |
| **Timed choices** | Time-limited decisions | Optional |
| **Relationship map** | Visual relationship tracker | Optional |

For each included system, document:
1. **Purpose** — why this system exists (player experience it creates)
2. **Mechanics** — how it works (formulas, thresholds, conditions)
3. **UI representation** — how the player sees/interacts with it
4. **Edge cases** — unusual situations and how they're handled

### Section 6: Art Direction
- **Visual style**: anime / semi-realistic / stylized / pixel art
- **Color palette**: primary, secondary, accent + emotional associations
- **Character sprites**: count, expressions per character, outfit variants
- **Backgrounds**: count, time variants (day/night)
- **CG illustrations**: count, key events they depict
- **UI style**: textbox design, menu aesthetic
- **Reference board**: list of visual references

### Section 7: Audio Design
- **BGM tracks**: count, genres, mood mapping to scenes
- **SFX**: ambient sounds, UI sounds, impact sounds
- **Voice acting**: full / partial / none — if partial, which scenes
- **Audio adaptive behavior**: music changes based on affinity or route

### Section 8: Technical Specification
- **Engine**: Ren'Py [version]
- **Target resolution**: [width × height]
- **File structure**: project directory layout
- **Save system**: auto-save points, manual save slots count
- **Localization**: supported languages, translation system
- **Accessibility**: font options, text speed, skip modes, colorblind support
- **Build targets**: platforms and distribution (Steam, itch.io, web)
- **Performance targets**: load times, transition smoothness

### Section 9: Production Plan
- **Milestone breakdown**:
  1. Pre-production: story outline, character designs, art bible
  2. Production: script writing, asset generation, implementation
  3. Alpha: all routes playable, placeholder assets acceptable
  4. Beta: all assets final, full QA pass
  5. Release: polished, tested, distributed

- **Asset production estimates**:
  | Asset Type | Count | Est. Time |
  |-----------|-------|-----------|
  | Character sprites | [N chars × M expressions] | |
  | Backgrounds | [N locations × M variants] | |
  | CG illustrations | [N events] | |
  | BGM tracks | [N] | |
  | Script writing | [N words] | |
  | Ren'Py implementation | [N chapters] | |

### Section 10: Acceptance Criteria
Testable conditions for project completion:
- [ ] All routes playable from start to each ending
- [ ] All choices lead to valid paths (no dead ends)
- [ ] All character sprites display correctly with all expressions
- [ ] All backgrounds load at target resolution
- [ ] All CG events trigger at correct story points
- [ ] Gallery tracks all unlockable CGs
- [ ] Save/load works across all story points
- [ ] Settings persist between sessions
- [ ] Build runs on all target platforms
- [ ] Localization complete for all target languages
