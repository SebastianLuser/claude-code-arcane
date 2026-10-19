# Playbooks and communication

## Playbook: compromised credentials

Trigger: a leaked key (secret scanning, a public repo, a log), a login from an unknown place, a provider alert, or a supply-chain compromise on a machine that held tokens.

1. **Validate and scope:** which credential (user, service account, API key, OAuth app, CI secret), what it can reach, since when it may be exposed.
2. **Contain, now:** revoke or rotate the credential and kill its sessions *before* investigating. Order: the credential itself → sessions and refresh tokens → anything it could have created.
   - GitHub: revoke the token or app installation; `gh auth status` on affected machines; review deploy keys.
   - npm: revoke tokens (`npm token list`, `npm token revoke <id>`), check recent publishes of your packages.
   - Cloud: deactivate the access key or service account key; force password reset and MFA re-enrolment for users.
   - App secrets: rotate in the secret manager and redeploy so running instances pick them up.
3. **Investigate:** the audit log of that identity (GitHub audit log, CloudTrail, GCP Audit Logs, Azure Activity Log) from the first possible exposure. Look for persistence: new keys, users, roles, OAuth apps, webhooks, CI workflows, deploy keys.
4. **Eradicate:** remove every persistence found; rotate whatever the attacker could have read with the credential (secrets in the same vault, env vars in the same CI project).
5. **Recover:** new credentials with least privilege and MFA, short expiry; watch them for unusual use for a few weeks.
6. **Improve:** close the leak path (secret scanning with push protection, no long-lived keys, OIDC in CI) and record it in the post-mortem (`/incident`).

## AI incident classes

| Class | Signal | First actions |
|---|---|---|
| **Availability** | Provider errors or timeouts, rate-limit storms | Provider status page; fail over to the fallback model or provider (gateway); degrade the feature gracefully; freeze deploys |
| **Quality** | Eval score, groundedness or tool-success drop; complaints | Check what changed in the last 24 h (model version, prompt, retrieval index); roll that back; run the eval suite against production (`/llm-evals`) |
| **Safety** | Policy-violating output, a successful prompt injection, an agent taking an unintended action | Disable the affected tool or feature (kill switch); keep the transcripts as evidence; treat data exposure as a security incident |
| **Data exposure** | One user or tenant sees another's data, secrets or system prompt in output | SEV1: stop the feature, find the leak path (retrieval filter, shared cache, logs), notify per `regulatory-deadlines.md` |
| **Cost** | Spend per minute or per tenant spikes | Find the top consumers by tenant, route and model; cap tokens and requests; look for agent loops and cache bypass |

## Communication templates

Keep updates on a fixed cadence (every 30–60 minutes for SEV1–2) even when nothing changed; silence is read as "nobody is working on it".

**Internal notification (first 15 minutes)**

```text
[SEV<n>] <one-line summary>
Impact: <who is affected and how; numbers if known>
Status: investigating | contained | monitoring | resolved
Incident commander: <name>   Channel: <link>
Known so far: <facts only, no guesses>
Next update: <time>
```

**Stakeholder update**

```text
Incident <id> — update <n> at <time UTC>
What changed since the last update:
Current understanding of the cause:
Containment in place:
Decisions needed from you: <or "none">
Next update: <time>
```

**External notice of a data security incident** (send only after legal review; check the deadline that applies)

```text
What happened: <date discovered, short plain description>
What information was involved: <data categories, not "some data">
What we are doing: <containment, investigation, who we notified>
What you can do: <reset password, watch for phishing, concrete steps>
Contact: <a monitored channel>
```

Rules: facts only, no blame, no speculation about the attacker; one owner per message; every external message reviewed by the incident commander and, for data exposure, by legal.
