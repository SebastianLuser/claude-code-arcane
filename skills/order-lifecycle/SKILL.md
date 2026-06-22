---
name: order-lifecycle
description: "Design the order lifecycle — order state machine, fulfillment workflow, returns/RMA, refunds, cancellations, and order events/webhooks. Platform-agnostic state and event modeling. Triggers: designing order states, modeling returns/refunds, defining order events."
argument-hint: "[design | states | returns]"
category: "ecommerce"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Order Lifecycle

An order is a long-lived state machine touched by payments, inventory, shipping, and support. Model its states, transitions, and events explicitly so nothing silently gets stuck — independent of platform.

> **Note:** This skill may create or modify files in your project (a state-machine spec). It will ask before writing.

## Before Starting

Gather: fulfillment model (single vs split/partial shipments), payment capture timing (auth-then-capture vs immediate), returns policy, and goal (design the full lifecycle, define the state machine, or model returns/refunds).

## How This Skill Works

| Mode | Trigger | Output |
|------|---------|--------|
| **Design** | `design` | End-to-end lifecycle + events |
| **States** | `states` | Formal state machine: states, transitions, guards |
| **Returns** | `returns` | RMA + refund flow and states |

---

## Phase 1 — The State Machine

Separate **order status** from **payment status** and **fulfillment status** — collapsing them into one field is the most common modeling mistake.

| Dimension | States |
|-----------|--------|
| **Order** | pending → confirmed → in_progress → completed / cancelled |
| **Payment** | pending → authorized → paid → partially_refunded → refunded / failed |
| **Fulfillment** | unfulfilled → partially_fulfilled → fulfilled → returned |

Each transition has a **guard** (e.g. cannot fulfill before payment authorized) and emits an **event**.

For the full transition table, guards, and partial-shipment handling, see [references/order-state-machine.md](references/order-state-machine.md).

---

## Phase 2 — Events & Webhooks

Every transition emits a durable, ordered event: `order.created`, `order.paid`, `order.fulfilled`, `order.cancelled`, `order.refunded`, `return.requested`, `return.received`.

- Events are **append-only** — never mutate history; the current state is a projection.
- Outbound webhooks must be **idempotent and retried** with signatures (hand off to `payments-architecture` for the reliability pattern).
- Carry an idempotency key from order placement through fulfillment.

---

## Phase 3 — Returns & Refunds

Flow: `return.requested → approved → label_sent → in_transit → received → inspected → refunded/rejected`.

| Concern | Rule |
|---------|------|
| Restock | Only on `received + inspected` pass, back to `available` |
| Refund | Full / partial / store-credit; never exceed captured amount |
| Window | Enforce return-window guard at request time |
| Partial | Per line-item, not whole-order, for split fulfillment |

---

## Output Artifacts

| Request | Output |
|---------|--------|
| Design | Lifecycle diagram + event catalog |
| States | State/transition/guard table (the spec) |
| Returns | RMA flow + refund rules |

A lifecycle design is **COMPLETE** when order/payment/fulfillment statuses are independent, every transition has a guard and an event, and refunds/restocks are gated on inspection.

---

## Related Skills

- **payments-architecture**: capture/refund and webhook reliability for order events.
- **inventory-stock**: reservations released and stock decremented per fulfillment.
- **cart-checkout**: hands the placed order into this lifecycle.
- **commerce-analytics**: order events feed funnel and revenue metrics.
