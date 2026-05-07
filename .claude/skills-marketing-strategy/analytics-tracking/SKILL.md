---
name: analytics-tracking
description: "Set up, audit, and debug analytics tracking — GA4, GTM, event taxonomy, conversion tracking, and data quality for SaaS funnels."
category: "marketing-strategy"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Analytics Tracking

Expert analytics implementation — every meaningful action captured accurately, consistently, and actionably.

## Before Starting

If `marketing-context.md` exists, read it first. Then gather: current state (GA4/GTM setup, tech stack, CMP), business context (conversion actions, micro-conversions, paid campaigns), and goals (from scratch, audit, or debug).

## How This Skill Works

- **Mode 1: Set Up From Scratch** — Build tracking plan, implement GA4/GTM, define events, configure conversions
- **Mode 2: Audit Existing** — Audit coverage, gap-fill, clean up data quality issues
- **Mode 3: Debug Issues** — Structured debugging for missing events, mismatched numbers, GTM preview issues

---

## Event Taxonomy Design

**Format:** `object_action` (snake_case, verb at end)

| Good | Bad |
|------|-----|
| `form_submit` | `submitForm`, `FormSubmitted` |
| `plan_selected` | `clickPricingPlan` |
| `checkout_completed` | `purchase`, `checkoutDone` |

**Rules:** Always `noun_verb`, lowercase + underscores only, consistent tense (`_started`, `_completed`, `_failed`).

For the full SaaS event taxonomy catalog, standard parameters, and custom dimension recommendations, see [references/event-taxonomy-guide.md](references/event-taxonomy-guide.md).

---

## GA4 Setup

1. Create property, add web data stream
2. Configure Enhanced Measurement (keep page views, scrolls, outbound clicks, search)
3. Add custom events via GTM data layer (preferred) or gtag
4. Mark conversions (max 30 per property): `signup_completed`, `checkout_completed`, `demo_requested`

---

## GTM Setup

Use data layer push pattern (most reliable):

```javascript
window.dataLayer.push({
  event: 'signup_completed',
  signup_method: 'email',
  user_id: userId
});
```

For full container structure, tag/trigger/variable patterns, and CSS selector click configuration, see [references/gtm-patterns.md](references/gtm-patterns.md).

---

## Cross-Platform Tracking

### UTM Convention

| Parameter | Convention | Example |
|-----------|-----------|---------|
| `utm_source` | Platform (lowercase) | `google`, `linkedin` |
| `utm_medium` | Traffic type | `cpc`, `email`, `social` |
| `utm_campaign` | Campaign ID | `q1-trial-push` |

**Rule:** Never tag organic/direct traffic with UTMs.

For attribution windows by platform, cross-domain tracking setup, and consent management impact, see [references/debugging-playbook.md](references/debugging-playbook.md).

---

## Data Quality

Common issues: duplicate events (GTM + hardcoded gtag), bot traffic, consent mode gaps. Under GDPR, implement Advanced Consent Mode via GTM for modeled data. Expected consent rate: 60-75% EU, 85-95% US.

For deduplication fixes, bot filtering, and consent mode configuration, see [references/debugging-playbook.md](references/debugging-playbook.md).

---

## Output Artifacts

| Request | Output |
|---------|--------|
| Build tracking plan | Event taxonomy, GA4 config, GTM structure |
| Audit tracking | Gap analysis, data quality scorecard (0-100) |
| Set up GTM | Tag/trigger/variable config per event |
| Debug missing events | Structured steps: GTM Preview + DebugView + Network tab |

---

## Related Skills

- **campaign-analytics**: For analyzing performance. NOT for implementation.
- **ab-test-setup**: For designing experiments. Events feed A/B tests.
- **gdpr-dsgvo-expert**: For GDPR compliance. This skill covers consent mode implementation.
