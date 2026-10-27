---
name: user-persona
description: "Generate user personas, JTBD, pain points, and empathy maps. Output to Notion/Coda for product alignment."
category: "documentation"
argument-hint: "[product or feature name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Task, AskUserQuestion
---
# user-persona — User Persona & JTBD Generator

Generates documented personas, JTBD, empathy maps and pain/gain analysis for Educabot products (Alizia, Tuni, Vigia, Tich).

## When to use / NOT use

| Use | Do NOT use |
|------|---------|
| New product/vertical with no defined target | A validated, current persona exists (refine it, do not recreate it) |
| Large feature that needs deep empathy | Internal stakeholders (separate stakeholder map) |
| PRD without a clear persona (hand-in with `/product-spec`) | Bugs or technical issues |
| Re-assessment of the existing ICP | |
| Onboarding new PMs/designers | |

## Philosophy

A useful persona: based on real data (interviews, analytics, surveys), actionable (decides what to do/not do), memorable (the team references it). A bad persona: irrelevant demographics, copy-pasted from a competitor, 15 personas nobody remembers.

## Questions first

1. **Product:** Alizia / Tuni / Vigia / Tich / new
2. **Primary or secondary?**
3. **Existing research?** (interviews, surveys, analytics, NPS)
4. **How many:** 1-3 recommended, max 5
5. **Educational context:** Primary / Secondary / University / Adults / Formal / Non-formal

## Workflow

### Step 1 — Gather evidence
Ask for inputs: links to interviews (Notion/recordings), analytics exports (Mixpanel/GA), recurring support tickets, CRM/Hubspot data, competitor research. No data -> propose a discovery plan: 5-7 interviews, a survey with 50+ responses, 2 weeks minimum.

### Step 2 — Segment
Key dimensions: role (teacher/student/principal/parent), education level, institution type (public/private/mixed), tech-savviness (low/mid/high), usage context (classroom/remote/hybrid).

### Step 3 — Write the persona

> → Read references/persona-template.md for full persona template sections, anti-persona template, and JTBD canvas

### Step 4 — Validate
Research/Data team reviews -> PM + Design approve -> iterate if it does not resonate.

### Step 5 — Publish
Notion/Coda (persona hub) -> link from PRDs and Figma -> optional printables.

## Rules of thumb

- Max 3-5 personas per product; 1 primary, max 2 secondary
- Refresh every 6-12 months or after a big change
- No interview -> mark it as a hypothesis
- Every feature must map to a persona
- "But Flor wouldn't do that" in meetings = a sign that it works

## Delegation

- `/product-spec` — PRD that uses the persona
- `/meeting-to-tasks` — turn interviews into insights
