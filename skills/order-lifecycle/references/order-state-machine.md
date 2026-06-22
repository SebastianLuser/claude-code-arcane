# Order State Machine — Transitions, Guards & Events

Three independent dimensions. Keep them separate; the overall order status is a projection, not a stored mega-enum.

## Order status
| From | To | Guard | Event |
|------|----|-------|-------|
| (start) | pending | order placed | `order.created` |
| pending | confirmed | payment authorized | `order.confirmed` |
| confirmed | in_progress | fulfillment started | `order.processing` |
| in_progress | completed | all items fulfilled | `order.completed` |
| pending/confirmed | cancelled | not yet shipped | `order.cancelled` |

## Payment status
| From | To | Guard | Event |
|------|----|-------|-------|
| pending | authorized | auth succeeded | `payment.authorized` |
| authorized | paid | captured | `payment.captured` |
| paid | partially_refunded | refund < captured | `payment.refunded` |
| paid | refunded | refund == captured | `payment.refunded` |
| pending/authorized | failed | gateway decline | `payment.failed` |

## Fulfillment status
| From | To | Guard | Event |
|------|----|-------|-------|
| unfulfilled | partially_fulfilled | some lines shipped | `fulfillment.partial` |
| partially_fulfilled | fulfilled | all lines shipped | `fulfillment.completed` |
| fulfilled | returned | RMA received | `return.received` |

## Cross-dimension guards (the important rules)
- Cannot transition fulfillment past `unfulfilled` until payment is `authorized` (or `paid`, per capture policy).
- Cannot `cancel` once any line is `fulfilled` — use returns instead.
- Capture timing: auth at placement, capture at first fulfillment (auth/capture model) OR capture immediately (decide once).

## Returns / RMA sub-flow
`return.requested → approved → label_sent → in_transit → received → inspected → (refunded | rejected)`

| Concern | Rule |
|---------|------|
| Window | Guard `requested` against return-window from delivery date |
| Restock | Only on `inspected` pass → quantity back to `available` |
| Refund | ≤ captured amount; full / partial / store-credit |
| Partial | Per line item for split fulfillment |

## Events are append-only
Persist every event with: id, order_id, type, payload, timestamp, idempotency_key. Current state = fold over events. Outbound webhooks must be signed, deduplicated, and retried (see `payments-architecture`).

## Verdict: COMPLETE when
- [ ] Order / payment / fulfillment statuses are independent fields
- [ ] Every transition has a guard and emits an event
- [ ] Cancel blocked after fulfillment; returns handle post-ship
- [ ] Restock gated on inspection; refunds capped at captured amount
- [ ] Events are append-only with idempotency keys
