# Error Tracking Anti-Patterns & Checklist

## Anti-patterns
- apiKey hardcoded, sin source maps/dSYM/Proguard, .map publicos
- Samplear errors <100%, enviar PII/datos menores, un project para todas las apps
- Release sin appVersion+commit, sin releaseStage, alertar info/warning
- Ignorar ruido (ahoga senal), no actuar en alta frecuencia, Bugsnag como logger

## Checklist
- [ ] Projects separados por app (web/mobile/api)
- [ ] API keys por env via env vars
- [ ] releaseStage + appVersion configurados
- [ ] Source maps subidos en CI (browser + Hermes), no publicos
- [ ] dSYM iOS + Proguard Android subidos en CI
- [ ] redactedKeys verificado (passwords, tokens, PII, DNI/CUIT)
- [ ] ErrorBoundary en React root
- [ ] unhandledRejection handler en Node
- [ ] Breadcrumbs en flows criticos
- [ ] User id + tenantId en metadata (sin email/PII menores)
- [ ] onError filter ruido conocido
- [ ] Alertas: new/regression -> Slack, spike -> PagerDuty
- [ ] Jira/ClickUp integration activa
- [ ] Triage daily + weekly documentado
