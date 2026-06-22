---
name: subscription-billing
description: "Design recurring billing for commerce — subscription models, billing cycles, proration, trials, plan changes, and dunning/recovery for involuntary churn. Processor-agnostic; hands implementation to processor-specific skills. Triggers: designing subscriptions, modeling proration/plan changes, reducing involuntary churn via dunning."
argument-hint: "[design | dunning | audit]"
category: "ecommerce"
user-invocable: true
allowed-tools: Read, Glob, Grep
---

# Subscription Billing

Recurring revenue adds a time dimension that one-time commerce never faces: cycles, proration, failed renewals, and dunning. Model it correctly so revenue is predictable and involuntary churn doesn't quietly bleed the business — independent of processor.

## Before Starting

Gather: offering (subscribe-and-save, membership, SaaS-style tiers), billing cadence, trial/plan-change rules, and goal (design the model, design dunning/recovery, or audit existing billing).

## How This Skill Works

| Mode | Trigger | Output |
|------|---------|--------|
| **Design** | `design` | Subscription + cycle + proration model |
| **Dunning** | `dunning` | Failed-payment recovery flow |
| **Audit** | `audit` | Revenue-leak and churn-risk review |

---

## Phase 1 — Subscription Model

| Concept | Decision |
|---------|----------|
| **Plan** | Price + interval + included entitlements |
| **Cycle** | Anchor date; calendar vs signup-aligned |
| **Trial** | Free / paid / card-required — and what happens at trial end |
| **Proration** | On upgrade/downgrade: credit unused time, charge difference |
| **State** | active → past_due → cancelled / paused / expired |

**Rule:** A subscription is a state machine over time — model `past_due` explicitly; it's where recoverable revenue lives. Reuse `order-lifecycle` thinking for state/events.

---

## Phase 2 — Proration & Plan Changes

- **Upgrade:** charge prorated difference immediately or at next cycle — pick a policy and state it.
- **Downgrade:** typically defer to next cycle (avoid refund complexity).
- **Pause/skip:** common in physical subscribe-and-save; preserve the schedule.
- Always show the customer the next charge amount and date before confirming a change.

---

## Phase 3 — Dunning & Involuntary Churn

Most subscription churn is **involuntary** — failed card charges, not cancellations. Recover it:

1. **Smart retries** — retry on a schedule (e.g. day 1, 3, 5, 7), not immediately; align to paydays where known.
2. **Pre-dunning** — warn before card expiry; prompt card update.
3. **Dunning emails** — escalating sequence during `past_due` with a one-click update link.
4. **Grace period** — keep access during retries; downgrade/cancel only after the window.

Processor specifics (retry config, webhooks) hand off to `stripe-integration-expert`.

---

## Output Artifacts

| Request | Output |
|---------|--------|
| Design | Plan/cycle/proration/state model |
| Dunning | Retry schedule + email sequence + grace policy |
| Audit | Leak/churn findings: PASS / CONCERNS / FAIL |

A subscription billing design is **COMPLETE** when `past_due` is modeled, proration policy is explicit, the customer always sees the next charge, and a dunning sequence recovers involuntary churn.

---

## Related Skills

- **payments-architecture**: recurring charges and webhook reliability.
- **stripe-integration-expert**: processor-specific subscription implementation.
- **churn-prevention**: voluntary-churn (cancellation) reduction.
- **commerce-analytics**: MRR, retention, and recovery metrics.
