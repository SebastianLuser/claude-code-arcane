---
name: commerce-analytics
description: "Define and audit e-commerce analytics — conversion rate, AOV, CLV, cohort/funnel metrics, and the standard GA4 ecommerce event spec (view_item, add_to_cart, begin_checkout, purchase). Includes a dataLayer event validator. Triggers: defining commerce KPIs, instrumenting GA4 ecommerce events, auditing tracking."
argument-hint: "[kpis | events | audit]"
category: "ecommerce"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Commerce Analytics

You cannot optimize what you mis-measure. Define the KPIs that actually move a store and instrument the standard ecommerce event spec correctly — platform-agnostic, with a validator for GA4 dataLayer events.

## Before Starting

Gather: current tracking (GA4/GTM/other), business model (one-time vs subscription), key conversion actions, and goal (define KPIs, design/instrument events, or audit existing tracking).

## How This Skill Works

| Mode | Trigger | Output |
|------|---------|--------|
| **KPIs** | `kpis` | KPI framework + dashboard spec |
| **Events** | `events` | Ecommerce event taxonomy + dataLayer spec |
| **Audit** | `audit` | Tracking gap + data-quality review |

---

## Phase 1 — Core KPIs

| Metric | Formula | Watch for |
|--------|---------|-----------|
| **Conversion rate** | orders / sessions | Segment by device/channel |
| **AOV** | revenue / orders | Moves with promos/bundles |
| **CLV** | avg order value × frequency × lifespan | The number that justifies CAC |
| **Cart abandonment** | 1 − (checkouts / carts) | Diagnoses checkout friction |
| **Repeat rate** | repeat customers / total | Retention health |
| **Sell-through** | units sold / units received | Feeds `inventory-stock` forecasts |

**Rule:** Pair every acquisition metric with a margin metric — revenue growth on negative contribution margin is a trap.

---

## Phase 2 — The Ecommerce Event Spec

The standard GA4 ecommerce funnel events, each carrying `currency` + an `items[]` array:

`view_item_list → view_item → add_to_cart → begin_checkout → add_shipping_info → add_payment_info → purchase` (plus `remove_from_cart`, `refund`).

Each `items[]` entry: `item_id`, `item_name`, `price`, `quantity` (+ optional `item_brand`, `item_category`, `item_variant`). `purchase` also needs `transaction_id` and `value`.

Validate a captured dataLayer against this spec:

```bash
python skills/commerce-analytics/scripts/ga4_ecommerce_validate.py            # demo events
python skills/commerce-analytics/scripts/ga4_ecommerce_validate.py events.json
```

It reports PASS/FAIL per event with the missing required fields. For the full taxonomy and parameter reference, see [references/ga4-ecommerce-events.md](references/ga4-ecommerce-events.md).

---

## Phase 3 — Audit & Data Quality

Common faults: missing `transaction_id` (duplicate purchases), `value` excluding/including tax inconsistently, `items[]` absent on purchase, double-firing (GTM + hardcoded). Cross-check store revenue vs GA4 revenue — variance > 5% means a tracking bug.

---

## Output Artifacts

| Request | Output |
|---------|--------|
| KPIs | KPI framework + dashboard layout |
| Events | Event taxonomy + dataLayer spec |
| Audit | Gap analysis + data-quality scorecard |

Commerce tracking is **COMPLIANT** when the full funnel fires with valid `items[]` and `currency`, `purchase` carries a unique `transaction_id`, revenue reconciles within 5%, and KPIs pair growth with margin.

---

## Related Skills

- **analytics-tracking**: general GA4/GTM setup this builds on for SaaS-style funnels.
- **inventory-stock**: sell-through metrics feed restock forecasting.
- **commerce-data-model**: item taxonomy maps to `items[]` parameters.
- **ab-test-setup** / **campaign-analytics**: experimentation and campaign measurement.
