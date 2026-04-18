---
name: create-ticket
description: "Workflow conversacional para crear ticket en Jira: gather title/description/AC/priority/type via dialogo, formatea en Jira markdown, crea via API y devuelve URL. Para gestion masiva o queries complejas usar /jira-tickets."
argument-hint: "[project-key] [title]"
user-invocable: true
allowed-tools: Read, Bash
---

# Skill: create-ticket

## Trigger

When the user says "create ticket", "nuevo ticket", "crear ticket", or similar.

## Workflow

1. Ask the user for:
   - **Title**: short description of the task
   - **Description**: what needs to be done (functional requirements)
   - **Acceptance criteria**: how do we know it's done?
   - **Priority**: if not provided, default to Medium
   - **Type**: Bug, Story, Task (if not provided, infer from description)

2. If the user provides incomplete info, ask follow-up questions about:
   - Scope: what's included and what's NOT included
   - Edge cases: what should happen in unusual scenarios
   - Testing requirements: how should this be tested

3. Create the ticket in Jira using the credentials from `~/.config/jira/credentials`:
   - Use the project key from context or ask the user (default options: ALZ, TICH, TUNI, VIA)
   - Format the description in Jira markdown
   - Include acceptance criteria as a checklist
   - Use `curl` against `$JIRA_BASE_URL/rest/api/3/issue` (see `/jira-tickets` for full payload reference)

4. Return the ticket URL to the user: `https://aula-educabot.atlassian.net/browse/{KEY}-{NUM}`

## Notes

- Always write tickets in Spanish (the team's working language)
- Keep titles concise (under 80 characters)
- Separate functional requirements from technical requirements
- Technical enrichment happens AFTER ticket creation, not during
- For bulk creation, search, transitions, or sprint reports use `/jira-tickets` instead

## Recommended Next

After ticket creation:
- `/jira-tickets transition <KEY-NUM>` to move it through the workflow
- `/jira-tickets search` to find related tickets
