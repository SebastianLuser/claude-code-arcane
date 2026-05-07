---
name: stripe-integration-expert
description: "Implement production-grade Stripe integrations: subscriptions with trials and proration, one-time payments, usage-based billing, checkout sessions, idempotent webhook handlers, customer portal, and invoicing."
category: "backend"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Stripe Integration Expert

Implement production-grade Stripe integrations covering subscriptions, payments, webhooks, and billing. Covers Next.js, Express, and Django patterns.

> **Note:** This skill may create or modify files in your project. It will ask before writing.

## Core Capabilities

- Subscription lifecycle management (create, upgrade, downgrade, cancel, pause)
- Trial handling and conversion tracking
- Proration calculation and credit application
- Usage-based billing with metered pricing
- Idempotent webhook handlers with signature verification
- Customer portal integration
- Invoice generation and PDF access
- Full Stripe CLI local testing setup

## When to Use

- Adding subscription billing to any web app
- Implementing plan upgrades/downgrades with proration
- Building usage-based or seat-based billing
- Debugging webhook delivery failures
- Migrating from one billing model to another

## Subscription Lifecycle State Machine

```
FREE_TRIAL --paid--> ACTIVE --cancel--> CANCEL_PENDING --period_end--> CANCELED
     |                  |                                                    |
     |               downgrade                                          reactivate
     |                  v                                                    |
     |             DOWNGRADING --period_end--> ACTIVE (lower plan)           |
     |                                                                       |
     +--trial_end without payment--> PAST_DUE --payment_failed 3x--> CANCELED
                                          |
                                     payment_success
                                          v
                                        ACTIVE
```

### DB subscription status values:
`trialing | active | past_due | canceled | cancel_pending | paused | unpaid`

## Common Pitfalls

- **Webhook delivery order not guaranteed** -- always re-fetch from Stripe API, never trust event data alone for DB updates
- **Double-processing webhooks** -- Stripe retries on 500; always use idempotency table
- **Trial conversion tracking** -- store `hasHadTrial: true` in DB to prevent trial abuse
- **Proration surprises** -- always preview proration before upgrade; show user the amount before confirming
- **Customer portal not configured** -- must enable features in Stripe dashboard under Billing > Customer portal settings
- **Missing metadata on checkout** -- always pass `userId` in metadata; can't link subscription to user without it

## Code Examples

> See references/stripe-code-examples.md for complete implementation code covering client setup, checkout sessions, subscription upgrades, webhook handlers, usage-based billing, customer portal, feature gating, and Stripe CLI testing.
