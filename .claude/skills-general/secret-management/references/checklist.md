# Checklist

- [ ] Secret Manager configurado (GCP/AWS/Vault)
- [ ] Runtime SA least-privilege (solo secretAccessor)
- [ ] .gitignore cubre .env, *.key, *.pem
- [ ] gitleaks pre-commit + CI, GitHub Secret Scanning ON
- [ ] OIDC en CI (no JSON keys)
- [ ] Envelope encryption para PII en DB
- [ ] Sin secrets en build args Docker ni mobile bundle
- [ ] Rotacion: prod 90d, emergencia inmediata
- [ ] Proceso de leak documentado (runbook)
- [ ] Audit logs + alertas fuera de hora
- [ ] Dev onboarding via Doppler/SOPS, no Slack
