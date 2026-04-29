# Section Guidance & Agent Routing

## Section Guidance

| Section | Goal | Mandatory Agent |
|---------|------|----------------|
| **A: Overview** | One-paragraph description. Framing/ADR-ref/Fantasy multi-tab question | — |
| **B: Player Fantasy** | Emotional target | `creative-director` |
| **C: Detailed Design** | Unambiguous spec: Core Rules, States/Transitions, System Interactions | Category specialist (see routing table) |
| **D: Formulas** | Math with variable tables, ranges, worked examples | `systems-designer` + `economy-designer` if costs |
| **E: Edge Cases** | If [condition] -> [exact outcome] format | `systems-designer` |
| **F: Dependencies** | Every connection with direction, interface, hard/soft | — |
| **G: Tuning Knobs** | Designer-adjustable values with safe ranges | `systems-designer` if complex |
| **H: Acceptance Criteria** | Given-When-Then, testable by QA | `qa-lead` |
| Visual/Audio | Required for visual categories, optional otherwise | `art-director` |
| UI Requirements | Flag for `/ux-design` if real content | `ux-designer` if complex |

## Agent Routing

| System Category | Primary | Supporting |
|----------------|---------|------------|
| Foundation/Infrastructure | `systems-designer` | `gameplay-programmer`, `engine-programmer` |
| Combat, damage, health | `game-designer` | `systems-designer`, `ai-programmer`, `art-director` |
| Economy, loot, crafting | `economy-designer` | `systems-designer`, `game-designer` |
| Progression, XP, skills | `game-designer` | `systems-designer`, `economy-designer` |
| Dialogue, quests, lore | `game-designer` | `narrative-director`, `writer`, `art-director` |
| UI systems | `game-designer` | `ux-designer`, `ui-programmer`, `art-director` |
| AI, pathfinding | `game-designer` | `ai-programmer`, `systems-designer` |
| Animation, movement | `game-designer` | `art-director`, `technical-artist`, `gameplay-programmer` |
