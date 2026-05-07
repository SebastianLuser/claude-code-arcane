---
name: postmortem
description: "Honest post-mortem analysis sub-skill. Rigorous investigation of system failures using 5 Whys, root cause vs contributing factors, and owned change registers."
category: "clevel-advisors"
user-invocable: false
allowed-tools: Read, Glob, Grep, Bash
---

# /em:postmortem — Honest Analysis of What Went Wrong

**Command:** `/em:postmortem <event>`

Not blame. Understanding. The failed deal, the missed quarter, the feature that flopped. What actually happened, why, and what changes as a result.

## Why Most Post-Mortems Fail

**The blame session** — someone gets scapegoated, actual causes don't get examined, same problem recurs.

**The whitewash** — "We learned a lot, here are 12 vague action items." Nothing changes.

A real post-mortem is a rigorous investigation into a system failure. Not "whose fault" but "what conditions made this outcome predictable in hindsight?"

## The Framework

### Step 1: Define the Event Precisely
Expected outcome vs actual outcome. When was the gap first visible? Quantified impact.

### Step 2: The 5 Whys — Done Properly
Get from the symptom to the root cause. **Test for a good root cause:** Could you prevent recurrence with a specific, concrete change?

### Step 3: Distinguish Contributing Factors from Root Cause
Contributing factors made it worse but aren't the core reason. Fix only contributing factors and you'll have a structurally identical failure next time.

### Step 4: Identify Warning Signs That Were Ignored
At what point was the negative outcome predictable? Who saw it? Why wasn't it acted on?

### Step 5: In Control vs. Out of Control
For things in control: what specifically needs to change? For things out of control: how to be more resilient?

### Step 6: Build the Change Register
**Bad action items:** "We'll improve our qualification process"
**Good action items:** "Ravi owns rewriting qualification criteria by March 15 to include champion identification as hard requirement."

For each action: What exactly changes? Who owns it? By when? How to verify it worked?

### Step 7: Verification Date
Set a date to check whether changes actually happened and worked. Without this, post-mortems are theater.

## Post-Mortem Output Format

```
EVENT: [Name and date]
EXPECTED: [What was supposed to happen]
ACTUAL: [What happened]
IMPACT: [Quantified]

TIMELINE
[Date]: [What happened or was visible]

5 WHYS
1. [Why?] → Because [Y]
2-5. [chain to ROOT CAUSE]

ROOT CAUSE: [One clear sentence]
CONTRIBUTING FACTORS: [with how they contributed]
WARNING SIGNS MISSED: [signal + why not acted on]

CHANGE REGISTER
| Action | Owner | Due Date | Verification |
|--------|-------|----------|-------------|

VERIFICATION DATE: [Date of check-in]
```

## The Tone of Good Post-Mortems

"The salesperson didn't qualify the deal properly" is blame. "Our qualification framework hadn't been updated when we moved upmarket, and no one owned keeping it current" is understanding. The second version builds a more resilient organization.
