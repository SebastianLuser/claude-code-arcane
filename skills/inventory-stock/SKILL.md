---
name: inventory-stock
description: "Design inventory and stock control — availability tracking, optimistic locking to prevent overselling, reservations, multi-location, backorders, and restock forecasting. Includes a safety-stock/reorder-point calculator. Triggers: designing inventory, fixing overselling, forecasting restock."
argument-hint: "[design | forecast | audit]"
category: "ecommerce"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Inventory & Stock

Stock is where data integrity meets revenue: oversell and you lose trust, over-reserve and you lose sales. Design availability that is correct under concurrency and forecast restocks from real demand — platform-agnostic.

## Before Starting

Gather: inventory model (single vs multi-location), sales velocity and lead times, fulfillment style (own stock, dropship, backorder), and goal (design the model, forecast restock, or audit for oversell risk).

## How This Skill Works

| Mode | Trigger | Output |
|------|---------|--------|
| **Design** | `design` | Availability model + concurrency strategy |
| **Forecast** | `forecast` | Safety stock + reorder points (via script) |
| **Audit** | `audit` | Oversell-risk and accuracy review |

---

## Phase 1 — Availability Model

Track three numbers per SKU per location, never one:

| Quantity | Meaning |
|----------|---------|
| **on_hand** | Physically present |
| **reserved** | Allocated to unfulfilled orders/checkouts |
| **available** | `on_hand − reserved` — the only number a shopper sees |

**Rule:** Reserve at checkout start with a TTL; release on timeout/abandonment. Decrement `on_hand` at fulfillment, not at order placement.

---

## Phase 2 — Preventing Overselling

The classic race: two shoppers buy the last unit. Defenses, in order of preference:

1. **Optimistic locking** — version/row check on decrement; retry on conflict. Default choice.
2. **Atomic conditional update** — `UPDATE ... WHERE available >= qty` and check rows-affected.
3. **Pessimistic lock** — only for high-contention single rows; costs throughput.

Always treat "reserve stock" as a transaction that can FAIL and surface that to checkout cleanly. Multi-location adds an allocation step (which location fulfills) before the decrement.

For backorder rules, multi-location allocation strategies, and reservation TTL tuning, see the patterns above and hand off to `order-lifecycle` for fulfillment state.

---

## Phase 3 — Restock Forecasting

Use the script to turn a sales CSV into reorder points:

```bash
python skills/inventory-stock/scripts/restock_forecast.py            # demo data
python skills/inventory-stock/scripts/restock_forecast.py sales.csv --lead-time 14 --service-level 0.95
```

It computes average daily demand, demand variability, **safety stock** (`z × σ_demand × √lead_time`), and **reorder point** (`demand × lead_time + safety_stock`). CSV columns: `sku,date,units_sold`.

---

## Output Artifacts

| Request | Output |
|---------|--------|
| Design | Availability model + chosen concurrency strategy |
| Forecast | Per-SKU reorder point + safety stock table |
| Audit | Oversell-risk findings: PASS / FAIL per check |

An inventory design **PASSES** when shoppers only see `available`, reservations expire, decrements are atomic/versioned, and forecasts drive reorder points instead of guesswork.

---

## Related Skills

- **commerce-data-model**: defines the SKU/variant that stock hangs off.
- **order-lifecycle**: consumes reservations and triggers decrements at fulfillment.
- **cart-checkout**: starts the reservation when checkout begins.
- **commerce-analytics**: sell-through and turnover metrics that feed forecasts.
