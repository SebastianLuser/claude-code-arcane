---
name: internal-narrative
description: "Build and maintain one coherent company story across all audiences. Detects narrative contradictions and ensures the same truth is framed for each audience's needs."
category: "clevel-operations"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Internal Narrative Builder

One company. Many audiences. Same truth — different lenses. Narrative inconsistency is trust erosion.

## Core Principle

**The same fact lands differently depending on who hears it and what they need.** Same fact, four different narratives needed. The skill is maintaining truth while serving each audience's actual question.

## Framework

### Step 1: Build the Core Narrative
One paragraph that every other communication derives from. This is the source of truth.

### Step 2: Audience Translation Matrix
Same truth, different frame for: employees, investors, customers, candidates. **Rule:** Never contradict yourself across audiences.

### Step 3: Contradiction Detection
Before any major communication: What did we tell investors? What did we tell employees? Are these consistent?

### Step 4: Communication Cadence

| Audience | Format | Frequency | Owner |
|----------|--------|-----------|-------|
| Employees | All-hands | Monthly | CEO |
| Investors | Written update | Monthly | CEO + CFO |
| Board | Board meeting + memo | Quarterly | CEO |
| Customers | Product updates | Per release | CPO / CS |
| Candidates | Careers page + interview narrative | Ongoing | CHRO |

### Step 5: All-Hands Structure
Lead with honest state of the company. Connect performance to individual work. Leave time for real Q&A. See `templates/all-hands-template.md`.

### Step 6: Crisis Communication
**The 4-hour rule:** Employees should never learn about company news from Twitter. Internal first, then external if needed. See `references/narrative-frameworks.md`.

## Key Questions

- "What do we tell investors about our strategy? What do we tell employees? Are these the same?"
- "If a journalist asked our team members independently, what would they say?"
- "What's the hardest question from each audience? Do we have an honest answer?"

## Red Flags

- Different departments describe the company mission differently
- Investor narrative emphasizes growth; employee narrative emphasizes stability
- Bad news reaches employees through Slack rumors before leadership communication
- Careers page describes a culture that employees don't recognize

## Integration with Other C-Suite Roles

| When... | Work with... | To... |
|---------|-------------|-------|
| Investor update prep | CFO | Align financial narrative with company narrative |
| Reorg or leadership change | CHRO + CEO | Sequence: employees first, then external |
| Crisis | All C-suite | Single voice, consistent story, internal first |

## Resources
- `references/narrative-frameworks.md` — Storytelling structures, founder narrative, bad news delivery
- `templates/all-hands-template.md` — All-hands presentation template
