# The Referral Loop & Incentive Design

## The Referral Loop

Every referral program runs on the same 4-stage loop. If any stage is weak, the loop breaks.

```
[Trigger Moment] → [Share Action] → [Referred User Converts] → [Reward Delivered] → [Loop]
```

### Stage 1: Trigger Moment
This is when you ask customers to refer. Timing is everything.

**High-signal trigger moments:**
- **After aha moment** — when the customer first experiences core value (not at signup — too early)
- **After a milestone** — "You just saved your 100th hour" / "Your 10th team member joined"
- **After great support** — post-resolution NPS prompt → if 9-10, ask for referral
- **After renewal** — customers who renew are telling you they're satisfied
- **After a public win** — customer tweets about you → follow up with referral link

**What doesn't work:** Asking on day 1, asking in onboarding emails, asking in the footer of every email.

### Stage 2: Share Action
Remove every possible point of friction.

- Pre-filled share message (editable, not locked)
- Personal referral link (not a generic coupon code)
- Share options: email invite, link copy, social share, Slack/Teams share for B2B
- Mobile-optimized for consumer products
- One-click send — no manual copy-paste required

### Stage 3: Referred User Converts
The referred user lands on your product. Now what?

- Personalized landing ("Your friend Alex invited you — here's your bonus...")
- Incentive visible on landing page
- Referral attribution tracked from landing to conversion
- Clear CTA — don't make them hunt for what to do

### Stage 4: Reward Delivered
Reward must be fast and clear. Delayed rewards break the loop.

- Confirm reward eligibility as soon as referral signs up (not when they pay)
- Notify the referrer immediately — don't wait until month-end
- Status visible in dashboard ("2 friends joined — you've earned $40")

---

## Incentive Design

### Single-Sided vs. Double-Sided

**Single-sided** (referrer only gets rewarded): Use when your product has strong viral hooks and customers are already enthusiastic. Lower cost per referral.

**Double-sided** (both referrer and referred get rewarded): Use when you need to overcome inertia on both sides. Higher cost, higher conversion. Dropbox made this famous.

**Rule:** If your referral rate is <1%, go double-sided. If it's >5%, single-sided is more profitable.

### Reward Types

| Type | Best For | Examples |
|------|----------|---------|
| Account credit | SaaS / subscription | "Get $20 credit" |
| Discount | Ecommerce / usage-based | "Get 1 month free" |
| Cash | High LTV, B2C | "$50 per referral" |
| Feature unlock | Freemium | "Unlock advanced analytics" |
| Status / recognition | Community / loyalty | "Ambassador status, exclusive badge" |
| Charity donation | Enterprise / mission-driven | "$25 to a cause you choose" |

**Sizing rule:** Reward should be ≥10% of first month's value for account credit. For cash, cap at 30% of first payment. Run `scripts/referral_roi_calculator.py` to model reward sizing against your LTV and CAC.

### Tiered Rewards (Gamification)
When you want referrers to go from 1 referral to 10:

```
1 referral  → $20 credit
3 referrals → $75 credit (25/referral) + bonus feature
10 referrals → $300 cash + ambassador status
```

Keep tiers simple. Three levels maximum. Each tier should feel meaningfully better, not just slightly better.
