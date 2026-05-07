---
name: challenge
description: "Pre-mortem plan analysis sub-skill. Systematically finds weaknesses in any plan before reality does — extracts assumptions, rates confidence, maps dependencies."
category: "clevel-advisors"
user-invocable: false
allowed-tools: Read, Glob, Grep, Bash
---

# /em:challenge — Pre-Mortem Plan Analysis

**Command:** `/em:challenge <plan>`

Systematically finds weaknesses in any plan before reality does. Not to kill the plan — to make it survive contact with reality.

## The Core Idea

Most plans fail for predictable reasons. Not bad luck — bad assumptions. The pre-mortem technique: **imagine it's 12 months from now and this plan failed spectacularly. Now work backwards. Why?**

## The Challenge Framework

### Step 1: Extract Core Assumptions
For each section of the plan, ask: What has to be true for this to work?

**Common assumption categories:** Market (size, growth, willingness to pay), Execution (team capacity, velocity), Customer (they have the problem, they'll pay), Competitive (incumbents won't respond), Financial (burn rate, revenue timing), Dependencies (partner will deliver).

### Step 2: Rate Each Assumption
- **Confidence:** High (verified with data) / Medium (directionally right) / Low (untested) / Unknown
- **Impact if wrong:** Critical (plan fails) / High (major delay) / Medium (significant rework) / Low (manageable)

### Step 3: Map Vulnerabilities
**Vulnerability = Low confidence + High impact.** These are the bets you're making.

### Step 4: Find the Dependency Chain
Does assumption B depend on A being true first? What's the critical path with zero slack?

### Step 5: Test the Reversibility
For each critical vulnerability: if wrong at month 3, can you pivot? Is money already spent? Commitments made?

## Output Format

```
CORE ASSUMPTIONS (extracted)
1. [Assumption] — Confidence: [H/M/L/?] — Impact if wrong: [Critical/High/Medium/Low]

VULNERABILITY MAP
Critical risks (act before proceeding):
• [#N] [Assumption] — WHY it might be wrong — WHAT breaks if it is

DEPENDENCY CHAIN
[Assumption A] → depends on → [Assumption B] → which enables → [Assumption C]
Weakest link: [X]

REVERSIBILITY ASSESSMENT
• Reversible bets: [list]
• Irreversible commitments: [list — treat with extreme care]

KILL SWITCHES
• Continue if: ...
• Kill/pivot if: ...

HARDENING ACTIONS
1. [Specific validation to do before proceeding]
2. [Alternative approach to consider]
3. [Contingency to build into the plan]
```

## Challenge Patterns by Plan Type

**Product Roadmap:** Does the velocity estimate account for real team capacity? What if the anchor feature takes 3x longer?

**Go-to-Market:** What's the actual ICP conversion rate, not the hoped-for one? Is "land and expand" a real motion or a hope?

**Hiring Plan:** What happens if the key hire takes 4 months to find? Does the plan account for ramp time?

**Fundraising Plan:** Have you modeled the timeline if it takes 6 months, not 3? What assumptions break if you raise 50% of target?

## Deliverable

The output is not permission to stop. It's a vulnerability map. Unknown risks are dangerous. Known risks are manageable.
