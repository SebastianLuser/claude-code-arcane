---
name: contract-and-proposal-writer
description: "Generate professional, jurisdiction-aware business documents: freelance contracts, project proposals, SOWs, NDAs, and MSAs. Covers US (Delaware), EU (GDPR), UK, and DACH jurisdictions with Markdown output and docx conversion."
category: "business"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Contract & Proposal Writer

Generate professional, jurisdiction-aware business documents: freelance contracts, project proposals, SOWs, NDAs, and MSAs. Outputs structured Markdown with docx conversion instructions.

**Not a substitute for legal counsel.** Use these templates as strong starting points; review with an attorney for high-value or complex engagements.

> **Note:** This skill may create or modify files in your project. It will ask before writing.

## Core Capabilities

- Freelance development contracts (fixed-price & hourly)
- Project proposals with timeline/budget breakdown
- Statements of Work (SOW) with deliverables matrix
- NDAs (mutual & one-way)
- Master Service Agreements (MSA)
- Jurisdiction-specific clauses (US/EU/UK/DACH)
- GDPR Data Processing Addenda (EU/DACH)

## Key Clauses Reference

| Clause | Options |
|--------|---------|
| Payment terms | Net-30, milestone-based, monthly retainer |
| IP ownership | Work-for-hire (US), assignment (EU/UK), license-back |
| Liability cap | 1x contract value (standard), 3x (high-risk) |
| Termination | For cause (14-day cure), convenience (30/60/90-day notice) |
| Confidentiality | 2-5 year term, perpetual for trade secrets |
| Warranty | "As-is" disclaimer, limited 30/90-day fix warranty |
| Dispute resolution | Arbitration (AAA/ICC), courts (jurisdiction-specific) |

## When to Use

- Starting a new client engagement and need a contract fast
- Client asks for a proposal with pricing and timeline
- Partnership or vendor relationship requiring an MSA
- Protecting IP or confidential information with an NDA
- EU/DACH project requiring GDPR-compliant data clauses

## Workflow

### 1. Gather Requirements

Ask the user:

    1. Document type? (contract / proposal / SOW / NDA / MSA)
    2. Jurisdiction? (US-Delaware / EU / UK / DACH)
    3. Engagement type? (fixed-price / hourly / retainer)
    4. Parties? (names, roles, business addresses)
    5. Scope summary? (1-3 sentences)
    6. Total value or hourly rate?
    7. Start date / end date or duration?
    8. Special requirements? (IP assignment, white-label, subcontractors)

### 2. Select Template

| Type | Jurisdiction | Template |
|------|-------------|----------|
| Dev contract fixed | Any | Template A |
| Consulting retainer | Any | Template B |
| SaaS partnership | Any | Template C |
| NDA mutual | US/EU/UK/DACH | NDA-M |
| NDA one-way | US/EU/UK/DACH | NDA-OW |
| SOW | Any | SOW base |

### 3. Generate & Fill

Fill all [BRACKETED] placeholders. Flag missing data as "REQUIRED".

## Jurisdiction Notes

### US (Delaware)
- Governing law: State of Delaware
- Work-for-hire doctrine applies (Copyright Act 101)
- Arbitration: AAA Commercial Rules
- Non-compete: enforceable with reasonable scope/time

### EU (GDPR)
- Must include Data Processing Addendum if handling personal data
- IP assignment requires separate written deed in some member states
- Arbitration: ICC or local chamber

### UK (post-Brexit)
- Governed by English law
- IP: Patents Act 1977 / CDPA 1988
- Arbitration: LCIA Rules
- Data: UK GDPR (post-Brexit equivalent)

### DACH (Germany / Austria / Switzerland)
- BGB (Buergerliches Gesetzbuch) governs contracts
- Written form requirement for certain clauses (para 126 BGB)
- IP: Author always retains moral rights; must explicitly transfer Nutzungsrechte
- Non-competes: max 2 years, compensation required (para 74 HGB)
- Jurisdiction: German courts (Landgericht) or DIS arbitration
- DSGVO (GDPR implementation) mandatory for personal data processing

## Common Pitfalls

1. **Missing IP assignment language** -- "work for hire" alone is insufficient in EU; need explicit assignment of Nutzungsrechte in DACH
2. **Vague acceptance criteria** -- Always define what "accepted" means (written sign-off, X days to reject)
3. **No change order process** -- Scope creep kills fixed-price projects; add a clause for out-of-scope work
4. **Jurisdiction mismatch** -- Choosing Delaware law for a German-only project creates enforcement problems
5. **Missing limitation of liability** -- Without a cap, one bug could mean unlimited damages
6. **Oral amendments** -- Contracts modified verbally are hard to enforce; always require written amendments

## Best Practices

- Use **milestone payments** over net-30 for projects >$10K -- reduces cash flow risk
- For EU/DACH: always check if a DPA is needed (any personal data = yes)
- For DACH: include a **Schriftformklausel** (written form clause) explicitly
- Add a **force majeure** clause for anything over 3 months
- For retainers: define response time SLAs (e.g., 4h urgent / 24h normal)
- Keep templates in version control; track changes with `git diff`
- Review annually -- laws change, especially GDPR enforcement interpretations

## Contract Templates

> See references/contract-templates.md for full contract templates (fixed-price dev contract, consulting retainer, SaaS partnership, GDPR DPA) and docx conversion instructions.
