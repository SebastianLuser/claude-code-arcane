---
name: app-store-optimization
description: "ASO toolkit — keyword research, metadata optimization, competitor analysis, A/B testing, and launch planning for Apple App Store and Google Play."
category: "marketing-growth"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# App Store Optimization (ASO)

---

## Keyword Research Workflow

Discover and evaluate keywords that drive app store visibility.

### Workflow: Conduct Keyword Research

1. Define target audience and core app functions:
   - Primary use case (what problem does the app solve)
   - Target user demographics
   - Competitive category
2. Generate seed keywords from:
   - App features and benefits
   - User language (not developer terminology)
   - App store autocomplete suggestions
3. Expand keyword list using:
   - Modifiers (free, best, simple)
   - Actions (create, track, organize)
   - Audiences (for students, for teams, for business)
4. Evaluate each keyword:
   - Search volume (estimated monthly searches)
   - Competition (number and quality of ranking apps)
   - Relevance (alignment with app function)
5. Score and prioritize keywords:
   - Primary: Title and keyword field (iOS)
   - Secondary: Subtitle and short description
   - Tertiary: Full description only
6. Map keywords to metadata locations
7. Document keyword strategy for tracking
8. **Validation:** Keywords scored; placement mapped; no competitor brand names included; no plurals in iOS keyword field

### Keyword Evaluation Criteria

| Factor | Weight | High Score Indicators |
|--------|--------|----------------------|
| Relevance | 35% | Describes core app function |
| Volume | 25% | 10,000+ monthly searches |
| Competition | 25% | Top 10 apps have <4.5 avg rating |
| Conversion | 15% | Transactional intent ("best X app") |

### Keyword Placement Priority

| Location | Search Weight |
|----------|---------------|
| App Title | Highest |
| Subtitle (iOS) | High |
| Keyword Field (iOS) | High |
| Short Description (Android) | High |
| Full Description | Medium |

See: [references/keyword-research-guide.md](references/keyword-research-guide.md)

---

## Metadata Optimization Workflow

Optimize title (`[Brand] - [Primary Keyword] [Secondary]`), subtitle/short description, keyword field (iOS), and full description (hook, features, social proof, CTA).

> See [references/metadata-optimization.md](references/metadata-optimization.md) for the 8-step workflow, platform character limits, and description structure template.

See also: [references/platform-requirements.md](references/platform-requirements.md)

---

## Competitor Analysis & App Launch

Analyze top 10 competitors (direct, indirect, category leaders) by extracting keywords, building a keyword matrix, identifying gaps (<40% coverage), and auditing visuals and reviews. Launch with 4-week prep, 2-week review submission, and 7-day post-launch monitoring.

See [references/aso-best-practices.md](references/aso-best-practices.md) for competitor analysis matrix, gap analysis templates, launch checklists, and timing recommendations.

---

## A/B Testing Workflow

Test metadata and visual elements to improve conversion rates. See [references/ab-testing-guide.md](references/ab-testing-guide.md) for the full workflow, prioritization matrix, sample size calculator, and test documentation template.

---

## Before/After Examples

See [references/before-after-examples.md](references/before-after-examples.md) for title, subtitle, keyword field, description, and screenshot caption optimization examples.

---

## References

| Document | Content |
|----------|---------|
| [platform-requirements.md](references/platform-requirements.md) | iOS and Android metadata specs, visual asset requirements |
| [aso-best-practices.md](references/aso-best-practices.md) | Optimization strategies, rating management, launch tactics |
| [keyword-research-guide.md](references/keyword-research-guide.md) | Research methodology, evaluation framework, tracking |
| [ab-testing-guide.md](references/ab-testing-guide.md) | A/B test workflow, prioritization, sample sizes, documentation |
| [before-after-examples.md](references/before-after-examples.md) | Title, subtitle, keyword, description optimization examples |

---

## Platform Notes

| Platform / Constraint | Behavior / Impact |
|-----------------------|-------------------|
| iOS keyword changes | Require app submission |
| iOS promotional text | Editable without an app update |
| Android metadata changes | Index in 1-2 hours |
| Android keyword field | None — use description instead |
| Keyword volume data | Estimates only; no official source |
| Competitor data | Public listings only |

**When not to use this skill:** web apps (use web SEO), enterprise/internal apps, TestFlight-only betas, or paid advertising strategy.

---

## Related Skills

- **copywriting**: For app description copywriting. NOT for keyword research or metadata optimization.
- **launch-strategy**: For coordinating app launch marketing campaigns alongside ASO.
- **paid-ads**: For Apple Search Ads and Google Ads campaigns. NOT for organic ASO.

## Proactive Triggers

- **No keyword optimization in title** → App title is the #1 ranking factor. Include top keyword.
- **Screenshots don't show value** → Screenshots should tell a story, not show UI.
- **No ratings strategy** → Below 4.0 stars kills conversion. Implement in-app rating prompts.
- **Description keyword-stuffed** → Natural language with keywords beats keyword stuffing.

## Output Artifacts

| When you ask for... | You get... |
|---------------------|------------|
| "ASO audit" | Full app store listing audit with prioritized fixes |
| "Keyword research" | Keyword list with search volume and difficulty scores |
| "Optimize my listing" | Rewritten title, subtitle, description, keyword field |

## Communication

All output passes quality verification:
- Self-verify: source attribution, assumption audit, confidence scoring
- Output format: Bottom Line → What (with confidence) → Why → How to Act
- Results only. Every finding tagged: 🟢 verified, 🟡 medium, 🔴 assumed.
