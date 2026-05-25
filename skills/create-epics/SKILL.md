---
name: create-epics
description: "Translate GDDs + architecture into epics (one per module) with scope, ADRs and risk. Run /create-stories after."
category: "agile"
argument-hint: "[system-name | layer: foundation|core|feature|presentation | all] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Task, AskUserQuestion
agent: technical-director
---
# Create Epics

One epic per architectural module. Defines **what** to build and **who owns it**. Does not prescribe implementation — that's stories' job. Run once per layer, in order. Don't create Feature epics until Core is nearly complete.

Output: `production/epics/[epic-slug]/EPIC.md` + `production/epics/index.md`. Next: `/create-stories [epic-slug]`.

## 1. Parse Arguments

Resolve review mode: `--review` arg → `production/review-mode.txt` → default `lean`. Modes: `all` (all systems in layer order), `layer: foundation|core|feature|presentation`, `[system-name]`, no arg → ask.

## 2. Load Inputs

**Step 2a — Summary scan (fast):** Grep `## Summary` in all GDDs (-A 5). Filter to in-scope only.

**Step 2b — Full load (in-scope only):** `systems-index.md`, in-scope GDDs (Approved/Designed), `architecture.md` (module ownership/API boundaries), relevant ADRs (GDD Requirements Addressed, Decision, Engine Compatibility sections), `control-manifest.md` (version date), `tr-registry.yaml`, `VERSION.md`.

## 3. Processing Order

Dependency-safe: Foundation → Core → Feature → Presentation. Within layer: use systems-index.md order.

## 4. Define Each Epic

Map system to architecture module. Check ADR coverage vs TR registry: traced requirements (have Accepted ADR) vs untraced (no ADR → warn). Present per epic: layer, GDD, module, governing ADRs, engine risk (highest among ADRs), requirements covered/total, untraced TR-IDs.

Untraced requirements → warn: "epic can be created but stories for these will be Blocked until ADRs exist." AskUserQuestion: create / skip / pause for ADRs.

### 4b. Producer Gate (full mode only)

Solo/lean → skip. Full → spawn `producer` gate PR-EPIC with all epics + scope + ADR counts + milestone timeline + capacity. UNREALISTIC → revise boundaries. CONCERNS → surface.

## 5. Write Epic Files

Ask approval per epic. EPIC.md includes: header (layer, GDD, module, status), overview (1 paragraph from GDD + architecture), governing ADRs table (ADR/decision summary/engine risk), GDD requirements table (TR-ID/requirement/ADR coverage), DoD (all stories done, all ACs verified, Logic/Integration have tests, Visual/UI have evidence docs), next step.

Update `production/epics/index.md` (master table: epic/layer/system/GDD/stories/status).

## 6. Gate-Check Reminder

Foundation + Core complete → run `/gate-check production`. Reminder: epics define scope, stories define steps → run `/create-stories [epic-slug]` per epic.

## Protocol

- Present one epic at a time before asking to create
- Warn on untraced requirements before proceeding
- Ask before writing (per-epic approval)
- All content from GDDs, ADRs, architecture docs — no invention
- Never create stories — stops at epic level

## Checklist

- [ ] Every epic traces to at least one approved/designed GDD requirement
- [ ] Each epic includes acceptance criteria (DoD) with testable conditions
- [ ] Architecture modules are correctly mapped to their corresponding systems
- [ ] No duplicate epics exist for the same system or module
- [ ] Untraced requirements (TR-IDs without ADR coverage) are flagged with warnings
- [ ] `production/epics/index.md` is updated with all created epics
