---
name: cart-checkout
description: "Design and audit cart and checkout flows — cart state, multi-step vs one-page checkout, guest checkout, address/shipping/tax/payment steps, and abandoned-cart recovery. Platform-agnostic conversion and correctness patterns. Triggers: designing a checkout, auditing drop-off, planning abandoned-cart flows."
argument-hint: "[design | audit | abandoned]"
category: "ecommerce"
user-invocable: true
allowed-tools: Read, Glob, Grep
---

# Cart & Checkout

The highest-leverage surface in commerce: where intent becomes revenue. Design carts and checkouts that are correct under concurrency and optimized for completion — without prescribing a framework.

## Before Starting

Gather: cart model (server-persisted vs client, guest vs account), checkout type (single vs multi-step), payment/shipping/tax requirements, and goal (design new flow, audit drop-off, or build abandoned-cart recovery).

## How This Skill Works

| Mode | Trigger | Output |
|------|---------|--------|
| **Design** | `design` | Cart state model + checkout step flow + edge cases |
| **Audit** | `audit` | Friction/drop-off analysis with prioritized fixes |
| **Abandoned** | `abandoned` | Recovery sequence (triggers, timing, channels) |

---

## Phase 1 — Cart State

| Decision | Recommendation |
|----------|----------------|
| Persistence | Server-side cart keyed by session + user; merge on login |
| Pricing | **Re-price at checkout** — never trust cart-stored prices |
| Inventory | Soft-reserve at checkout start, not on add-to-cart |
| Identity | Allow guest carts; merge guest → account without losing items |

**Rule:** The cart is a draft, not a contract. Totals, stock, and promotions are recomputed server-side before payment.

---

## Phase 2 — Checkout Flow

Canonical steps: **Cart → Identity → Shipping address → Shipping method → Payment → Review → Confirmation.**

- **Guest checkout** is non-negotiable for B2C — forced account creation is the #1 avoidable drop-off.
- Collect email first (enables abandoned-cart + receipts).
- One-page vs multi-step: multi-step for complex shipping/tax; one-page for low-SKU/digital. Either way, show progress and never lose entered data on validation error.
- Recompute tax/shipping when the address changes; show the final total before the pay button.
- Make payment **idempotent** — a double-click must not double-charge (hand off to `payments-architecture`).

For the full step-by-step field list, error handling, and address validation patterns, see [references/checkout-flow-spec.md](references/checkout-flow-spec.md).

---

## Phase 3 — Abandoned-Cart Recovery

| Touch | Timing | Angle |
|-------|--------|-------|
| 1 | ~1h | Reminder ("you left these") |
| 2 | ~24h | Help/objection handling + reviews |
| 3 | ~72h | Incentive (discount) — only if margin allows |

Capture email as early as possible; suppress recovery once the order completes; respect consent and frequency caps.

---

## Output Artifacts

| Request | Output |
|---------|--------|
| Design flow | Cart model + annotated step diagram + edge-case list |
| Audit | Drop-off table with severity and READY-to-ship fixes |
| Abandoned | Trigger/timing/channel sequence + suppression rules |

A checkout is **READY** when guest checkout works, prices/stock are re-validated server-side, payment is idempotent, and data survives validation errors.

---

## Related Skills

- **payments-architecture**: owns the payment step (intents, idempotency, webhooks).
- **shipping-tax**: computes the shipping and tax shown at checkout.
- **promotions-discounts**: applies coupons/discounts at the cart.
- **page-cro** / **form-cro**: deeper conversion optimization of the checkout UI.
- **order-lifecycle**: takes over once the order is placed.
