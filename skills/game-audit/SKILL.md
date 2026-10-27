---
name: game-audit
description: "Audit assets, docs and cross-document consistency: naming, orphaned assets, doc-vs-code contradictions, balance red flags, entity registry."
category: "gamedev"
argument-hint: "[assets|docs|consistency|full] [path]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# game-audit — Assets + Documents

Read-only diagnostic audit. Produces a report; does not modify files.

## 1. Asset Audit

| Directory | Checks |
|------------|--------|
| Art (textures, sprites, meshes) | Naming, power-of-two, format (PNG UI, compressed 3D), size budget |
| Audio (SFX, music) | Naming, sample rate, format (OGG/MP3), duration |
| Data (JSON, YAML, SO) | Schema compliance, valid format |

### Checks
- **Naming**: `lowercase_underscores`, pattern `[cat]_[name]_[variant].[ext]`
- **Orphaned**: no references in code/scenes — check for dynamic loading (Addressables, Resources.Load) before flagging
- **Missing**: code references an asset that does not exist
- **Size**: compare against the art bible budget

Standards source: art bible > CLAUDE.md > flag "no standard defined"

## 2. Document Audit

Args: `gdd`, `spec-docs`, `gdd-vs-code`, `balance`, a specific path, or no arg = full.

| Type | Severity | What to look for |
|------|-----------|------------|
| Contradictions | CRITICAL | Same mechanic described differently across docs/code |
| Gaps | HIGH | TBD/empty, undefined mechanics, formulas without numbers |
| Coherence | MEDIUM | Edge cases, inconsistent terminology, absurd formulas |
| Balance | MEDIUM | Dominant strategies, strictly worse options, snowball, broken economy |
| Completeness | HIGH | Incomplete scope, hidden dependencies |

Gap classification: Blocking (cannot be implemented) > Important (before the milestone) > Nice to have.

## 3. Consistency Check (entity registry)

Arg: `consistency`, `consistency entity:<name>`, `consistency item:<name>`.

If a registry exists (`design/registry/entities.yaml`): load lookup tables → grep names in GDDs → extract nearby values → compare.

| Type | Action |
|------|--------|
| CONFLICT | Same name, different values — resolve before moving on |
| STALE REGISTRY | Source GDD changed, registry not updated |
| UNVERIFIABLE | No comparable attributes — informational only |

Resolution: the source GDD is authoritative. If no registry exists → report that one is required.

## Report format

Overall status: HEALTHY / NEEDS ATTENTION / CRITICAL. Executive summary (2-3 sentences). Findings in condensed PAS format (≤5 lines each) with severity. Asset compliance table. A "what is working" section. Prioritized action items.

## Anti-patterns

- Auditing without reading the art bible first
- Flagging orphans without checking for dynamic loading
- Mixing severities without prioritizing
- Only criticizing without acknowledging good design
