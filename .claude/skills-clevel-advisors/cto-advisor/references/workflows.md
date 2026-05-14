# CTO Advisor Workflows

## Tech Debt Assessment Workflow

**Step 1 — Run the analyzer**
```bash
python scripts/tech_debt_analyzer.py --output report.json
```

**Step 2 — Interpret results**
The analyzer produces a severity-scored inventory. Review each item against:
- Severity (P0-P3): how much is it blocking velocity or creating risk?
- Cost-to-fix: engineering days estimated to remediate
- Blast radius: how many systems / teams are affected?

**Step 3 — Build a prioritized remediation plan**
Sort by: `(Severity x Blast Radius) / Cost-to-fix` — highest score = fix first.
Group items into: (a) immediate sprint, (b) next quarter, (c) tracked backlog.

**Step 4 — Validate before presenting to stakeholders**
- [ ] Every P0/P1 item has an owner and a target date
- [ ] Cost-to-fix estimates reviewed with the relevant tech lead
- [ ] Debt ratio calculated: maintenance work / total engineering capacity (target: < 25%)
- [ ] Remediation plan fits within capacity

**Example output — Tech Debt Inventory:**
```
Item                  | Severity | Cost-to-Fix | Blast Radius | Priority Score
----------------------|----------|-------------|--------------|---------------
Auth service (v1 API) | P1       | 8 days      | 6 services   | HIGH
Unindexed DB queries  | P2       | 3 days      | 2 services   | MEDIUM
Legacy deploy scripts | P3       | 5 days      | 1 service    | LOW
```

---

## ADR Creation Workflow

**Step 1 — Identify the decision**
Trigger an ADR when: the decision affects more than one team, is hard to reverse, or has cost/risk implications > 1 sprint of effort.

**Step 2 — Draft the ADR**
Use the template from `architecture_decision_records.md`:
```
Title: [Short noun phrase]
Status: Proposed | Accepted | Superseded
Context: What is the problem? What constraints exist?
Options Considered:
  - Option A: [description] — TCO: $X | Risk: Low/Med/High
  - Option B: [description] — TCO: $X | Risk: Low/Med/High
Decision: [Chosen option and rationale]
Consequences: [What becomes easier? What becomes harder?]
```

**Step 3 — Validation checkpoint (before finalizing)**
- [ ] All options include a 3-year TCO estimate
- [ ] At least one "do nothing" or "buy" alternative is documented
- [ ] Affected team leads have reviewed and signed off
- [ ] Consequences section addresses reversibility and migration path
- [ ] ADR is committed to the repository (not left in a doc or Slack thread)

**Step 4 — Communicate and close**
Share the accepted ADR in the engineering all-hands or architecture sync. Link it from the relevant service's README.

---

## Build vs Buy Analysis Workflow

**Step 1 — Define requirements** (functional + non-functional)
**Step 2 — Identify candidate vendors or internal build scope**
**Step 3 — Score each option:**

```
Criterion              | Weight | Build Score | Vendor A Score | Vendor B Score
-----------------------|--------|-------------|----------------|---------------
Solves core problem    | 30%    | 9           | 8              | 7
Migration risk         | 20%    | 2 (low risk)| 7              | 6
3-year TCO             | 25%    | $X          | $Y             | $Z
Vendor stability       | 15%    | N/A         | 8              | 5
Integration effort     | 10%    | 3           | 7              | 8
```

**Step 4 — Default rule:** Buy unless it is core IP or no vendor meets >= 70% of requirements.
**Step 5 — Document the decision as an ADR** (see ADR workflow above).
