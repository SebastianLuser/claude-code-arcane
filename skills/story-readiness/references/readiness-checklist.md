# Readiness Checklist

## Design Completeness
- [ ] **GDD requirement referenced** — specific requirement traced, not just filename
- [ ] **Requirement self-contained** — ACs understandable without opening GDD
- [ ] **ACs testable** — specific, observable conditions (not "implement X" or "works correctly")
- [ ] **No judgment calls** — no "feels responsive" without defined benchmark

## Architecture Completeness
- [ ] **ADR referenced or N/A stated** — explicit either way
- [ ] **ADR is Accepted** — Proposed: BLOCKED (may change). Missing: BLOCKED
- [ ] **TR-ID valid and active** — deprecated/superseded: NEEDS WORK. Not in registry: NEEDS WORK. No TR-ID or no registry: auto-pass
- [ ] **Manifest version current** — story older than manifest: NEEDS WORK (new rules may apply)
- [ ] **Engine notes present** — for post-cutoff APIs. N/A if pure data/config
- [ ] **Control manifest rules noted** — auto-pass if manifest doesn't exist

## Scope Clarity
- [ ] **Estimate present** (hours/points/t-shirt)
- [ ] **In-scope/out-of-scope boundary stated**
- [ ] **Dependencies listed** — other story IDs or explicit "None"

## Open Questions
- [ ] **No UNRESOLVED/TBD/TODO/?** in criteria or rules
- [ ] **Dependency stories not DRAFT** — DRAFT/missing: BLOCKED

## Asset References
- [ ] **Referenced assets exist** — Glob for asset paths (.png/.svg/.wav/.glb/.tscn etc). Missing: NEEDS WORK. No refs: auto-pass

## Definition of Done
- [ ] **>=3 testable ACs** — fewer = trivial or under-specified
- [ ] **Performance budget** if touching gameplay loop/rendering/physics
- [ ] **Story Type declared** — Logic/Integration/Visual-Feel/UI/Config-Data
- [ ] **Test evidence section** — where evidence will be stored for the story type
