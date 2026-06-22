---
name: commerce-data-model
description: "Design and audit the core e-commerce domain model — products, variants, SKUs, options, collections, attributes, taxonomy, faceted search and pagination. Language- and platform-agnostic. Triggers: modeling a catalog, reviewing an existing product schema, designing filtering/search."
argument-hint: "[model | audit | taxonomy]"
category: "ecommerce"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Commerce Data Model

Design the backbone of any storefront: a product catalog model that survives variants, bundles, localization, and faceted search — independent of language, framework, or database.

> **Note:** This skill may create or modify files in your project (a model spec or schema doc). It will ask before writing.

## Before Starting

Gather: business context (physical/digital/services, single vs multi-vendor, B2C/B2B), scale (SKU count, variant explosion, locales/currencies), and goal (model from scratch, audit an existing schema, or design taxonomy + filtering).

## How This Skill Works

| Mode | Trigger | Output |
|------|---------|--------|
| **Model** | `model` | Entity model spec: Product, Variant, SKU, Option, Collection, Attribute |
| **Audit** | `audit` | Gap analysis of an existing schema against commerce best practices |
| **Taxonomy** | `taxonomy` | Category tree, attribute schema, faceted-search and pagination design |

---

## Phase 1 — Core Entities

The canonical separation that prevents 90% of catalog pain:

| Entity | Is | Is NOT | Key fields |
|--------|----|--------|-----------|
| **Product** | The marketing/SEO unit ("Acme Tee") | A buyable thing | title, description, slug, status, brand |
| **Variant** | A buyable combination ("Tee / Red / M") | A category | option values, price, weight, barcode |
| **SKU** | The stock-keeping identifier | A variant's price | code, variant_id |
| **Option** | An axis of variation (Color, Size) | A value | name, position |
| **Collection** | A merchandising grouping | A taxonomy node | title, rules (manual/automatic) |

**Rule:** Price, inventory, and barcode live on the **Variant**, never the Product. A product with no options still has exactly one variant.

For the full field-level spec, identifiers (GTIN/MPN), bundles/kits, and digital vs physical modeling, see [references/data-model-spec.md](references/data-model-spec.md).

---

## Phase 2 — Attributes & Taxonomy

- **Taxonomy** (category tree): hierarchical, navigational, one primary path per product. Stable URLs.
- **Collections**: many-to-many merchandising overlays (manual or rule-based). A product lives in one category branch but many collections.
- **Attributes**: typed key-values (`material: cotton`, `sleeve: short`). Drive facets. Define a controlled vocabulary — free-text attributes break filtering.

**Attribute typing:** `text | enum | number | boolean | measurement`. Enums must reference a value list. Measurements carry a unit.

---

## Phase 3 — Faceted Search & Pagination

- Facets come from `enum`/`boolean`/`measurement` attributes, not free text.
- Multi-select within a facet = OR; across facets = AND.
- Always show counts; never show zero-result facet values.
- **Pagination:** prefer cursor/keyset over offset for deep catalogs (offset degrades and double-counts under writes). Cap page size.

---

## Output Artifacts

| Request | Output |
|---------|--------|
| Model from scratch | Entity spec + ER sketch + identifier strategy |
| Audit schema | Verdict per entity: COMPLIANT / CONCERNS, with fixes |
| Design taxonomy | Category tree + attribute schema + facet plan |

A schema is **COMPLIANT** when price/inventory sit on variants, every product has ≥1 variant, attributes are typed against vocabularies, and URLs are stable.

---

## Related Skills

- **storefront-architecture**: consumes this model to design PLP/PDP pages. Next step after modeling.
- **merchant-feed**: maps these entities to Google/Meta feed attributes.
- **inventory-stock**: owns stock levels that hang off the SKU/variant.
- **order-lifecycle**: references variants as order line items.
