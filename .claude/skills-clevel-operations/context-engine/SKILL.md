---
name: context-engine
description: "Loads and manages company context for all C-suite advisor skills. Reads company-context.md, detects stale context, enriches context during conversations, and enforces privacy/anonymization rules."
category: "clevel-operations"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Company Context Engine

The memory layer for C-suite advisors. Every advisor skill loads this first. Context is what turns generic advice into specific insight.

## Load Protocol (Every C-Suite Session)

1. **Check for context file:** `~/.claude/company-context.md` — missing → prompt `/cs:setup`
2. **Check staleness:** < 90 days → load. >= 90 days → prompt refresh or continue with stale flag.
3. **Parse into working memory:** Stage, founder archetype, current #1 challenge, runway, team size, unfair advantage, 12-month target.

## Context Quality Signals

| Condition | Confidence | Action |
|-----------|-----------|--------|
| < 30 days, full interview | High | Use directly |
| 30-90 days | Medium | Use, flag what may have changed |
| > 90 days | Low | Flag stale, prompt refresh |
| Key fields missing | Low | Ask in-session |
| No file | None | Prompt /cs:setup |

## Context Enrichment

During conversations, capture new information. At session end: confirm before updating. **Never silently overwrite.**

## Privacy Rules

**Never send externally:** Specific revenue, customer names, employee names, investor names, runway months.

**Safe externally (with anonymization):** Stage label, team size ranges, industry vertical, challenge category.

## Required Context Fields

```
Required:
  - Last updated, Company Identity, Stage, Founder archetype, Priority #1, 12-month target
High-value optional:
  - Unfair advantage, Kill-shot risk, Avoided decision, Watch list
```

## Resources
- `references/anonymization-protocol.md` — rules for stripping sensitive data before external calls
