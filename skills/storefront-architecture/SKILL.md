---
name: storefront-architecture
description: "Design storefront information architecture and the page system — homepage, listing (PLP), product detail (PDP), cart, checkout, search and navigation/megamenu — plus the headless-vs-monolith decision and performance budgets. Stack-agnostic. Triggers: planning a storefront, choosing headless vs monolith, designing navigation/search."
argument-hint: "[design | pages | headless]"
category: "ecommerce"
user-invocable: true
allowed-tools: Read, Glob, Grep
---

# Storefront Architecture

The shopper-facing structure: how pages, navigation, and search fit together, and what platform shape to build on. Decisions here, not code — applicable to any framework.

## Before Starting

Gather: catalog size and complexity, content needs (editorial, localization), team/stack constraints, and goal (design the IA, spec the page system, or make the headless-vs-monolith call).

## How This Skill Works

| Mode | Trigger | Output |
|------|---------|--------|
| **Design** | `design` | Full IA + page system + nav/search plan |
| **Pages** | `pages` | Per-page-type component and content spec |
| **Headless** | `headless` | Architecture decision with trade-offs |

---

## Phase 1 — The Page System

| Page type | Job | Must have |
|-----------|-----|-----------|
| **Home** | Orient + route | Value prop, primary nav, featured collections |
| **PLP** (listing) | Browse + filter | Facets, sort, pagination, quick-add |
| **PDP** (detail) | Convert | Gallery, variant selector, price, stock, CTA, trust signals |
| **Search** | Find | Autocomplete, typo tolerance, zero-result handling |
| **Cart** | Review | Editable lines, totals, clear CTA |
| **Checkout** | Pay | Owned by `cart-checkout` |

PDP and PLP are driven by the `commerce-data-model` (variants, attributes, facets).

---

## Phase 2 — Navigation & Search

- **Megamenu** mirrors the taxonomy (categories → subcategories), not collections. Keep depth ≤ 3.
- **Search** is a primary nav path, not a fallback — invest in autocomplete and synonyms.
- Stable, human-readable URLs per category/product (SEO; hand off to `seo-audit` / `schema-markup`).

---

## Phase 3 — Platform Shape & Performance

| Option | Best for | Cost |
|--------|----------|------|
| **Monolith** (SaaS/themed) | Speed to market, standard catalogs | Less flexibility |
| **Headless** (decoupled FE) | Custom UX, omnichannel, scale | Higher build/ops cost |
| **Composable** | Enterprise, best-of-breed | Integration complexity |

**Performance budget** (Core Web Vitals): PDP/PLP LCP < 2.5s, lazy-load below-fold imagery, prioritize the variant/price/CTA above the fold. Performance is a conversion factor, not a nice-to-have.

---

## Output Artifacts

| Request | Output |
|---------|--------|
| Design | IA map + page system + nav/search plan |
| Pages | Component/content spec per page type |
| Headless | Decision matrix + recommendation |

A storefront architecture is **READY** when each page type has a clear job and component spec, navigation mirrors the taxonomy, search is first-class, and a performance budget is defined.

---

## Related Skills

- **commerce-data-model**: feeds PLP/PDP structure.
- **cart-checkout**: owns the cart and checkout pages.
- **site-architecture** / **seo-audit** / **schema-markup**: SEO structure and markup.
- **page-cro**: conversion optimization of the page templates.
