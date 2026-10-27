# Anti-patterns

- Secrets in git, `.env` as the prod source of truth, secrets over Slack/email
- SA JSON as a GitHub secret (use OIDC), sharing a secret across envs
- No rotation for >1 year, logging without scrubbing (`console.log(process.env)`)
- Secret in a URL/querystring, in mobile code, in Docker build args, on disk (/tmp/sa.json)
- A single admin with full access (bus factor)
