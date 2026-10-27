# Tools — OWASP Audit

| Type | Go | TS/JS | Generic |
|------|-----|-------|----------|
| SAST | gosec, staticcheck | semgrep, eslint-plugin-security | semgrep |
| Deps | govulncheck | npm audit, snyk | trivy, grype |
| Container | — | — | trivy image, docker scout |
| DAST | — | — | OWASP ZAP, Burp Suite |
| Secrets | — | — | gitleaks, trufflehog |
