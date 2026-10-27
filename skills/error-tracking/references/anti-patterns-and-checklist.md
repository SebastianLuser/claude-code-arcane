# Error Tracking Anti-Patterns & Checklist

## Anti-patterns
- Hardcoded apiKey, no source maps/dSYM/Proguard, public .map files
- Sampling errors <100%, sending PII/minors' data, one project for every app
- Release without appVersion+commit, no releaseStage, alerting on info/warning
- Ignoring noise (it drowns the signal), not acting on high frequency, Bugsnag as a logger

## Checklist
- [ ] Separate projects per app (web/mobile/api)
- [ ] API keys per env via env vars
- [ ] releaseStage + appVersion configured
- [ ] Source maps uploaded in CI (browser + Hermes), not public
- [ ] iOS dSYM + Android Proguard uploaded in CI
- [ ] redactedKeys verified (passwords, tokens, PII, DNI/CUIT)
- [ ] ErrorBoundary at the React root
- [ ] unhandledRejection handler in Node
- [ ] Breadcrumbs in critical flows
- [ ] User id + tenantId in metadata (no email/minors' PII)
- [ ] onError filters known noise
- [ ] Alerts: new/regression -> Slack, spike -> PagerDuty
- [ ] Jira/ClickUp integration active
- [ ] Daily + weekly triage documented
