# Herramientas — OWASP Audit

| Tipo | Go | TS/JS | Generico |
|------|-----|-------|----------|
| SAST | gosec, staticcheck | semgrep, eslint-plugin-security | semgrep |
| Deps | govulncheck | npm audit, snyk | trivy, grype |
| Container | — | — | trivy image, docker scout |
| DAST | — | — | OWASP ZAP, Burp Suite |
| Secrets | — | — | gitleaks, trufflehog |
