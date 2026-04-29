---
name: quick-design
description: "Lightweight design spec for small changes (tuning, mechanics, balance). Skips full GDD when change is minor. Output: Quick Design Spec."
category: "design"
argument-hint: "[brief description of the change]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# Quick Design

Lightweight design path for changes <4h implementation. Output: `design/quick-specs/[name]-[date].md`.

## 1. Classify the Change

| Category | Description | Example |
|----------|-------------|---------|
| **Tuning** | Changing numbers/balance, no behavioral change | Increase jump height 5→6 |
| **Tweak** | Small behavioral change, no new states | Dash invincible on frame 1 |
| **Addition** | Small mechanic, 1-2 new states/interactions | Add parry window to block |
| **New Small System** | Standalone feature, <1 week implementation | Achievement popup system |

Doesn't fit → redirect to `/design-system`. No arg → ask description. Present classification → confirm.

## 2. Context Scan

Read: relevant GDD from `design/gdd/` (affected sections), `systems-index.md` (dependency tier), prior quick specs in `design/quick-specs/` (avoid contradictions). Tuning: also check `assets/data/` for data file.

## 3. Draft Quick Design Spec

### Tuning
Header (type, system, GDD ref, date) + change table (parameter/old/new/rationale) + tuning knob mapping (within/edge/outside documented range) + ACs (value from data file, observable difference, no regression).

### Tweak / Addition
Header + change summary (1-2 sentences) + motivation (player experience problem, MDA aesthetic) + design delta (exact GDD quote → new rule) + new rules/values (unambiguous, implementable) + affected systems table (system/impact/action required) + ACs (specific, testable, regression check) + GDD update required? (which file/section/what change).

### New Small System
Header (type, scope, date, estimated hours) + overview (1 paragraph) + core rules (numbered for sequential, bullets for conditions) + tuning knobs table (knob/default/range/category/rationale — all in data files, not hardcoded) + ACs (functional + experiential + regression) + systems index (add to index? or below threshold).

## 4. Approval and Filing

Present draft → ask write approval → `design/quick-specs/[kebab-case]-[YYYY-MM-DD].md`. If GDD update required → show exact old vs new text → ask separate approval.

## 5. Handoff

Report: file written, type, system, GDD update status. Next: `/story-readiness` (reference spec in story's GDD Reference field).

Bypasses `/design-review` by design. Redirect to full pipeline if: new system belongs in index, significantly alters cross-system behavior, introduces new player-facing mechanics affecting MDA balance, or >1 week implementation.
