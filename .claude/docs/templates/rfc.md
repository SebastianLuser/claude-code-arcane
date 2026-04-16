# RFC-[NNNN]: [Title]

> **Status**: [Draft | In Review | Accepted | Rejected | Superseded by RFC-XXXX]
> **Author**: [engineer name]
> **Reviewers**: [required reviewers — architects, domain leads, security]
> **Created**: [YYYY-MM-DD]
> **Last Updated**: [YYYY-MM-DD]
> **Deadline for comment**: [YYYY-MM-DD]
> **Related PRD**: [link to PRD this enables, or "None — technical-only"]

---

## 1. Summary

[2-3 sentences. What problem does this RFC solve? What is the proposed approach?
Written for engineers skimming the archive — they should understand scope and
direction without reading further.]

---

## 2. Background & Motivation

### 2.1 Context

[Describe the current state of the system relevant to this proposal. What exists
today? What constraints and assumptions are baked in?]

### 2.2 Problem

[What specifically is broken, missing, or limiting? Be concrete — include
evidence: incident post-mortems, performance measurements, developer complaints,
feature requests blocked by this limitation.]

### 2.3 Why Now?

[Why must this decision be made now? What is the cost of deferring? What
triggered this RFC — a deadline, an incident, a new product requirement, a
scalability ceiling being reached?]

---

## 3. Goals & Non-Goals

### 3.1 Goals

1. [Technical outcome 1 — measurable]
2. [Technical outcome 2]
3. [Technical outcome 3]

### 3.2 Non-Goals

Explicitly not solving:

- [Adjacent problem we are not addressing, and why]
- [Out-of-scope extension — perhaps for a future RFC]

---

## 4. Proposal

[The meat of the RFC. What are you proposing, in enough detail that another
engineer could implement it.]

### 4.1 Design Overview

[Text + diagram summarizing the proposed approach. Keep this section readable
top-to-bottom without jumping to implementation.]

```
[ASCII or link to diagram — component boundaries, data flow, control flow]
```

### 4.2 Key Components

| Component | Responsibility | Owns | New / Changed / Existing |
|-----------|---------------|------|-------------------------|
| [Name] | [What it does] | [What data/state] | [status] |

### 4.3 API Surface

```
[Interface / API definition — function signatures, HTTP contract, protobuf,
event schema. Show inputs, outputs, error cases.]
```

### 4.4 Data Model

```
[Schema changes — new tables, columns, indexes, migrations. Show relationships.]
```

### 4.5 Control Flow

[Step by step: how a typical request / event / operation moves through the
system under this proposal. Include error paths.]

1. [Step 1]
2. [Step 2]
3. [Step 3]

### 4.6 Failure Modes

| Failure | Detection | Recovery |
|---------|-----------|----------|
| [Dependency down] | [Healthcheck / timeout] | [Retry / circuit breaker / degraded mode] |
| [Partial write] | [Transactional check] | [Rollback / reconciliation] |

---

## 5. Alternatives Considered

For each alternative: how it would work, why it was rejected.

### 5.1 Alternative 1: [Name]

- **Approach**: [High-level description]
- **Pros**: [What's good about it]
- **Cons**: [What's bad about it]
- **Effort**: [Relative to proposal]
- **Rejection reason**: [Why not chosen]

### 5.2 Alternative 2: [Name]

[Same structure]

### 5.3 Do Nothing

- **What happens if we don't act**: [Consequences]
- **Why that's insufficient**: [Evidence]

---

## 6. Impact Analysis

### 6.1 Affected Systems

- [System 1] — [how it's affected]
- [System 2] — [how it's affected]

### 6.2 Affected Teams

- [Team A] — [what they need to change, effort estimate]
- [Team B] — [what they need to change]

### 6.3 Compatibility

- **Breaking changes**: [list or "None"]
- **Deprecation timeline**: [if deprecating existing APIs]
- **Client impact**: [SDK / mobile / 3rd party consumers]

### 6.4 Performance

| Metric | Baseline | Expected | Budget |
|--------|----------|----------|--------|
| p95 latency | [X]ms | [Y]ms | [Z]ms |
| Throughput | [X]req/s | [Y]req/s | |
| Memory / CPU | | | |
| Cost (monthly) | $[X] | $[Y] | |

### 6.5 Security

- **New attack surface**: [list, or "None"]
- **Authn / authz changes**: [describe]
- **Data sensitivity**: [new PII flows? encryption at rest/in transit?]
- **Threat model**: [link to threat-model doc if created]

### 6.6 Privacy & Compliance

- [GDPR / CCPA / SOC2 / HIPAA implications]
- [Data retention changes]
- [Cross-border data transfer?]

### 6.7 Observability

- **New metrics**: [list — what to instrument]
- **New logs**: [what events to log, retention]
- **New traces / spans**: [distributed trace additions]
- **Alerts**: [SLOs / alert conditions to define]

---

## 7. Implementation Plan

### 7.1 Phases

**Phase 1: [Foundation]** — [target date]
- [ ] [Task 1]
- [ ] [Task 2]

**Phase 2: [Core]** — [target date]
- [ ] [Task 3]
- [ ] [Task 4]

**Phase 3: [Migration / Rollout]** — [target date]
- [ ] [Task 5]
- [ ] [Task 6]

### 7.2 Migration Strategy

[If this changes an existing system, describe how to migrate. Include
backwards-compatibility plan, dual-write phase if needed, cutover criteria.]

### 7.3 Rollout

- [ ] Feature flag: `[flag_name]` — default OFF
- [ ] Staged rollout: 1% → 10% → 50% → 100%
- [ ] Gating metric: [what must be green to advance]
- [ ] Rollback criteria: [what triggers revert]

### 7.4 Testing Strategy

- **Unit tests**: [coverage expectation]
- **Integration tests**: [which flows]
- **Load tests**: [target profile, success threshold]
- **Chaos / failure testing**: [what scenarios]
- **Canary analysis**: [what to watch]

---

## 8. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| [Risk 1] | [L/M/H] | [L/M/H] | [Mitigation] |
| [Risk 2] | | | |

---

## 9. Open Questions

Must be resolved before RFC can be Accepted.

- [ ] [Question 1] — owner: [name] — answer by: [date]
- [ ] [Question 2] — owner: [name] — answer by: [date]

---

## 10. Decision Log

| Date | Decision | Rationale | Decider |
|------|----------|-----------|---------|
| [YYYY-MM-DD] | [What was decided] | [Why] | [Who] |

---

## 11. Related

- [Link to related ADRs — which ones this RFC triggers or depends on]
- [Link to PRDs this RFC enables]
- [Link to previous RFCs this supersedes or extends]
- [Links to research, benchmarks, prior art]

---

*Template: `.claude/docs/templates/rfc.md`*
*Location when instantiated: `docs/rfc/rfc-[NNNN]-[slug].md`*
