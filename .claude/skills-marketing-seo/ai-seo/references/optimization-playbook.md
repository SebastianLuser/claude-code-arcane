# Content Optimization for AI Citability

## The Content Patterns That Get Cited

These are the block types AI systems reliably extract. Add at least 2-3 per key page.

See also `content-patterns.md` for ready-to-use templates for each pattern.

### Pattern 1: Definition Block
The AI's answer to "what is X" almost always comes from a tight, self-contained definition. Format:

> **[Term]** is [concise definition in 1-2 sentences]. [One sentence of context or why it matters].

Placed within the first 300 words of the page. No hedging, no preamble. Just the definition.

### Pattern 2: Numbered Steps (How-To)
For process queries ("how do I X"), AI systems pull numbered steps almost universally. Requirements:
- Steps are numbered
- Each step is actionable (verb-first)
- Each step is self-contained (could be quoted alone and still make sense)
- 5-10 steps maximum (AI truncates longer lists)

### Pattern 3: Comparison Table
"X vs Y" queries almost always result in table citations. Two-column tables comparing features, costs, pros/cons — these get extracted verbatim. Format matters: clean markdown table with headers wins.

### Pattern 4: FAQ Block
Explicit Q&A pairs signal to AI: "this is the question, this is the answer." Mark up with FAQPage schema. Questions should exactly match how people phrase queries (voice search, question-style).

### Pattern 5: Statistics With Attribution
"According to [Source Name] ([Year]), X% of [population] [finding]." This format is extractable because it has a complete citation. Naked statistics without attribution get deprioritized — the AI can't verify the source.

### Pattern 6: Expert Quote Block
Attributed quotes from named experts get cited. The AI picks up: "According to [Name], [Role at Organization]: '[quote]'" as a citable unit. Build in a few of these per key piece.

## Rewriting for Extractability

When optimizing existing content:

1. **Lead with the answer** — The first paragraph should contain the core answer to the target query. Don't save it for the conclusion.
2. **Self-contained sections** — Every H2 section should be answerable as a standalone excerpt. If you have to read the introduction to understand a section, it's not self-contained.
3. **Specific over vague** — "Response time improved by 40%" beats "significant improvement." AI systems prefer citable specifics.
4. **Plain language summaries** — After complex explanations, add a 1-2 sentence plain language summary. This is what AI often lifts.
5. **Named sources** — Replace "experts say" with "[Researcher Name], [Year]." Replace "studies show" with "[Organization] found in their [Year] survey."

## Schema Markup for AI Discoverability

Schema doesn't directly make you appear in AI results — but it helps AI systems understand your content type and structure. Priority schemas:

| Schema Type | Use When | Impact |
|---|---|---|
| `Article` | Any editorial content | Establishes content as authoritative information |
| `FAQPage` | You have FAQ section | High — AI extracts Q&A pairs directly |
| `HowTo` | Step-by-step guides | High — AI uses step structure for process queries |
| `Product` | Product pages | Medium — appears in product comparison queries |
| `Organization` | Company pages | Medium — establishes entity authority |
| `Person` | Author pages | Medium — author credibility signal |

Implement via JSON-LD in the page `<head>`. Validate at schema.org/validator.
