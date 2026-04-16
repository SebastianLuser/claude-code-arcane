# Technical Design: [System Name]

## Document Status
- **Version**: 1.0
- **Last Updated**: [Date]
- **Author**: [Agent/Person]
- **Reviewer**: [backend-architect / frontend-architect / api-architect / database-architect]
- **Related ADR**: [ADR-XXXX if applicable]
- **Related PRD / RFC**: [Link to product requirement or RFC this implements]

## Stack Surface

| Field | Value |
|-------|-------|
| **Language / Runtime** | [e.g. Go 1.23 / Node 20 / Python 3.12 / TypeScript 5.4] |
| **Framework / Libraries** | [Specific packages + versions — e.g. `Fastify 4.x`, `Prisma 5.x`] |
| **External Dependencies** | [DBs, queues, caches, 3rd party APIs this design depends on] |
| **References Consulted** | [framework docs, RFCs, internal ADRs read before writing this] |
| **Post-Cutoff Features Used** | [Features from framework versions beyond LLM training cutoff, or "None"] |
| **Unverified Assumptions** | [API behaviours assumed but not yet tested against the target version, or "None"] |
| **Upgrade Risk** | [LOW / MEDIUM / HIGH — how fragile is this design if framework versions change?] |

> **Rule**: If any **Unverified Assumptions** are listed, this document cannot be marked
> as Accepted until those assumptions are validated against the real dependency.

## Overview
[2-3 sentence summary of what this system does and why it exists]

## Requirements
### Functional Requirements
- [FR-1]: [Description]
- [FR-2]: [Description]

### Non-Functional Requirements
- **Performance**: [Budget — e.g., "p95 < 200ms", "< 50ms DB query"]
- **Scalability**: [Limits — e.g., "10k concurrent users", "1M records/day"]
- **Availability**: [SLO — e.g., "99.9% uptime"]
- **Security / Compliance**: [Requirements — authn, authz, PII, audit]
- **Observability**: [Logs, metrics, traces required]

## Architecture

### System Diagram
```
[ASCII diagram showing components and data flow]
```

### Component Breakdown
| Component | Responsibility | Owns |
| --------- | -------------- | ---- |
| [Name] | [What it does] | [What data it owns] |

### Public API
```
[Interface/API definition in pseudocode or target language]
```

### Data Structures
```
[Key data structures with field descriptions]
```

### Data Flow
[Step by step: how data moves through the system during a typical request/event]

## Implementation Plan

### Phase 1: [Core Functionality]
- [ ] [Task 1]
- [ ] [Task 2]

### Phase 2: [Extended Features]
- [ ] [Task 3]
- [ ] [Task 4]

### Phase 3: [Optimization/Polish]
- [ ] [Task 5]

## Dependencies
| Depends On | For What |
| ---------- | -------- |
| [System] | [Reason] |

| Depended On By | For What |
| -------------- | -------- |
| [System] | [Reason] |

## Testing Strategy
- **Unit Tests**: [What to test at unit level]
- **Integration Tests**: [Cross-system tests needed]
- **Performance Tests**: [Benchmarks to create]
- **Edge Cases**: [Specific scenarios to test]

## Known Limitations
[What this design intentionally does NOT support and why]

## Future Considerations
[What might need to change if requirements evolve — but do NOT build for this now]
