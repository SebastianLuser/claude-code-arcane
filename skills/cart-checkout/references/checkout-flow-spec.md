# Checkout Flow — Step-by-Step Spec

A platform-agnostic reference for a correct, conversion-optimized checkout. Adapt step granularity to your catalog (digital/low-SKU can collapse steps).

## Steps, Fields & Validation

| Step | Fields | Validation / behavior |
|------|--------|-----------------------|
| **Cart** | line items, qty, totals | Editable qty; re-price + re-check stock server-side on load |
| **Identity** | email (required), login/guest | Collect email first; offer guest checkout prominently |
| **Shipping address** | name, address, country, postal | Inline validation; address autocomplete if available |
| **Shipping method** | method options + rates | Recompute on address change; show ETA + cost |
| **Payment** | payment method | Tokenized/hosted fields; idempotency key generated here |
| **Review** | full summary | Final total incl. tax/shipping/discounts before pay button |
| **Confirmation** | order number | Show + email receipt; clear cart; fire `purchase` event |

## Server-Side Re-Validation (before charge)
Always recompute, never trust the client:
1. Item availability (reserve with TTL)
2. Prices (current catalog prices, not cart-stored)
3. Promotions (re-evaluate eligibility + caps)
4. Shipping + tax (against final address)
5. Final total → only then create the payment intent

## Error Handling
- Never clear entered fields on a validation error.
- Show errors inline next to the field, plus a summary.
- Payment decline → keep the order in a recoverable state; let the shopper retry without re-entering everything.
- Stock lost during checkout → tell the shopper exactly which line and offer alternatives.

## Address Validation
- Normalize country to ISO code; postal format per country.
- Soft-validate (suggest correction) rather than hard-block where possible.

## Abandoned-Cart Triggers
| Touch | Timing | Content |
|-------|--------|---------|
| 1 | ~1h | "You left these" + cart contents |
| 2 | ~24h | Objection handling, reviews, support offer |
| 3 | ~72h | Incentive (only if margin allows) |

Suppress all touches once `purchase` fires. Respect consent + frequency caps.

## Verdict: READY when
- [ ] Guest checkout works end-to-end
- [ ] Email captured before payment
- [ ] All totals recomputed server-side pre-charge
- [ ] Payment is idempotent (no double-charge on retry/double-click)
- [ ] Entered data survives validation errors
- [ ] `purchase` event fires once with transaction id
