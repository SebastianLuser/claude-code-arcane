# Playtest Report Template & Analysis

## Template Sections (`playtest new`)

| Section | Fields |
|---------|--------|
| **Session info** | Date, build/version, duration, tester, platform, input method, session type |
| **Test focus** | Which features/flows are being tested |
| **First impressions** (5 min) | Did they understand the goal? Controls? Emotional response |
| **Gameplay flow** | What worked, pain points (with severity), points of confusion, moments of delight |
| **Bugs** | Table: description, severity, reproducible |
| **Feature feedback** | Per feature: did they understand the purpose? Engaging? Suggestions |
| **Quantitative** | Deaths, time per area, items used, features discovered vs missed |
| **Overall** | Would they play again? Difficulty, pacing, preferred session length |
| **Top 3 priorities** | The 3 most important findings |

## Analysis mode (`playtest analyze [path]`)

Read the raw notes, cross-reference them with the GDDs, structure them into the template. Flag observations that contradict the design intent.

## Findings categorization

| Category | What | Next step |
|-----------|-----|---------------|
| **Design changes** | Fun issues, player confusion, broken mechanics | Update the GDD, assess downstream impact |
| **Balance adjustments** | Wrong numbers, difficulty spikes/dips | Run `/game-analysis balance [system]` |
| **Bug reports** | Reproducible implementation defects | Issue tracker |
| **Polish items** | Friction, feel issues, they do not block progress | Backlog for the polish phase |
