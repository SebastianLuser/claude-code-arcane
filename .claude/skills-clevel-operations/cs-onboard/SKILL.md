---
name: cs-onboard
description: "Founder onboarding interview that captures company context across 7 dimensions. Generates company-context.md used by all C-suite advisor skills."
category: "clevel-operations"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# C-Suite Onboarding

Structured founder interview that builds the company context file powering every C-suite advisor. One 45-minute conversation. Persistent context across all roles.

May I write to `~/.claude/company-context.md` after the interview?

## Commands

- `/cs:setup` — Full onboarding interview (~45 min, 7 dimensions)
- `/cs:update` — Quarterly refresh (~15 min, "what changed?")

## Conversation Principles

Be a conversation, not an interrogation. Ask one question at a time. Follow threads. Reflect back: "So the real issue sounds like X — is that right?" Watch for what they skip.

Open with: *"Tell me about the company in your own words — what are you building and why does it matter?"*

## 7 Interview Dimensions

### 1. Company Identity
What they do, who it's for, the real founding "why," one-sentence pitch, non-negotiable values. **Probe:** "What's a value you'd fire someone over violating?"

### 2. Stage & Scale
Headcount, revenue range, runway, stage (pre-PMF / scaling / optimizing). **Probe:** "If you had to label your stage?"

### 3. Founder Profile
Superpower, blind spots, archetype (product/sales/technical/operator). **Probe:** "What would your co-founder say you should stop doing?"

### 4. Team & Culture
Team in 3 words, last real conflict, real vs aspirational values. **Probe:** "Which of your stated values is most real?"

### 5. Market & Competition
Who's winning and why, real unfair advantage, competitive vulnerability. **Probe:** "What's your real unfair advantage — not the investor version?"

### 6. Current Challenges
Priority stack-rank, the decision they've been avoiding. **Probe:** "What's the decision you've been putting off?"

### 7. Goals & Ambition
12-month target, 36-month target, exit vs build-forever, personal success definition.

## Output

Generate `~/.claude/company-context.md` using `templates/company-context-template.md`. Fill every section. Write `[not captured]` for unknowns.

## /cs:update — Quarterly Refresh

Walk each dimension with "what changed?" — Duration: ~15 minutes.

## Resources
- `templates/company-context-template.md` — blank template for output
- `references/interview-guide.md` — deep interview craft, probes, red flags
