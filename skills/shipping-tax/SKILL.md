---
name: shipping-tax
description: "Design shipping and tax logic — shipping zones, rates and methods, carrier integration patterns, plus sales tax/VAT/GST, nexus, and duties. Platform-agnostic rules for correct totals at checkout. Triggers: designing shipping rates, modeling tax/VAT, handling cross-border duties."
argument-hint: "[shipping | tax | audit]"
category: "ecommerce"
user-invocable: true
allowed-tools: Read, Glob, Grep
---

# Shipping & Tax

The two line items most likely to be wrong at checkout — and the ones that cause chargebacks, abandoned carts, and compliance trouble. Model them correctly and computed server-side, independent of platform.

## Before Starting

Gather: markets shipped to/from, carriers, product attributes (weight/dims), tax obligations (countries, nexus, registrations), and goal (design shipping, design tax, or audit existing totals).

## How This Skill Works

| Mode | Trigger | Output |
|------|---------|--------|
| **Shipping** | `shipping` | Zones, methods, and rate model |
| **Tax** | `tax` | Tax determination and nexus model |
| **Audit** | `audit` | Correctness review of current totals |

---

## Phase 1 — Shipping Model

Layer the model as **zones → methods → rates**:

| Layer | Definition |
|-------|-----------|
| **Zone** | Geographic grouping (country/region/postal ranges) |
| **Method** | Service level (standard, express, pickup) per zone |
| **Rate** | flat / weight-based / price-based / carrier-calculated / free-over-threshold |

- **Free-shipping thresholds** must be computed on the discounted subtotal.
- **Carrier-calculated** rates need weight + dimensions on the variant — falls back to flat if missing.
- Show shipping before the payment step; recompute when the address changes.

---

## Phase 2 — Tax Determination

Tax is destination- and product-dependent — never a single flat rate:

| Concept | Rule |
|---------|------|
| **Nexus** | You only collect where you have an obligation — model registrations per jurisdiction |
| **Destination vs origin** | Most VAT/GST is destination-based; some US states origin-based |
| **Product taxability** | Categories differ (food, digital, apparel) — map products to tax categories |
| **Price display** | Tax-inclusive (EU/UK) vs tax-exclusive (US) — a presentation rule, get it right per market |
| **B2B** | Reverse-charge / VAT-ID validation for cross-border EU |

**Rule:** Compute tax at checkout against the shipping destination, using a tax category per product. Round per jurisdiction rules.

---

## Phase 3 — Cross-Border & Duties

- **DDP vs DDU:** decide who pays import duties — DDP (you collect at checkout, best UX) vs DDU (customer pays on delivery, surprise fees → returns).
- **Landed cost** = item + shipping + duties + tax; show it for cross-border.
- Capture **HS codes** and country of origin on products for customs.

---

## Output Artifacts

| Request | Output |
|---------|--------|
| Shipping | Zone/method/rate model |
| Tax | Nexus map + product tax-category mapping |
| Audit | Findings per market: PASS / FAIL with fixes |

Shipping and tax are **READY** when both are computed server-side against the destination, free-shipping uses discounted subtotals, tax categories are mapped, and cross-border shows landed cost.

---

## Related Skills

- **cart-checkout**: displays and recomputes these at the shipping step.
- **order-lifecycle**: shipping method feeds fulfillment; tax recorded on the order.
- **commerce-data-model**: weight/dims/HS code/tax category live on the product.
- **merchant-feed**: shipping and tax attributes appear in product feeds.
