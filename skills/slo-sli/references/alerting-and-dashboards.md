# Alert design, on-call and dashboards

Burn-rate alerts (`alerting-burn-rate.md`) cover the SLO itself. This covers every other alert, the people who receive them, and the dashboards they open.

## Alert design

An alert pages a person only if all four are true:

1. **It is a symptom users feel** (errors, latency, a stuck queue), not a cause (CPU, memory, GC). Causes go to dashboards or tickets.
2. **It needs action now.** If it can wait until morning, it is a ticket.
3. **The receiver can act on it.** It links a runbook with the first three checks and the usual fixes.
4. **It is rare.** An alert that fires and is ignored trains people to ignore alerts.

| Severity | Route | Example |
|---|---|---|
| **Page** | On-call phone, 24/7 | Fast burn, checkout failing, data loss risk |
| **Ticket** | Team queue, business hours | Slow burn, disk at 80%, certificate expiring in 14 days |
| **Info** | Dashboard only | Deploys, autoscaling events |

Every alert carries: service, severity, what users feel, current value vs threshold, dashboard link, runbook link, and the recent deploy if there was one. Group related alerts (one incident, one page) and set a `for:` duration so a single bad scrape does not page.

## On-call

- A rotation of at least 4–5 people, one week each, with a secondary for escalation after 15 minutes without acknowledgement.
- Handoff at the start of each shift: open incidents, silenced alerts, risky deploys.
- Track pages per shift. More than about 2 actionable pages per shift, or any page that needed no action, means an alert to fix or delete this sprint.
- Tools: PagerDuty, Opsgenie or Grafana OnCall for schedules and escalation; Alertmanager or Grafana alerting for routing (`group_by`, `inhibit_rules` so a downstream outage does not page every upstream service).

## Alert fatigue review (monthly)

For each alert that fired: was it actionable, was the runbook enough, could it have been a ticket? Delete or downgrade alerts nobody acted on. Raise thresholds that fire on normal peaks (the school-hours peak, for Educabot services) instead of silencing them.

## Dashboards

One dashboard per service, top to bottom in the order of an investigation:

| Row | Panels |
|---|---|
| **1. SLO** | SLI vs target, error budget remaining, burn rate |
| **2. RED** (requests) | Rate, error %, duration p50/p95/p99, split by endpoint |
| **3. Dependencies** | Latency and errors per database, cache, external API, LLM provider |
| **4. USE** (resources) | Utilization, saturation, errors for CPU, memory, connections, queue depth |
| **5. Changes** | Deploy and config-change annotations on every graph |

Rules: the same time range and variables (`env`, `service`) on every panel; no panel without a unit and a threshold line; dashboards stored as code (JSON or Terraform) so they are reviewed like code.
