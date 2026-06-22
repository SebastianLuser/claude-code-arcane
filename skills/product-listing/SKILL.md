---
name: product-listing
description: "Optimize product detail pages and marketplace listings for discovery and conversion — titles, bullets, descriptions, imagery, A+ content, and marketplace algorithms (Amazon A10/COSMO/Rufus). Includes bulk-copy generation guidance. Triggers: writing/optimizing PDP copy, marketplace listings, bulk product descriptions."
argument-hint: "[pdp | marketplace | bulk]"
category: "ecommerce"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Product Listing

A listing has two readers: the ranking algorithm and the buyer. Optimize for both — keyword-relevant enough to surface, persuasive enough to convert — across your own PDP and marketplaces.

## Before Starting

Gather: channel (own store vs Amazon/Meta/etc.), product category and key attributes, target keywords, and goal (optimize a PDP, write a marketplace listing, or generate bulk descriptions).

## How This Skill Works

| Mode | Trigger | Output |
|------|---------|--------|
| **PDP** | `pdp` | Optimized own-store product page copy |
| **Marketplace** | `marketplace` | Channel-specific listing (title/bullets/A+) |
| **Bulk** | `bulk` | Templated copy for many SKUs at scale |

---

## Phase 1 — PDP Copy Anatomy

| Element | Rule |
|---------|------|
| **Title** | Brand + product + key differentiator; front-load the noun |
| **Bullets** | Benefit-led, scannable; feature → benefit translation |
| **Description** | Story + specs; answer objections; structured for skim |
| **Imagery** | Multiple angles, scale/context, zoom; alt text for SEO + a11y |
| **Trust** | Reviews, ratings, returns, shipping, stock signals near the CTA |

Map product attributes (from `commerce-data-model`) into structured spec tables — buyers filter on them and search engines index them.

---

## Phase 2 — Marketplace Algorithms

Marketplace listings must satisfy ranking systems, not just shoppers:

- **Amazon A10** — keyword/relevance + sales velocity + conversion. Put core keywords in title and bullets naturally.
- **COSMO** — semantic/intent: write for *purchase intent and use-cases*, not just keyword stuffing.
- **Rufus / AI assistants** — Q&A-friendly content: cover comparisons, compatibility, use-cases the way a shopper would ask.
- Localize per marketplace (not just translate) — units, sizing, terminology.

Avoid keyword stuffing; modern algorithms penalize it and shoppers distrust it. Hand SEO structure to `ai-seo` / `seo-audit`.

---

## Phase 3 — Bulk Generation

For large catalogs, template the copy:

1. Define a copy template per product category (slots: hook, benefits, specs, use-case).
2. Map structured attributes → slots.
3. Generate, then spot-QA for accuracy and duplicate-content risk (search engines penalize near-duplicates).

Pair with `merchant-feed` (the script there validates the structured attributes that feed both listings and ads).

---

## Output Artifacts

| Request | Output |
|---------|--------|
| PDP | Title + bullets + description + image/alt brief |
| Marketplace | Channel-tuned listing with keyword map |
| Bulk | Category templates + slot mapping |

A listing is **READY** when the title front-loads the product, bullets are benefit-led, intent/use-cases are covered for AI search, trust signals sit by the CTA, and there's no duplicate-content risk.

---

## Related Skills

- **commerce-data-model**: source of the structured attributes copy draws on.
- **ai-seo** / **seo-audit** / **schema-markup**: organic discovery and markup.
- **merchant-feed**: same attributes power shopping ads.
- **copywriting** / **page-cro**: deeper persuasion and conversion testing.
