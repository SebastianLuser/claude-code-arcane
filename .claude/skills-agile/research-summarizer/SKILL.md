---
name: research-summarizer
description: "Structured research summarization: turns dense papers, articles, and reports into actionable briefs with key findings, comparative analyses, and properly formatted citations."
category: "agile"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Research Summarizer

Structured research summarization workflow that turns dense source material into actionable briefs. Built for product managers, analysts, founders, and anyone who reads more than they should have to.

## When This Skill Activates

- "Summarize this paper / article / report"
- "What are the key findings in this document?"
- "Compare these sources"
- "Extract citations from this PDF"
- "Give me a research brief on [topic]"
- Any request involving: summarize, research brief, literature review, citation, source comparison

## Workflow

### Single Source Summary

1. **Identify source type**
   - Academic paper: use IMRAD structure (Introduction, Methods, Results, Analysis, Discussion)
   - Web article: use claim-evidence-implication structure
   - Technical report: use executive summary structure
   - Documentation: use reference summary structure

2. **Extract structured brief**: Title, Author(s), Date, Source Type, Key Thesis, Key Findings (with evidence), Methodology, Limitations, Actionable Takeaways, Notable Quotes.

3. **Assess quality**: Source credibility, evidence strength, recency, bias indicators.

### Multi-Source Comparison

1. Collect sources (2-5 documents)
2. Summarize each using the single-source workflow
3. Build comparison matrix (Central Thesis, Methodology, Key Finding, Sample/Scope, Credibility)
4. Synthesize: convergent findings, divergent findings, gaps, weight of evidence
5. Produce synthesis brief: Consensus Findings, Contested Points, Gaps, Recommendation

### Citation Extraction

1. Scan document for all references, footnotes, in-text citations
2. Extract and format using requested style (APA 7 default)
3. Classify: primary, secondary, tertiary sources
4. Output sorted bibliography with classification tags

Supported formats: **APA 7**, **IEEE**, **Chicago**, **Harvard**, **MLA 9**

## Tooling

### `scripts/extract_citations.py`

```bash
python3 scripts/extract_citations.py document.txt                       # APA default
python3 scripts/extract_citations.py document.txt --format ieee         # IEEE format
python3 scripts/extract_citations.py document.txt --format apa --output json  # JSON
cat paper.txt | python3 scripts/extract_citations.py --stdin            # From stdin
```

### `scripts/format_summary.py`

```bash
python3 scripts/format_summary.py --template academic                   # Academic template
python3 scripts/format_summary.py --template executive --length brief   # Brief executive
python3 scripts/format_summary.py --list-templates                      # List all templates
python3 scripts/format_summary.py --template article --output json      # JSON output
```

## Quality Assessment Framework

| Dimension | High | Medium | Low |
|-----------|------|--------|-----|
| **Credibility** | Peer-reviewed, established author | Reputable outlet, known author | Blog, unknown author |
| **Evidence** | Large sample, rigorous method | Moderate data, sound approach | Anecdotal, no data |
| **Recency** | Within 2 years | 2-5 years old | 5+ years, may be outdated |
| **Objectivity** | No conflicts, balanced view | Minor affiliations disclosed | Funded by interested party |

**Overall**: 4 Highs = strong source; 2+ Mediums = adequate with caveats; 2+ Lows = verify independently.

> See `references/summary-templates.md` for full template library and `references/citation-formats.md` for formatting rules.

## Proactive Triggers

- **Source has no date**: Note it. Undated sources lose credibility points.
- **Source contradicts others**: Highlight the contradiction explicitly.
- **Source behind paywall**: Note limited access. Suggest alternatives.
- **Only one source for compare**: Ask for at least one more.
- **Citations incomplete**: Flag missing fields. Don't invent metadata.
- **Source 5+ years old in fast-moving field**: Warn about potential obsolescence.
