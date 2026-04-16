# ADR-[NNNN]: [Title]

## Status

[Proposed | Accepted | Deprecated | Superseded by ADR-XXXX]

## Date

[YYYY-MM-DD — when this ADR was written]

## Last Verified

[YYYY-MM-DD — when this ADR was last confirmed accurate against the current
engine version and design. Update this date when you re-read and confirm it
is still correct, even if nothing changed.]

## Decision Makers

[Who was involved in this decision]

## Summary

[2 sentences: what problem this ADR solves, and what was decided. Written for
tiered context loading — a skill scanning 20 ADRs uses this to decide whether
to read the full decision. Be specific: name the system, the problem, and the
chosen approach.]

## Technology Stack

| Field | Value |
|-------|-------|
| **Language/Runtime** | [e.g. Go 1.23 / Node 20 / Python 3.12] |
| **Framework** | [e.g. Fastify / NestJS / Gin / FastAPI / Next.js 15] |
| **Domain** | [API / Data / Auth / UI / Infra / Integrations / Observability] |
| **Knowledge Risk** | [LOW — in training data / MEDIUM — near cutoff, verify / HIGH — post-cutoff, must verify] |
| **References Consulted** | [e.g. framework docs, RFC, internal ADRs] |
| **Verification Required** | [Concrete behaviours to test against the target versions before shipping, or "None"] |

> **Note**: If Knowledge Risk is MEDIUM or HIGH, this ADR must be re-validated if the
> project upgrades major versions. Flag it as "Superseded" and write a new ADR.

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | [ADR-NNNN (must be Accepted before this can be implemented), or "None"] |
| **Enables** | [ADR-NNNN (this ADR unlocks that decision), or "None"] |
| **Blocks** | [Epic/Story name — cannot start until this ADR is Accepted, or "None"] |
| **Ordering Note** | [Any sequencing constraint that isn't captured above] |

## Context

### Problem Statement

[What problem are we solving? Why must this decision be made now? What is the
cost of not deciding?]

### Current State

[How does the system work today? What is wrong with the current approach?]

### Constraints

- [Technical constraints -- engine limitations, platform requirements]
- [Timeline constraints -- deadline pressures, dependencies]
- [Resource constraints -- team size, expertise available]
- [Compatibility requirements -- must work with existing systems]

### Requirements

- [Functional requirement 1]
- [Functional requirement 2]
- [Performance requirement -- specific, measurable]
- [Scalability requirement]

## Decision

[The specific technical decision, described in enough detail for someone to
implement it without further clarification.]

### Architecture

```
[ASCII diagram showing the system architecture this decision creates.
Show components, data flow direction, and key interfaces.]
```

### Key Interfaces

```
[Pseudocode or language-specific interface definitions that this decision
creates. These become the contracts that implementers must respect.]
```

### Implementation Guidelines

[Specific guidance for the programmer implementing this decision.]

## Alternatives Considered

### Alternative 1: [Name]

- **Description**: [How this approach would work]
- **Pros**: [What is good about this approach]
- **Cons**: [What is bad about this approach]
- **Estimated Effort**: [Relative effort compared to chosen approach]
- **Rejection Reason**: [Why this was not chosen]

### Alternative 2: [Name]

[Same structure as above]

## Consequences

### Positive

- [Good outcomes of this decision]

### Negative

- [Trade-offs and costs we are accepting]

### Neutral

- [Changes that are neither good nor bad, just different]

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|

## Performance Implications

| Metric | Before | Expected After | Budget |
|--------|--------|---------------|--------|
| Latency (p50/p95/p99) | [X]ms | [Y]ms | [Z]ms |
| Throughput | [X]req/s | [Y]req/s | [Z]req/s |
| Memory | [X]MB | [Y]MB | [Z]MB |
| Cost (monthly) | $[X] | $[Y] | $[Z] |

## Migration Plan

[If this changes existing systems, the step-by-step plan to migrate.]

1. [Step 1 -- what changes, what breaks, how to verify]
2. [Step 2]
3. [Step 3]

**Rollback plan**: [How to revert if this decision proves wrong]

## Validation Criteria

[How we will know this decision was correct after implementation.]

- [ ] [Measurable criterion 1]
- [ ] [Measurable criterion 2]
- [ ] [Performance criterion]

## Requirements Addressed

<!-- This section is MANDATORY. Every ADR must trace back to at least one
     product/technical requirement, or explicitly state it is a foundational
     decision with no direct dependency. Traceability is audited by
     /architecture-review. -->

| Source Doc | Area | Requirement | How This ADR Satisfies It |
|-----------|------|-------------|--------------------------|
| [e.g. `design/product/auth.md`] | [e.g. Auth] | [e.g. "Sessions must invalidate within 5 min on logout"] | [e.g. "JWT + Redis deny-list flushed on logout event"] |

> If this is a foundational decision with no direct product requirement, write:
> "Foundational — no PRD requirement. Enables: [list what systems this decision
> unlocks or constrains]"

## Related

- [Link to related ADRs — note if supersedes, contradicts, or depends on]
- [Link to relevant code files once implemented]
