# Prometheus alert rules

Rule files live in the repo, are validated in CI with `promtool check rules alerts/*.yml`, and every alert links a runbook (`/runbooks`). SLO burn-rate alerts are in `/slo-sli`; these cover the rest.

```yaml
groups:
  - name: service
    rules:
      - alert: HighErrorRate
        expr: |
          sum by (service) (rate(http_requests_total{status=~"5.."}[5m]))
            / sum by (service) (rate(http_requests_total[5m])) > 0.05
        for: 10m
        labels: { severity: page }
        annotations:
          summary: "{{ $labels.service }}: {{ $value | humanizePercentage }} of requests fail"
          runbook_url: https://github.com/<org>/<repo>/blob/main/docs/runbooks/{{ $labels.service }}/high-error-rate-5xx.md

      - alert: HighLatencyP95
        expr: |
          histogram_quantile(0.95,
            sum by (service, le) (rate(http_request_duration_seconds_bucket[5m]))) > 1
        for: 10m
        labels: { severity: ticket }
        annotations:
          summary: "{{ $labels.service }}: p95 {{ $value | humanizeDuration }}"

      - alert: TargetDown
        expr: up == 0
        for: 5m
        labels: { severity: page }
        annotations:
          summary: "{{ $labels.job }} on {{ $labels.instance }} is not being scraped"

  - name: databases
    rules:
      - alert: PostgresDown
        expr: pg_up == 0
        for: 2m
        labels: { severity: page }
      - alert: PostgresConnectionsHigh
        expr: |
          sum by (instance) (pg_stat_activity_count)
            / on (instance) pg_settings_max_connections > 0.8
        for: 10m
        labels: { severity: ticket }
      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8 and redis_memory_max_bytes > 0
        for: 10m
        labels: { severity: ticket }
      - alert: MySQLReplicationLag
        expr: mysql_slave_status_seconds_behind_master > 300
        for: 5m
        labels: { severity: page }
```

Metric names come from the exporters (`postgres_exporter`, `mysqld_exporter`, `redis_exporter`) and change between versions: check them against what `/metrics` actually exposes before shipping the rule. On managed services, the provider's own metrics (Cloud Monitoring, CloudWatch) may replace the exporter.

## Rules for writing rules

- `for:` on every alert, so one bad scrape does not page.
- Aggregate with `sum by (service)` (or the labels you route on); an alert per pod or per instance floods on a scale-out.
- Alert on ratios and percentiles, not raw counts that grow with traffic.
- `severity` decides the route: `page` to on-call, `ticket` to the team queue (see `/slo-sli` → alerting and dashboards).

## Alertmanager routing

```yaml
route:
  receiver: team-tickets
  group_by: [alertname, service]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - matchers: [severity="page"]
      receiver: oncall-pager
inhibit_rules:
  - source_matchers: [alertname="TargetDown"]
    target_matchers: [severity="ticket"]
    equal: [service]
```

Inhibition keeps a down target from also firing every symptom alert of the same service. Test changes with `amtool check-config`, and send a test alert after every routing change.
