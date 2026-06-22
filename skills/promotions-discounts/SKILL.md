---
name: promotions-discounts
description: "Design a promotions and discount engine — coupon codes, automatic discounts, BOGO, tiered/volume pricing, stacking and exclusivity rules, and gift cards. Platform-agnostic rules modeling that avoids margin leaks. Triggers: designing discounts, defining stacking rules, modeling gift cards/coupons."
argument-hint: "[design | rules | audit]"
category: "ecommerce"
user-invocable: true
allowed-tools: Read, Glob, Grep
---

# Promotions & Discounts

Discounts are easy to add and hard to control. Model the rules so promotions stack predictably, can't be abused, and never quietly destroy margin — independent of platform.

## Before Starting

Gather: promotion types in use, who can stack with what, abuse history (code sharing, repeat redemption), and goal (design the engine, define stacking/exclusivity rules, or audit existing promos for leaks).

## How This Skill Works

| Mode | Trigger | Output |
|------|---------|--------|
| **Design** | `design` | Discount engine model + rule schema |
| **Rules** | `rules` | Stacking, exclusivity, and eligibility matrix |
| **Audit** | `audit` | Margin-leak and abuse-risk review |

---

## Phase 1 — Discount Model

Model every promotion as **trigger → condition → effect → constraints**:

| Part | Examples |
|------|----------|
| **Trigger** | code entered, automatic, cart threshold |
| **Condition** | min subtotal, specific collection, customer segment, first order |
| **Effect** | % off, fixed off, free shipping, BOGO, fixed price |
| **Constraints** | usage cap (global/per-customer), date window, exclusivity |

**Rule:** Discounts apply to a defined scope (line / shipping / order) and are recomputed server-side at checkout — never client-trusted.

---

## Phase 2 — Stacking & Exclusivity

The hard part. Define explicitly:

- **Stackable vs exclusive:** most stores allow one order-level code; auto-discounts may stack with codes. Decide and enforce.
- **Application order** matters for % vs fixed — define it (typically line discounts → order discounts → shipping).
- **Priority** when multiple eligible: best-for-customer vs best-for-merchant — pick a policy.
- **Caps:** max discount per order; floor on post-discount margin.

For the full eligibility matrix and worked stacking examples, model the matrix per the table above.

---

## Phase 3 — Gift Cards & Abuse Prevention

- **Gift cards** are stored-value tender, not discounts — track balance, partial redemption, and never let balance go negative or expire silently where regulated.
- **Abuse defenses:** per-customer usage caps, one-time codes, segment gating, and minimum-order thresholds. Watch for code leaks to coupon sites.

---

## Output Artifacts

| Request | Output |
|---------|--------|
| Design | Rule schema + effect/scope model |
| Rules | Stacking/exclusivity matrix + application order |
| Audit | Leak/abuse findings: PASS / CONCERNS / FAIL |

A promotion engine is **COMPLIANT** when discounts are server-computed, stacking and application order are explicit, usage caps are enforced, and a margin floor protects every order.

---

## Related Skills

- **cart-checkout**: applies discounts at the cart/checkout.
- **pricing-strategy**: sets the base prices discounts modify.
- **commerce-analytics**: measures promo ROI and margin impact.
- **referral-program**: a specialized promotion type.
