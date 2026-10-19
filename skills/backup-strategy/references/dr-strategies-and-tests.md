# DR strategies and DR tests

## Choosing a strategy

Pick per service from its RTO and RPO; most services do not need the expensive tiers.

| Strategy | What runs in the second region | RTO | RPO | Cost |
|---|---|---|---|---|
| **Backup and restore** | Nothing; backups are copied there | Hours | Last backup or PITR point | Lowest |
| **Pilot light** | Data replicated (database replica, storage replication); compute defined in IaC but off | Tens of minutes to hours | Minutes | Low |
| **Warm standby** | A scaled-down full copy, running and receiving replicated data | Minutes | Seconds to minutes | Medium |
| **Multi-site active/active** | Full capacity serving traffic in both | Near zero | Near zero | Highest; also hard: write conflicts and data residency |

Rules:

- The strategy only works if the infra is code: a region you cannot rebuild from `terraform apply` (or the platform's config) is not a DR plan.
- DNS and traffic failover (health-checked DNS, a global load balancer) are part of the design; record their TTL, since it adds to the RTO.
- Secrets, container images and IaC state must also exist outside the failed region or account.

## DR tests

| Test | Frequency | What it proves |
|---|---|---|
| **Restore test** | Monthly (main skill) | Backups are restorable and complete |
| **Tabletop exercise** | Quarterly | The team knows the runbook: walk a scenario (region down, account compromised) on paper, find the missing steps |
| **Component failover** | Twice a year | One piece (database replica promotion, DNS failover) switches as documented |
| **Full failover game day** | Yearly, for tier-1 services | The whole service runs from the DR site within the target RTO |

For each test record: scenario, date, who ran it, measured RTO and RPO vs target, the steps that failed or were missing, and the follow-up tickets. A test that found nothing to fix usually did not test enough.

Game days run in a planned window, with rollback criteria and the on-call team aware; never the first failover attempt during a real outage.
