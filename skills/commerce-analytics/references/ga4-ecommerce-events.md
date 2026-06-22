# GA4 Ecommerce Event Taxonomy & Parameter Reference

The standard funnel. Fire these with a consistent `items[]` shape so reports, funnels, and audiences work. The `ga4_ecommerce_validate.py` script checks a captured dataLayer against this spec.

## The funnel
```
view_item_list → view_item → add_to_cart → view_cart → begin_checkout
  → add_shipping_info → add_payment_info → purchase
```
Plus: `select_item`, `remove_from_cart`, `refund`.

## Required parameters per event
| Event | Required (beyond items[]) |
|-------|---------------------------|
| view_item | currency |
| add_to_cart / remove_from_cart / view_cart | currency |
| begin_checkout | currency |
| add_shipping_info | currency |
| add_payment_info | currency |
| purchase | currency, value, transaction_id |
| refund | currency, transaction_id |
| view_item_list / select_item | (item_list_id / item_list_name recommended) |

## items[] object
| Field | Req? | Notes |
|-------|------|-------|
| item_id | yes | Map to SKU |
| item_name | yes | Product/variant name |
| price | recommended | Unit price (number) |
| quantity | recommended | Defaults to 1 |
| item_brand | optional | |
| item_category | optional | Up to item_category5 |
| item_variant | optional | e.g. "Red / M" |
| discount | optional | Per-unit discount |
| index | optional | Position in list |

## Worked example — purchase
```json
{
  "event": "purchase",
  "ecommerce": {
    "currency": "USD",
    "value": 42.00,
    "transaction_id": "T-1001",
    "tax": 3.50,
    "shipping": 5.00,
    "items": [
      { "item_id": "ACME-TEE-RED-M", "item_name": "Acme Cotton Tee",
        "item_variant": "Red / M", "price": 21.00, "quantity": 2 }
    ]
  }
}
```

## Common faults (audit checklist)
- [ ] `purchase` missing `transaction_id` → duplicate purchases on refresh
- [ ] `value` inconsistent about tax/shipping inclusion (pick one, document it)
- [ ] `items[]` absent or empty on funnel events
- [ ] Double-firing (GTM tag + hardcoded gtag)
- [ ] Currency missing → revenue not attributed
- [ ] Store revenue vs GA4 revenue variance > 5% → tracking bug

Verdict: **COMPLIANT** when the full funnel fires with valid `items[]` + `currency`, `purchase` has a unique `transaction_id`, and revenue reconciles within 5%.
