---
name: incident
description: "Generate structured incident post-mortem (timeline, root cause, impact, action items) and create Jira follow-up ticket."
category: "operations"
argument-hint: "[incident-title or ticket-id]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Incident Post-Mortem Generator

Generates a structured post-mortem report and creates follow-up tickets.

## Input

The user describes the incident. Optional argument: `$ARGUMENTS`

If they do not give enough info, ask:
1. What happened?
2. When did it start and when was it resolved?
3. Which systems were affected?
4. How was it detected? (alert, user, chance)
5. How was it resolved?
6. Which project? (to create tickets in Jira)

## Process

### 1. Gather context

If we are in a git repo:
```bash
# Recent commits (possible cause)
git log --oneline --since="24 hours ago"

# Recent deploys
gh run list --limit 5
```

### 2. Generate the post-mortem

```markdown
# Post-Mortem: [Incident title]
**Date:** [incident date]
**Severity:** [SEV1-critical / SEV2-high / SEV3-medium / SEV4-low]
**Duration:** [X hours/minutes]
**Author:** [who writes it]

## Summary
[2-3 sentences: what happened, what impact it had, how it was resolved]

## Timeline
| Time | Event |
|------|--------|
| HH:MM | The problem is detected via [method] |
| HH:MM | The cause is identified |
| HH:MM | The fix is applied |
| HH:MM | Resolution is confirmed |

## Impact
- **Affected users:** [N / all / segment]
- **Affected functionality:** [what stopped working]
- **Data lost:** [yes/no, detail]
- **SLA/SLO impacted:** [if applicable]

<!-- Only if the incident involves an LLM feature -->
## AI feature
- **Class:** [availability / quality / safety / data exposure / cost]
- **Versions:** model [id], prompt [version], retrieval index [build date]
- **Evals:** score before vs. during the incident (`/llm-evals`)
- **Extra cost:** [USD and tokens above baseline]
- **Why no guardrail stopped it:** [which control was missing or failed]

## Root Cause
[Technical explanation of the root cause. Be specific: file, line, configuration, etc.]

## Resolution
[What was done to resolve it. Include commits, PRs, config changes.]

## Contributing factors
- [Factor 1: why it was not detected earlier]
- [Factor 2: why the blast radius was so large]
- [Factor 3: what was missing in monitoring/alerts]

## Lessons learned
### What went well
- [Something that worked correctly in the response]

### What went wrong
- [Something that made the situation worse or delayed the resolution]

## Action Items
| # | Action | Priority | Owner | Ticket |
|---|--------|-----------|-------|--------|
| 1 | [Permanent fix] | HIGH | [who] | [PROJ-XXX] |
| 2 | [Improve monitoring] | MEDIUM | [who] | [PROJ-XXX] |
| 3 | [Add a test] | MEDIUM | [who] | [PROJ-XXX] |
| 4 | [Document a runbook] | LOW | [who] | [PROJ-XXX] |
```

### 3. Create tickets in Jira (if the user wants)

For each action item, create a ticket of issue type "Task" using the jira-tickets skill:
- Summary: "[POST-MORTEM] Action item description"
- Priority: according to the action item's priority
- Labels: ["post-mortem", "incident"]

### 4. Save

Save to `docs/incidents/[date]-[title-slug].md`

For the ongoing response (containment, playbooks and notices to users or customers), see `/incident-response`.

## Rules
- No personal blame — the post-mortem is about the system, not the people
- Be specific about the root cause (not "human error" — what allowed the error to get through)
- Every action item must be actionable and have an owner
- Write it in the user's language
- If the incident is ongoing → focus on resolution, post-mortem afterwards
