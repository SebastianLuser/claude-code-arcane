# Schema Testing, Validation & Common Mistakes

## Common Mistakes

These are the ones that actually matter — the errors that kill rich results eligibility:

| Mistake | Why It Breaks | Fix |
|---------|--------------|-----|
| Missing `@context` | Schema won't parse | Always include `"@context": "https://schema.org"` |
| Missing required fields | Google won't show rich result | Check required vs recommended in `schema-types-guide.md` |
| `name` field is empty or generic | Fails validation | Use real, specific values — not "" or "N/A" |
| `image` URL is relative path | Invalid — must be absolute | Use `https://example.com/image.jpg` not `/image.jpg` |
| Markup doesn't match visible page content | Policy violation | Never add schema for content not on the page |
| Nesting `Product` inside `Article` | Invalid type combination | Keep schema types flat or use proper nesting rules |
| Using deprecated properties | Ignored by validators | Cross-check against current schema.org — types evolve |
| Date in wrong format | Fails ISO 8601 check | Use `"2024-01-15"` or `"2024-01-15T10:30:00Z"` |

---

## Testing & Validation

Always test before publishing. Use all three:

1. **Google Rich Results Test** — `https://search.google.com/test/rich-results`
   - Tells you if Google can parse the schema
   - Shows exactly which rich result types are eligible
   - Shows warnings vs errors (errors = no rich result, warnings = may still work)

2. **Schema.org Validator** — `https://validator.schema.org`
   - Broader validation against the full schema.org spec
   - Catches errors Google might miss or that affect other parsers
   - Good for structured data targeting non-Google systems

3. **`scripts/schema_validator.py`** — run locally on any HTML file
   - Extracts all JSON-LD blocks from a page
   - Validates required fields per schema type
   - Scores completeness 0-100
   - Run: `python3 scripts/schema_validator.py page.html`

4. **Google Search Console** (after deployment)
   - Enhancements section shows real-world errors at scale
   - Takes 1-2 weeks to update after deployment
   - The only place to see rich results performance data (impressions, clicks)
