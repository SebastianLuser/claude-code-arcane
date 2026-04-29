---
name: consistency-check
description: "Cross-document consistency check: detects GDD entities with conflicting stats, values, or formulas."
category: "gamedev"
argument-hint: "[full | since-last-review | entity:<name> | item:<name>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---
# Consistency Check

Detects cross-document inconsistencies by comparing GDDs against entity registry (`design/registry/entities.yaml`). Grep-first: read registry once, then grep only matching names — no full document reads.

Run: after each new GDD, before `/review-all-gdds`, before `/create-architecture`. Output: conflict report + optional registry corrections.

## Arguments

| Mode | Behavior |
|------|----------|
| `full` / no arg | All registered entries vs all GDDs |
| `since-last-review` | Only GDDs modified since last review report |
| `entity:<name>` | One entity across all GDDs |
| `item:<name>` | One item across all GDDs |

## Phase 1: Load Registry

Read `design/registry/entities.yaml`. Empty/missing → stop ("Run `/design-system` to populate"). Build lookup tables: entity_map, item_map, formula_map, constant_map.

## Phase 2: Locate GDDs

Glob `design/gdd/*.md` (exclude game-concept, systems-index, game-pillars). For `since-last-review`: git log to find GDDs modified since last `gdd-cross-review-*.md`.

## Phase 3: Grep-First Conflict Scan

For each registered entry, grep all in-scope GDDs for the name (-C 3 context). Extract values near the name and compare against registry.

| Scan | Extract | Compare |
|------|---------|---------|
| Entity | Numeric/categorical attributes, derived values | Registry attribute values |
| Item | Sell price, weight, stack rules, category | Registry item values |
| Formula | Variable names, output range/caps | Registry formula vars + range |
| Constant | Numeric values near name | Registry value |

Classification: **CONFLICT** (different values), **NOTE** (mentioned but unverifiable).

## Phase 4: Deep Investigation (conflicts only)

Full-section read of conflicting GDD. Determine: which GDD is correct (source field = authoritative owner), is registry stale (source GDD updated after registry), is this intentional design change?

Categories: 🔴 CONFLICT (different values, must resolve), ⚠️ STALE REGISTRY (source changed but registry not updated), ℹ️ UNVERIFIABLE (no comparable attribute stated).

## Phase 5: Report

Registry entries checked + GDDs scanned + conflicts (entry/attribute/values/resolution needed) + stale entries (registry vs source GDD) + unverifiable references + clean entries count.

**Verdict:** PASS (no conflicts) or CONFLICTS FOUND (list resolution steps).

## Phase 6: Registry Corrections

Stale entries → ask to update registry (update value, set revised date, comment old value). New entries in GDDs not in registry → ask to add (only if appears in 2+ GDDs). Never delete — set `status: deprecated`.

If 🔴 conflicts found → append to `docs/consistency-failures.md` (if exists): date, domain, docs involved, what happened, resolution, pattern/lesson.

## Protocol

- PASS → proceed to `/review-all-gdds` or `/create-architecture`
- CONFLICTS FOUND → fix GDDs, re-run to confirm
- Source GDD (per `source:` field) is authoritative owner
- Run after each new GDD to catch issues early
