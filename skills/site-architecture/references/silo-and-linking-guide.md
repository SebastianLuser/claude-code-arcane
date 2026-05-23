# Silo Structure, Topical Authority & Internal Linking

## Silo Structure & Topical Authority

A silo is a self-contained cluster of content about one topic, where all pages link to each other and to a central hub page. Google uses this to determine topical authority.

### Hub-and-Spoke Model

```
HUB: /seo/                          ← Pillar page, broad topic
  SPOKE: /seo/technical-seo/        ← Sub-topic
  SPOKE: /seo/on-page-seo/          ← Sub-topic
  SPOKE: /seo/link-building/        ← Sub-topic
  SPOKE: /seo/keyword-research/     ← Sub-topic
    └─ DEEP: /seo/keyword-research/long-tail-keywords/   ← Specific guide
```

**Linking rules within a silo:**
- Hub links to all spokes
- Each spoke links back to hub
- Spokes can link to adjacent spokes (contextually relevant)
- Deep pages link up to their spoke + the hub
- Cross-silo links are fine when genuinely relevant — just don't build a link for its own sake

### Building Topic Clusters

1. Identify your core topics (usually 3-7 for a focused site)
2. For each topic: one pillar page (the hub) that covers it broadly
3. Create spoke content for each major sub-question within the topic
4. Every spoke links to the pillar with relevant anchor text
5. The pillar links down to all spokes
6. Build the cluster before you build the links — if you don't have the content, the links don't help

---

## Internal Linking Strategy

Internal links are the most underused SEO lever. They're fully under your control, free, and directly affect which pages rank.

### Link Equity Principles

- Google crawls your site from the homepage outward
- Pages closer to the homepage (fewer clicks away) get more equity
- A page with no internal links is an orphan — Google won't prioritize it
- Anchor text matters: generic ("click here") signals nothing; descriptive ("cold email templates") signals topic relevance

### Anchor Text Rules

| Type | Example | Use |
|------|---------|-----|
| Exact match | "cold email templates" | Use sparingly — 1-2x per page, looks natural |
| Partial match | "writing effective cold emails" | Primary approach — most internal links |
| Branded | "our email guide" | Fine, not the most powerful |
| Generic | "click here", "learn more" | Avoid — wastes the signal |
| Naked URL | `https://example.com/guide` | Never use for internal links |

### Finding and Fixing Orphan Pages

An orphan page is indexed but has no inbound internal links. It's invisible to the site's link graph.

How to find them:
1. Export all indexed URLs (from GSC, Screaming Frog, or `sitemap_analyzer.py`)
2. Export all internal links on the site
3. Pages that appear in set A but not set B are orphans
4. Or: run `scripts/sitemap_analyzer.py` which flags potential orphan candidates

How to fix them:
- Add contextual links from relevant existing pages
- Add them to relevant hub pages
- If they truly have no home, consider whether they should exist at all

### The Linking Priority Stack

Not all internal links are equal. From most to least powerful:

1. **In-content links** — within the body copy of a relevant page. Most natural, most powerful.
2. **Hub page links** — the pillar page linking to all its spokes. High equity because pillar pages are linked from everywhere.
3. **Navigation links** — sitewide, consistent, but diluted by their ubiquity.
4. **Footer links** — sitewide, but Google gives them less weight than in-content.
5. **Sidebar links** — OK but often not in the main content flow.
