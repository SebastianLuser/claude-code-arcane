---
name: network-map
description: "Turn your LinkedIn connections data export into warm-intro intelligence: find your 1st-degree contacts at a target company, identify likely warm-intro paths, and draft a tailored outreach message per contact. Triggers: my network, LinkedIn networking, contacts at a company, warm intro, referral, who do I know at, LinkedIn connections export."
argument-hint: "[company] | import <path-to-Connections.csv>"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Network Map - Contact intelligence for warm intros

You turn the **LinkedIn connections export** into actionable intelligence: given a target company, who in your 1st-degree network works (or worked) there, who can give you a warm intro, and a custom message per contact. It replaces LinkedIn Premium for this: you only need your own export + Claude.

## Getting the export (once)

On LinkedIn → **Settings → Data Privacy → Get a copy of your data → Download**. The ZIP contains `Connections.csv` (your 1st-degree connections with name, URL, company, position, connection date). Hand it to the skill.

> **Privacy:** `Connections.csv` is third parties' personal data. Keep it in the workspace's `05-Contacts/` and **never** commit it to a remote. Work on it locally.

## What it produces

Given a target company:
1. **1st-degree at the company** - your contacts who work there now (match by `Company`).
2. **Warm-intro paths** - 1st-degree contacts who probably know people at the target (e.g. former employees of the company, people in the same field/role) and could introduce you. *Honest note:* the export only has your 1st-degree connections; the real 2nd degree (their connections) is not in the file. What we do is **infer** good intro candidates from your 1st-degree (current/past employment at the target, company/role overlap), not read each person's network.
3. **Message per contact** - a custom template based on shared history (same past company, same field, old vs recent connection).

## The engine

`scripts/network_map.py` parses `Connections.csv` (it handles the export's preamble) and filters/ranks by company.

```bash
# Contacts at a company
python scripts/network_map.py --csv "05-Contacts/Connections.csv" --company "Acme"

# Top companies where you have the most contacts (discover opportunities)
python scripts/network_map.py --csv "05-Contacts/Connections.csv" --top-companies
```

It returns name, position, company, profile URL and connection date. You (Claude) take that output and build the intro paths and the messages.

## Modes

### `import <path>` - Register the export
Copy/reference `Connections.csv` in `05-Contacts/`, verify that it parses (run the script with `--top-companies`), and report the network size + top companies.

### `[company]` - Map a company
1. Run the script filtering by the company.
2. Classify: current 1st-degree at the company vs warm-intro candidates (former employees / same field).
3. Prioritize by relevance (seniority/role vs your goal) and warmth (recent connection, shared history).
4. Draft a message per top contact (lean on `/cold-outreach` for tone and templates).
5. Save relevant contacts as notes in `05-Contacts/` (template `Contact`).

## Rules

- Third-party data: local handling, never to a remote without confirmation; respect privacy.
- Do not invent relationships or a 2nd degree the export does not support - be explicit about what is data and what is inference.
- Quality over quantity: 5 well-chosen contacts > 50 generic messages.

## Handoff

Ask for approval before writing contact notes or copying the CSV into the workspace. When the map is READY, the next step is `/cold-outreach` to draft the messages and schedule follow-ups.
