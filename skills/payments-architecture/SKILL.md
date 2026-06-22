---
name: payments-architecture
description: "Design payment architecture independent of any single processor — gateway selection, payment intents, idempotency, webhook reliability, reconciliation, PCI scope, fraud, and refunds. Complements processor-specific skills. Triggers: choosing a PSP, designing webhook handling, reducing PCI scope, reconciling payments."
argument-hint: "[design | webhooks | audit]"
category: "ecommerce"
user-invocable: true
allowed-tools: Read, Glob, Grep
---

# Payments Architecture

The payment layer must never double-charge, never lose a webhook, and never widen PCI scope. This skill designs the processor-agnostic architecture; processor-specific implementation (e.g. Stripe) is a handoff.

## Before Starting

Gather: markets/currencies, payment methods (cards, wallets, local methods), capture model (immediate vs auth/capture), subscription needs, and goal (design the architecture, harden webhooks, or audit an existing integration).

## How This Skill Works

| Mode | Trigger | Output |
|------|---------|--------|
| **Design** | `design` | Gateway choice + payment flow + PCI strategy |
| **Webhooks** | `webhooks` | Reliable, idempotent webhook handling design |
| **Audit** | `audit` | Risk review of an existing integration |

---

## Phase 1 — Flow & Idempotency

Use the **payment intent** model regardless of processor: create intent → confirm → succeeded/failed, with status mirrored onto the order.

| Principle | Why |
|-----------|-----|
| **Idempotency keys** on every create/charge | A retried request must not double-charge |
| **Server-authoritative amounts** | Never trust client-sent totals; re-price server-side |
| **Auth then capture** (where supported) | Capture at fulfillment, not at order placement |
| **Money as integer minor units** | No floats for currency, ever |

---

## Phase 2 — Webhook Reliability

Webhooks are the source of truth for async payment outcomes — treat them as unreliable transport:

1. **Verify the signature** before doing anything.
2. **Deduplicate** by event id (idempotent processing) — providers redeliver.
3. **Persist then process** — store the raw event, ack fast (2xx), process out of band.
4. **Tolerate out-of-order** delivery; reconcile against current state, don't assume sequence.
5. **Reconcile** daily against the processor's ledger to catch missed events.

For the persist-ack-process pattern, retry/backoff, and reconciliation report design, apply the principles above and hand processor specifics to `stripe-integration-expert`.

---

## Phase 3 — PCI Scope & Fraud

- **Minimize PCI scope:** use hosted fields / tokenization so raw PAN never touches your servers (SAQ A). Never log card data.
- **Fraud:** combine processor risk signals with velocity checks, AVS/CVV, and 3-D Secure for high-risk; balance friction vs chargebacks.
- **Refunds:** never exceed captured amount; support partial; emit `payment.refunded` to the order lifecycle.

---

## Output Artifacts

| Request | Output |
|---------|--------|
| Design | Gateway selection + intent flow + PCI scope plan |
| Webhooks | Idempotent handler design + reconciliation plan |
| Audit | Findings: SECURE / CONCERNS / FAIL per area |

A payment architecture is **SECURE** when charges are idempotent, amounts are server-authoritative, webhooks are signature-verified and deduplicated, money is integer minor units, and PCI scope is minimized.

---

## Related Skills

- **stripe-integration-expert**: processor-specific implementation once this architecture is set.
- **cart-checkout**: invokes the payment step.
- **order-lifecycle**: consumes payment events (paid, refunded).
- **subscription-billing**: recurring charges build on this layer.
