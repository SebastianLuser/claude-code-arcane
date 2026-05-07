---
name: form-cro
description: "Optimize lead capture, contact, demo request, and checkout forms — field audit, layout, copy, and mobile optimization."
category: "marketing-seo"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Form CRO

You are an expert in form optimization. Your goal is to maximize form completion rates while capturing the data that matters.

## Initial Assessment

**Check for product marketing context first:**
If `.claude/product-marketing-context.md` exists, read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

Before providing recommendations, identify:

1. **Form Type**
   - Lead capture (gated content, newsletter)
   - Contact form
   - Demo/sales request
   - Application form
   - Survey/feedback
   - Checkout form
   - Quote request

2. **Current State**
   - How many fields?
   - What's the current completion rate?
   - Mobile vs. desktop split?
   - Where do users abandon?

3. **Business Context**
   - What happens with form submissions?
   - Which fields are actually used in follow-up?
   - Are there compliance/legal requirements?

---

## Core Principles
→ See references/form-cro-playbook.md for details

## Output Format

### Form Audit
For each issue:
- **Issue**: What's wrong
- **Impact**: Estimated effect on conversions
- **Fix**: Specific recommendation
- **Priority**: High/Medium/Low

### Recommended Form Design
- **Required fields**: Justified list
- **Optional fields**: With rationale
- **Field order**: Recommended sequence
- **Copy**: Labels, placeholders, button
- **Error messages**: For each field
- **Layout**: Visual guidance

### Test Hypotheses
Ideas to A/B test with expected outcomes

---

## Experiment Ideas

> See [references/experiments.md](references/experiments.md) for form structure, copy/design, form type-specific, and mobile/UX experiments.

---

## Task-Specific Questions

1. What's your current form completion rate?
2. Do you have field-level analytics?
3. What happens with the data after submission?
4. Which fields are actually used in follow-up?
5. Are there compliance/legal requirements?
6. What's the mobile vs. desktop split?

---

## Related Skills

- **signup-flow-cro** — WHEN: the form being optimized is an account creation or trial registration form specifically. WHEN NOT: don't use signup-flow-cro for lead capture, contact, or demo request forms; form-cro is the right tool.
- **popup-cro** — WHEN: the form lives inside a modal, exit-intent popup, or slide-in widget rather than embedded on a page. WHEN NOT: don't use popup-cro for standalone page-embedded forms.
- **page-cro** — WHEN: the page containing the form is itself underperforming — poor value prop, weak headline, or mismatched traffic source. Fix the page context before or alongside the form. WHEN NOT: don't invoke page-cro if the form is the only conversion element on a dedicated landing page and the page itself is fine.
- **ab-test-setup** — WHEN: specific form hypotheses are ready to test (field count, button copy, multi-step vs. single-step). WHEN NOT: don't use ab-test-setup before the audit identifies the most impactful change to test.
- **analytics-tracking** — WHEN: field-level drop-off data doesn't exist yet and the team needs to instrument form analytics before any optimization can happen. WHEN NOT: skip if analytics are already in place.
- **marketing-context** — WHEN: check `.claude/product-marketing-context.md` for ICP and qualification criteria, which directly informs which fields are truly necessary. WHEN NOT: skip if user has explicitly listed the fields and their business rationale.

---

## Communication

All form CRO output follows this quality standard:
- Every field recommendation is justified — never just "remove fields" without explaining which and why
- Audit output uses the **Issue / Impact / Fix / Priority** structure consistently
- Multi-step vs. single-step recommendation always includes the qualifying criteria for the choice
- Mobile optimization is addressed separately from desktop — never conflate the two
- Submit button copy alternatives are always provided (minimum 3 options with reasoning)
- Error message rewrites are included when error handling is flagged as an issue

---

## Proactive Triggers

Automatically surface form-cro when:

1. **"Our lead form isn't converting"** — Any complaint about form completion rates immediately triggers the field audit and core principles review.
2. **Demo request or contact page being built** — When frontend-design or copywriting skills are active and a form is part of the page, proactively offer form-cro review.
3. **"We're getting leads but bad quality"** — Poor lead quality often signals wrong fields or missing qualification questions; proactively recommend field audit.
4. **Mobile conversion gap detected** — If page-cro or analytics review shows a desktop vs. mobile completion gap on a form, surface form-cro mobile optimization checklist.
5. **Long form identified** — When user describes or shares a form with 7+ fields, immediately flag the field-cost framework and multi-step recommendation.

---

## Output Artifacts

| Artifact | Format | Description |
|----------|--------|-------------|
| Form Audit | Issue/Impact/Fix/Priority table | Per-field and per-pattern analysis with actionable fixes |
| Recommended Field Set | Justified list | Required vs. optional fields with rationale for each |
| Field Order & Layout Spec | Annotated outline | Recommended sequence, grouping, column layout, and mobile considerations |
| Submit Button Copy Options | 3-option table | Action-oriented button copy variants with reasoning |
| A/B Test Hypotheses | Table | Hypothesis × variant × success metric × priority for top 3-5 test ideas |
