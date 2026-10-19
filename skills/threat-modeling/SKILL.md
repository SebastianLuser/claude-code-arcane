---
name: threat-modeling
description: "Threat model a system, service or feature before building it: data-flow diagram, trust boundaries, STRIDE per element, risk scoring, mitigations with owners. Model a design or review an existing model."
category: "security"
argument-hint: "[model | review] [system or feature]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Threat Modeling

Find what can go wrong while the design can still change. A threat model answers four questions: what are we building, what can go wrong, what do we do about it, and did we do a good job.

## Phase 1: Scope

| Mode | Does |
|---|---|
| `model` | Builds the threat model for a design or an existing system |
| `review` | Checks an existing model against the current code and gives a verdict |
| No arg | `model` |

Model when: a new service or public endpoint, a new third-party integration, auth or payment changes, new data classes (PII, minors' data, health, payments), or a trust boundary moves. Skip it for a change inside one component that crosses no boundary.

Read the design doc, ADRs, API specs, infra code and the existing `docs/security/` before asking. Ask only for what the files do not say: data classification and who the users are.

## Phase 2: Data-flow diagram

List the elements and draw them in Mermaid or ASCII:

| Element | Examples |
|---|---|
| **External entity** | User, admin, partner API, LLM provider |
| **Process** | API, worker, frontend, agent |
| **Data store** | Database, bucket, cache, queue, vector index |
| **Data flow** | Each arrow, with protocol and what data it carries |
| **Trust boundary** | Internet ↔ edge, edge ↔ internal, service ↔ database, tenant ↔ tenant, app ↔ third party |

Threats concentrate where flows cross a boundary. A diagram without boundaries is not ready.

## Phase 3: STRIDE per element

For each element and each flow that crosses a boundary, ask the questions that apply:

| Threat | Question | Typical controls |
|---|---|---|
| **S**poofing | Can someone pretend to be this user or service? | Strong auth, MFA, mTLS or signed tokens between services |
| **T**ampering | Can data be changed in transit or at rest? | TLS, signatures or HMAC, integrity checks, least-privilege writes |
| **R**epudiation | Can someone deny an action we need to prove? | Audit log with actor, time and object; append-only |
| **I**nformation disclosure | Can data reach someone who should not see it? | Authorization per object (IDOR), encryption, generic errors, no secrets in logs |
| **D**enial of service | Can it be made unavailable or expensive? | Rate limits, quotas, timeouts, budgets for paid APIs |
| **E**levation of privilege | Can someone gain rights they should not have? | Server-side authorization on every path, input validation, least privilege |

For LLM features also apply the OWASP LLM Top 10 (2025) from `/ai-security` (prompt injection, excessive agency, system prompt leakage, unbounded consumption).

## Phase 4: Score and treat

Score each threat: likelihood 1–5 × impact 1–5.

| Score | Treatment |
|---|---|
| 15–25 | Mitigate before release |
| 8–14 | Mitigate or accept with a written reason and an owner |
| 1–7 | Accept, or fix when cheap |

Treatment is one of: **mitigate** (name the control), **accept** (who and why), **transfer** (insurance, vendor contract) or **avoid** (drop the feature or the data). A threat with no owner is not treated.

## Phase 5: Write the model

Ask "May I write the threat model to `docs/security/threat-model-<system>.md`?" before writing. Contents:

1. Scope, date, version of the design it covers.
2. The diagram with trust boundaries.
3. Threat table: ID, element, STRIDE category, description, likelihood, impact, score, treatment, control, owner, status.
4. Assumptions (what we trust and why) and open questions.
5. Review triggers: the changes that make this model stale.

Turn every "mitigate before release" into a task or ticket, and link it from the table.

## Phase 6: Review (review mode)

Compare the model with the code: are the controls really there (`file:line`), did new flows or stores appear, did a boundary move?

| Verdict | When |
|---|---|
| **PASS** | The model matches the system, and every 15+ threat has its control in the code |
| **CONCERNS** | The model is stale in places, or 8–14 threats have no decision |
| **FAIL** | No model for a system that handles sensitive data, or a 15+ threat without a control |

## Next steps

- `/security-pen-testing` or `/owasp-top10-check` to test the controls.
- `/ai-security` for LLM-specific threats.
- `/supply-chain-security` for threats that come through dependencies and CI.
