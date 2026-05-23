# AEO & GEO Patterns

Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) patterns for content that gets cited by AI search engines.

## Target Engines

| Engine | How It Cites | Key Signal |
|--------|-------------|-----------|
| Google AI Overviews | Inline attribution with link | Structured data, E-E-A-T |
| ChatGPT (Browse) | Footnote citations | Direct answers, authority |
| Perplexity | Numbered source citations | Factual density, freshness |
| Claude | Knowledge synthesis | Comprehensive coverage |
| Bing Copilot | Inline links | Schema markup, Bing index |
| Gemini | Carousel cards | Google entity graph |

## Content Patterns That Get Cited

### 1. Direct Answer Block
Place a concise, factual answer in the first 1-2 sentences after a heading. AI engines extract these as citation candidates.

```
## What is [topic]?

[Topic] is [direct definition in 1-2 sentences]. It works by [brief mechanism].
```

### 2. Statistic-Rich Paragraphs
Include specific numbers with sources. AI engines prefer citable facts over opinion.

```
According to [source], [metric] increased by [X]% in [year].
The average [thing] costs [$X] in [market], compared to [$Y] in [market].
```

### 3. Comparison Tables
Structured comparisons are heavily cited by AI for "vs" and "best" queries.

```markdown
| Feature | Option A | Option B | Option C |
|---------|----------|----------|----------|
| Price   | $X/mo    | $Y/mo    | $Z/mo    |
| Best for| [use]    | [use]    | [use]    |
```

### 4. Step-by-Step Instructions
Numbered steps with clear actions. AI engines surface these for "how to" queries.

```
1. **[Action verb]** — [specific instruction]
2. **[Action verb]** — [specific instruction]
```

### 5. Definition Lists
Term + definition pairs. AI engines love extracting these.

```
**[Term]**: [Concise definition under 30 words]
```

### 6. FAQ Blocks with Schema
Q&A pairs with FAQPage schema markup. Directly targeted by AI answer extraction.

```json
{
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is X?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "X is..."
    }
  }]
}
```

## Structural Requirements

### Page-Level
- **Title tag**: Include the question or topic explicitly
- **H1**: Match search intent directly
- **H2s**: Use question format for subtopics
- **Meta description**: Summarize the answer (not clickbait)
- **Schema markup**: Article, FAQPage, HowTo as appropriate
- **Last modified date**: Freshness signal for AI engines

### Content-Level
- **First paragraph**: Direct answer to the primary query
- **Fact density**: At least 1 citable fact per 150 words
- **Source attribution**: Link to primary sources for claims
- **Recency**: Include current year data where relevant
- **Comprehensiveness**: Cover the topic more thoroughly than competitors
- **Original data**: Surveys, case studies, proprietary metrics

## What NOT to Do

- **Thin listicles** — AI engines skip shallow content
- **Clickbait intros** — burying the answer hurts citation chance
- **Unsourced claims** — "studies show" without a link = ignored
- **Keyword stuffing** — AI engines understand semantics, not density
- **Gated content** — AI crawlers can't access paywalled content
- **Duplicate answers** — if 10 sites say the same thing, none get cited

## Measurement

Track AI citation presence:
1. Search your brand + key queries in ChatGPT, Perplexity, Google AI Overview
2. Monitor referral traffic from `chatgpt.com`, `perplexity.ai` in GA4
3. Check Google Search Console for "AI Overview" impression data
4. Track featured snippet ownership (precursor to AI citations)
