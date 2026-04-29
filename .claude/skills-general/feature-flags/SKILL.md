---
name: feature-flags
description: "Feature flag strategy: types, provider selection, lifecycle, naming, rollout, cleanup"
category: "operations"
argument-hint: "[setup|audit|cleanup]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# feature-flags — Feature Flags & Rollouts

Separate deploy from release. Enable gradual rollouts, kill switches, and experiments.

## When to use

- Risky feature needing rollback safety
- Gradual rollout (1% -> 10% -> 50% -> 100%)
- Kill switch for incident response
- A/B experiments with segments
- Dark launches (code in prod, not visible)

## When NOT to use

- Runtime config (use env vars / ConfigMap)
- Permissions / RBAC (use auth system)
- Permanent per-user personalization (not a flag)

---

## Flag types

| Type | Purpose | Lifetime | Example |
|------|---------|----------|---------|
| **Release** | Separate deploy from release | Days-weeks | `dashboard-new-layout` |
| **Experiment** | A/B test | Weeks | `exp-onboarding-v2` |
| **Ops** | Kill switch / circuit breaker | Months-permanent | `ops-disable-heavy-query` |
| **Permission** | Entitlements by plan/role | Permanent | `feature-x-pro-plan` |

Release flags MUST have an expiration date. Ops flags may be permanent.

## Provider selection

| Provider | When to use |
|----------|-------------|
| **GrowthBook** | Default — open source, self-hosted, A/B integrated |
| **Unleash** | Mature OSS alternative, strong multi-language SDK |
| **LaunchDarkly** | SaaS, best UX, budget available, no self-host desire |
| **Env vars / DB row** | AVOID — reinvents the wheel, no audit trail |

## Naming convention

- kebab-case: `<area>-<what>[-<version>]`
- Prefix by type: `exp-` (experiment), `ops-` (ops), no prefix for release
- Include domain area, avoid ambiguous names like `test` or `new-feature`

## Evaluation patterns

- **Backend:** server-side eval, resolved before response
- **Frontend:** hydrate from backend or SDK with local cache
- **Mobile:** local cache + refresh on foreground, fallback to defaults offline

## Targeting & rollout

- Gradual: 0% -> 1% (canary) -> 5% -> 25% -> 50% -> 100%, 24-48h between steps
- Cohort: plan, country, creation date, internal emails (dogfooding)
- Sticky hashing on userId for consistent UX
- Kill switch: flag always ON, turn OFF during incidents

## Lifecycle management

Every flag at creation MUST have:
- **Owner** (person responsible)
- **Type** (release / experiment / ops / permission)
- **Expiration** (release: 30-60d; experiment: end of test; ops: permanent)
- **Cleanup ticket** linked in tracker

### Cleanup process
1. Detect stale flags (100% ON or OFF for >30 days)
2. Remove SDK calls, keep winning branch only
3. Delete dead code from losing branch
4. Archive flag in provider (preserve audit trail)

## Checklist

- [ ] SDK client keys (read-only) in client, admin API keys server-only
- [ ] Sensitive flags (billing, permissions) evaluated server-side only
- [ ] Audit logging enabled on flag changes
- [ ] Admin console requires 2FA

## Anti-patterns

- Flag without owner/expiration — becomes permanent zombie
- Evaluating flag on every code line — evaluate once per request, pass result
- Using flags for runtime config — use env vars
- Complex targeting with sensitive data on client — move server-side
- Deleting flag without code cleanup — dead branch forever
- Flag without success metric — cannot measure impact
- Multiple interacting flags without documented matrix — combinatorial bugs
- Rollout 0->100% directly — defeats the purpose of gradual rollout
