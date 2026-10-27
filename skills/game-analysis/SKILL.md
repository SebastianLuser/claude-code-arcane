---
name: game-analysis
description: "Balance analysis and playtest reports: DPS, economy, progression, outliers, degenerate strategies."
category: "gamedev"
argument-hint: "[balance [system]|playtest [new|analyze path]]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# game-analysis — Balance + Playtesting

Two modes: numeric balance analysis and playtesting reports.

---

## 1. Balance Check

### Identify the domain

From the argument or by asking the user:

| Domain | What to analyze |
|---------|-------------|
| **Combat** | DPS per tier, time-to-kill, dominant options, unkillable states, damage/resistance interactions |
| **Economy** | Faucets/sinks with flow rates, accumulation over time, infinite loops, gold sinks vs generation, items never worth buying |
| **Progression** | XP/power curve, dead zones (no useful progression), power spikes, content gates vs player power, skip/grind exploits |
| **Loot** | Expected time per rarity tier, pity timer math, useless loot at some stage, inventory pressure vs acquisition rate |

### Process

1. Read the data files (`assets/data/`, `design/balance/`, SO assets)
2. Read the system's GDD to understand the design targets
3. Run the domain-specific analysis (tables above)
4. Compare current values against the GDD's intent

> → Read references/balance-report-format.md for [the balance report output format]

### Fix & verify

After the report: offer to fix the values. After each fix, re-run the relevant checks to verify that no new outliers were introduced.

---

## 2. Playtest Report

### Template mode (`playtest new`) / Analysis mode (`playtest analyze [path]`)

> → Read references/playtest-template.md for [the section template, analysis mode and findings categorization]

---

> → Read references/anti-patterns-checklist.md for [anti-patterns and the validation checklist]
