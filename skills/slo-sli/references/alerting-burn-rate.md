# Alerting Multi-window Multi-burn-rate

Replaces fixed thresholds. Two alerts per SLO:

- **Fast burn (page):** 5min+1h window, burn rate 14.4x -> consumes 2% of the budget in 1h. Page to on-call.
- **Slow burn (ticket):** 30min+6h window, burn rate 6x -> consumes 10% of the budget in 6h. Non-urgent ticket.

Implement with Prometheus recording rules (pre-compute error ratios at 5m, 1h, 30m, 6h) + Alertmanager rules. Formula: threshold = `burn_rate x (1 - SLO)`. E.g.: SLO 99.9% -> `14.4 x 0.001 = 0.0144`.

## GCP Cloud Monitoring (Terraform)

Native alternative if you already use Cloud Monitoring: `google_monitoring_custom_service` + `google_monitoring_slo` (request_based_sli, rolling_period_days 30) + `google_monitoring_alert_policy` (select_slo_burn_rate, threshold 14.4).

## Internal dashboard

Public for product + engineering. Minimum: current SLO (30d rolling) per service/tier, error budget remaining (%, minutes), current burn rate (1h, 6h), top 5 endpoints consuming the most budget, incident history with a postmortem link.

## Quarterly review

- **Consistently over-delivering** (e.g.: SLO 99.9%, actual 99.99% for 2 quarters): the SLO is lax, raise it or allow more experimentation
- **Consistently missing:** unrealistic target or technical debt, lower the SLO temporarily + an improvement plan
- **Flows changed:** re-evaluate which SLIs matter
