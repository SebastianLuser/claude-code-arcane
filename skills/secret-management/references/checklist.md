# Checklist

- [ ] Secret Manager configured (GCP/AWS/Vault)
- [ ] Least-privilege runtime SA (secretAccessor only)
- [ ] .gitignore covers .env, *.key, *.pem
- [ ] gitleaks pre-commit + CI, GitHub Secret Scanning ON
- [ ] OIDC in CI (no JSON keys)
- [ ] Envelope encryption for PII in the DB
- [ ] No secrets in Docker build args or the mobile bundle
- [ ] Rotation: prod 90d, emergency immediately
- [ ] Leak process documented (runbook)
- [ ] Audit logs + off-hours alerts
- [ ] Dev onboarding via Doppler/SOPS, not Slack
