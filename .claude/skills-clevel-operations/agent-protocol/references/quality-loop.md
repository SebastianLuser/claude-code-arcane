# Internal Quality Loop

No role presents to the founder without passing through this verification loop. The founder sees polished, verified output — not first drafts.

## Step 1: Self-Verification (every role, every time)

Before presenting, every role runs this internal checklist:

```
SELF-VERIFY CHECKLIST:
□ Source Attribution — Where did each data point come from?
  ✅ "ARR is $2.1M (from CRO pipeline report, Q4 actuals)"
  ❌ "ARR is around $2M" (no source, vague)

□ Assumption Audit — What am I assuming vs what I verified?
  Tag every assumption: [VERIFIED: checked against data] or [ASSUMED: not verified]
  If >50% of findings are ASSUMED → flag low confidence

□ Confidence Score — How sure am I on each finding?
  🟢 High: verified data, established pattern, multiple sources
  🟡 Medium: single source, reasonable inference, some uncertainty
  🔴 Low: assumption-based, limited data, first-time analysis

□ Contradiction Check — Does this conflict with known context?
  Check against company-context.md and recent decisions in decision-log
  If it contradicts a past decision → flag explicitly

□ "So What?" Test — Does every finding have a business consequence?
  If you can't answer "so what?" in one sentence → cut it
```

## Step 2: Peer Verification (cross-functional validation)

When a recommendation impacts another role's domain, that role validates BEFORE presenting.

| If your recommendation involves... | Validate with... | They check... |
|-------------------------------------|-------------------|---------------|
| Financial numbers or budget | CFO | Math, runway impact, budget reality |
| Revenue projections | CRO | Pipeline backing, historical accuracy |
| Headcount or hiring | CHRO | Market reality, comp feasibility, timeline |
| Technical feasibility or timeline | CTO | Engineering capacity, technical debt load |
| Operational process changes | COO | Capacity, dependencies, scaling impact |
| Customer-facing changes | CRO + CPO | Churn risk, product roadmap conflict |
| Security or compliance claims | CISO | Actual posture, regulation requirements |
| Market or positioning claims | CMO | Data backing, competitive reality |

**Peer validation format:**
```
[PEER-VERIFY:cfo]
Validated: ✅ Burn rate calculation correct
Adjusted: ⚠️ Hiring timeline should be Q3 not Q2 (budget constraint)
Flagged: 🔴 Missing equity cost in total comp projection
[/PEER-VERIFY]
```

**Skip peer verification when:**
- Single-domain question with no cross-functional impact
- Time-sensitive proactive alert (send alert, verify after)
- Founder explicitly asked for a quick take

## Step 3: Critic Pre-Screen (high-stakes decisions only)

For decisions that are **irreversible, high-cost, or bet-the-company**, the Executive Mentor pre-screens before the founder sees it.

**Triggers for pre-screen:**
- Involves spending > 20% of remaining runway
- Affects >30% of the team (layoffs, reorg)
- Changes company strategy or direction
- Involves external commitments (fundraising terms, partnerships, M&A)
- Any recommendation where all roles agree (suspicious consensus)

**Pre-screen output:**
```
[CRITIC-SCREEN]
Weakest point: [The single biggest vulnerability in this recommendation]
Missing perspective: [What nobody considered]
If wrong, the cost is: [Quantified downside]
Proceed: ✅ With noted risks | ⚠️ After addressing [specific gap] | 🔴 Rethink
[/CRITIC-SCREEN]
```

## Step 4: Course Correction (after founder feedback)

The loop doesn't end at delivery. After the founder responds:

```
FOUNDER FEEDBACK LOOP:
1. Founder approves → log decision (Layer 2), assign actions
2. Founder modifies → update analysis with corrections, re-verify changed parts
3. Founder rejects → log rejection with DO_NOT_RESURFACE, understand WHY
4. Founder asks follow-up → deepen analysis on specific point, re-verify

POST-DECISION REVIEW (30/60/90 days):
- Was the recommendation correct?
- What did we miss?
- Update company-context.md with what we learned
- If wrong → document the lesson, adjust future analysis
```

## Verification Level by Stakes

| Stakes | Self-Verify | Peer-Verify | Critic Pre-Screen |
|--------|-------------|-------------|-------------------|
| Low (informational) | ✅ Required | ❌ Skip | ❌ Skip |
| Medium (operational) | ✅ Required | ✅ Required | ❌ Skip |
| High (strategic) | ✅ Required | ✅ Required | ✅ Required |
| Critical (irreversible) | ✅ Required | ✅ Required | ✅ Required + board meeting |

## Verified Output Format

The verified output adds confidence and source information:

```
BOTTOM LINE
[Answer] — Confidence: 🟢 High

WHAT
• [Finding 1] [VERIFIED: Q4 actuals] 🟢
• [Finding 2] [VERIFIED: CRO pipeline data] 🟢  
• [Finding 3] [ASSUMED: based on industry benchmarks] 🟡

PEER-VERIFIED BY: CFO (math ✅), CTO (timeline ⚠️ adjusted to Q3)
```
