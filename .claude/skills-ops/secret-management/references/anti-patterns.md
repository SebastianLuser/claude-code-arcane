# Anti-patterns

- Secrets en git, `.env` como fuente de verdad prod, secrets por Slack/email
- SA JSON como GitHub secret (usar OIDC), compartir secret entre envs
- Sin rotacion >1 ano, logging sin scrubbing (`console.log(process.env)`)
- Secret en URL/querystring, en codigo mobile, en build args Docker, a disco (/tmp/sa.json)
- Un solo admin con acceso total (bus factor)
