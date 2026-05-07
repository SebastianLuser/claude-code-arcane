---
name: competitor-alternatives
description: "Create competitor comparison and alternative pages for SEO and sales enablement — vs pages, alternative pages, and competitive landing pages."
category: "marketing-strategy"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Competitor & Alternative Pages

May I write competitor comparison and alternative pages? These pages rank for competitive search terms, provide genuine value to evaluators, and position your product effectively.

## Before Starting

If `.claude/product-marketing-context.md` exists, read it first. Gather: your product (value prop, differentiators, pricing, strengths/weaknesses), competitive landscape, and goals (SEO, sales enablement, conversion).

## Core Principles

1. **Honesty builds trust** — Acknowledge competitor strengths; be accurate about limitations
2. **Depth over surface** — Go beyond feature checklists; explain why differences matter
3. **Help them decide** — Be clear about who you're best for AND who competitor is best for
4. **Modular architecture** — Centralize competitor data; single source of truth per competitor

---

## Page Formats

| Format | Search Intent | URL Pattern |
|--------|--------------|-------------|
| [Competitor] Alternative | Active switcher | `/alternatives/[competitor]` |
| [Competitor] Alternatives | Early research | `/alternatives/[competitor]-alternatives` |
| You vs [Competitor] | Direct comparison | `/vs/[competitor]` |
| [A] vs [B] | Competitor terms capture | `/compare/[a]-vs-[b]` |

For detailed page structure per format, see [references/templates.md](references/templates.md).

---

## Essential Sections

Every comparison page should include: TL;DR summary, paragraph comparisons (not just tables), feature comparison by category, pricing comparison (tier-by-tier), who it's for, migration section.

For section templates and competitor data file format, see [references/templates.md](references/templates.md).

---

## Content Architecture

Centralize competitor data (positioning, pricing, features, strengths/weaknesses, migration notes) so updates propagate to all pages.

For data structure and examples, see [references/content-architecture.md](references/content-architecture.md).

---

## Research Process

1. **Product research** — Sign up, use it, document features/UX/limitations
2. **Pricing research** — Current pricing, hidden costs
3. **Review mining** — G2, Capterra, TrustRadius for praise/complaint themes
4. **Customer feedback** — Talk to switchers (both directions)
5. **Quarterly** pricing/feature refresh; **annual** full refresh

---

## SEO Considerations

| Format | Primary Keywords |
|--------|-----------------|
| Alternative (singular) | [Competitor] alternative |
| Alternatives (plural) | best [Competitor] alternatives |
| You vs Competitor | [You] vs [Competitor] |

Internal link between related competitor pages. Create hub page linking to all competitor content. Consider FAQ schema.

---

## Output Artifacts

| Artifact | Format |
|----------|--------|
| Competitor Intelligence File | YAML data file |
| Page Set Plan | Prioritized list with keywords |
| Alternative/Vs Page | Full page copy |
| Migration Guide | Reusable markdown block |

---

## Related Skills

- **seo-audit** — Validate SEO requirements before publishing
- **copywriting** — Narrative sections and CTAs
- **marketing-context** — Load positioning first
