---
name: merchant-feed
description: "Build and validate product feeds for shopping channels — Google Merchant Center and Meta Catalog — including required/recommended attributes, attribute mapping, and feed validation. Includes a feed validator/generator script. Triggers: building a product feed, fixing feed disapprovals, mapping catalog to feed attributes."
argument-hint: "[validate | generate | map]"
category: "ecommerce"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Merchant Feed

Shopping ads and free listings live or die on feed quality. A clean, complete feed gets products approved and surfaced; a sloppy one gets disapprovals. Map your catalog to channel attributes and validate before upload — platform-agnostic.

## Before Starting

Gather: target channel (Google Merchant / Meta Catalog), source of truth (DB export, CSV, platform), product categories, and goal (validate an existing feed, generate one, or map catalog → feed attributes).

## How This Skill Works

| Mode | Trigger | Output |
|------|---------|--------|
| **Validate** | `validate` | Pass/fail report against required attributes |
| **Generate** | `generate` | Feed emitted from a source CSV |
| **Map** | `map` | Catalog field → feed attribute mapping |

---

## Phase 1 — Required Attributes

Google Merchant / Meta share a common core. Required for every item:

| Attribute | Notes |
|-----------|-------|
| `id` | Stable, unique per variant (use SKU) |
| `title` | Front-load product; ≤150 chars; match landing page |
| `description` | Plain, accurate; no promo text/caps |
| `link` | Canonical PDP URL |
| `image_link` | Main image, meets resolution minimums |
| `availability` | in_stock / out_of_stock / preorder |
| `price` | With currency; must match landing page exactly |
| `brand` | Required unless exempt category |
| `gtin` / `mpn` | Required where a GTIN exists — improves matching |
| `condition` | new / refurbished / used |

**Rule:** Feed price and availability must **exactly match** the live PDP, or the item is disapproved and the account is penalized.

---

## Phase 2 — Validate / Generate

Run the validator on a CSV export:

```bash
python skills/merchant-feed/scripts/feed_validate.py            # demo data
python skills/merchant-feed/scripts/feed_validate.py feed.csv
```

It checks every row for required attributes, flags missing/empty values, validates `availability`/`condition` enums and price+currency format, and reports a per-row and summary verdict. For the full attribute reference and category-specific requirements, see [references/feed-attribute-map.md](references/feed-attribute-map.md).

---

## Phase 3 — Recommended Attributes & Quality

Beyond required, these lift performance: `google_product_category`, `product_type`, `item_group_id` (links variants), `color`, `size`, `gender`, `age_group`, `sale_price`, `shipping`, `gtin`. Use `item_group_id` so variants cluster correctly — without it, variants compete as separate products.

---

## Output Artifacts

| Request | Output |
|---------|--------|
| Validate | Per-row + summary PASS / FAIL report |
| Generate | Channel-ready feed file |
| Map | Catalog → feed attribute mapping table |

A feed is **READY** when every item has all required attributes, price/availability match the PDP, variants share an `item_group_id`, and GTINs are present where they exist.

---

## Related Skills

- **commerce-data-model**: the catalog entities mapped into feed attributes.
- **product-listing**: titles/descriptions reused between PDP and feed.
- **shipping-tax**: shipping attribute values in the feed.
- **schema-markup**: Product structured data complements the feed for organic.
