# PRD: [Feature / Product Name]

> **Status**: [Draft | In Review | Approved | Shipped | Deprecated]
> **Author**: [product-manager / PM name]
> **Reviewers**: [eng-lead, design-lead, stakeholder]
> **Created**: [YYYY-MM-DD]
> **Last Updated**: [YYYY-MM-DD]
> **Target Release**: [version / sprint / milestone]

---

## 1. Summary

[2-3 sentences. What is this? Who is it for? What outcome does it drive?
Written for execs — they should understand scope and value without reading
further. Avoid jargon.]

---

## 2. Problem

### 2.1 User Problem

[The concrete pain the user experiences today. Anchor in evidence, not
hypothesis: user research, support tickets, analytics, sales signals.]

- Who is affected: [user persona / segment]
- How often: [frequency — daily? on a specific flow?]
- Current workaround: [what they do today, and why it's insufficient]

### 2.2 Business Problem

[Why this matters to the business. Revenue impact, retention, strategic bet,
competitive parity, compliance requirement.]

### 2.3 Evidence

- [Data point 1 — analytics metric, survey result, interview quote]
- [Data point 2 — ticket count, churn signal, sales loss reason]
- [Data point 3 — competitive analysis, market trend]

---

## 3. Goals & Non-Goals

### 3.1 Goals

What success looks like. Each goal must be measurable.

1. **[Goal 1]** — [Measurable target: e.g., "Reduce checkout abandonment from 32% to ≤22%"]
2. **[Goal 2]** — [Measurable target]
3. **[Goal 3]** — [Measurable target]

### 3.2 Non-Goals

Explicitly out of scope. Prevents scope creep and clarifies priorities.

- [Thing we are NOT doing, and why]
- [Adjacent problem we are punting on — link to future PRD if relevant]

---

## 4. Success Metrics

| Metric | Baseline | Target | Measurement Window | Source |
|--------|----------|--------|--------------------|--------|
| [Primary metric — e.g., "Activation rate"] | [X%] | [Y%] | [e.g., "30 days post-launch"] | [e.g., "Amplitude dashboard XYZ"] |
| [Secondary metric] | | | | |
| [Guardrail metric — what we don't want to regress] | | (no worse than -5%) | | |

**Counter-metrics to monitor**: [What could degrade if we ship this? e.g., "page load time", "support ticket volume"]

---

## 5. User Stories

### 5.1 Primary Persona

**[Persona name]**: [1-2 line description of role, context, and goals]

### 5.2 Stories

1. **As a** [persona], **I want to** [action], **so that** [outcome].
   - Acceptance criteria:
     - [ ] [Falsifiable observable condition]
     - [ ] [Falsifiable observable condition]

2. **As a** [persona], **I want to** [action], **so that** [outcome].
   - Acceptance criteria:
     - [ ] [Falsifiable observable condition]

3. **As a** [persona], **I want to** [action], **so that** [outcome].

---

## 6. Requirements

### 6.1 Functional Requirements

- **FR-1**: [System must support X when condition Y]
- **FR-2**: [System must expose Z via [channel]]
- **FR-3**: [...]

### 6.2 Non-Functional Requirements

- **Performance**: [e.g., "p95 latency < 300ms on checkout flow"]
- **Availability**: [e.g., "99.9% monthly uptime"]
- **Security / Compliance**: [e.g., "PII encrypted at rest, GDPR-compliant erasure"]
- **Accessibility**: [e.g., "WCAG 2.1 AA on all new UI"]
- **Internationalization**: [supported locales, RTL, etc.]

### 6.3 Constraints

- [Technical constraint — e.g., "must work on iOS 15+"]
- [Timeline constraint — e.g., "must ship before Q3 compliance deadline"]
- [Resource constraint — e.g., "team size = 2 FE + 1 BE"]

---

## 7. User Experience

### 7.1 Key Flows

[Bullet or diagram key user flows at a high level. Link to Figma / UX spec for
detailed screens — do NOT duplicate designs here.]

1. [Flow 1 name] → see `design/ux/[flow].md`
2. [Flow 2 name]

### 7.2 UX Principles

- [Principle 1 — e.g., "Minimize required input — prefill whenever possible"]
- [Principle 2]

### 7.3 Edge Cases

- [Edge case 1 — empty state, error, offline, slow network]
- [Edge case 2]

---

## 8. Scope & Phasing

### 8.1 MVP

What ships in the first release. Must deliver primary success metric.

- [Feature 1]
- [Feature 2]

### 8.2 Fast Follow

Next iteration, planned but not blocking MVP launch.

- [Feature 3]
- [Feature 4]

### 8.3 Future / Deferred

Known-wanted but outside current scope.

- [Feature 5] — deferred because [reason]

---

## 9. Dependencies

| Dependency | Owner | Status | Blocks |
|-----------|-------|--------|--------|
| [Service / API / team] | [owner] | [Ready / In progress / Blocked] | [What it blocks] |

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| [Risk 1] | [L/M/H] | [L/M/H] | [Mitigation plan] |
| [Risk 2] | | | |

---

## 11. Open Questions

Questions that need resolution before or during build. Assign owner and target date.

- [ ] [Question 1] — owner: [name] — decide by [date]
- [ ] [Question 2] — owner: [name] — decide by [date]

---

## 12. Launch Plan

- **Rollout**: [e.g., "10% → 50% → 100% over 2 weeks, gated by error rate"]
- **Feature flag**: [flag name, default state]
- **Monitoring**: [dashboards, alerts to watch]
- **Rollback criteria**: [specific condition that triggers rollback]
- **Comms**: [announcement plan — in-app, changelog, support docs, marketing]

---

## 13. Related Documents

- **Technical design**: [link to RFC or TDD]
- **UX spec**: [link to Figma + `design/ux/[spec].md`]
- **ADRs**: [list related ADRs]
- **Research**: [user research docs, competitive analysis]

---

## 14. Decision Log

Record significant decisions made during this PRD's lifecycle.

| Date | Decision | Rationale | Decider |
|------|----------|-----------|---------|
| [YYYY-MM-DD] | [What was decided] | [Why] | [Who] |

---

*Template: `.claude/docs/templates/prd.md`*
*Location when instantiated: `design/product/[feature-slug].md`*
