---
name: start
description: "Adaptive onboarding entry point. Detects project context and routes user to the right division/skill. Use on first session."
category: "workflow"
argument-hint: "[optional project hint]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Task, AskUserQuestion
---
# Start — Adaptive Onboarding

Entry point for new sessions. Detects context, asks key questions, routes to the right division.

## Step 1: Detect context

Scan in parallel: Unity (`ProjectSettings/ProjectVersion.txt`), Unreal (`*.uproject`), Web/Node (`package.json`), Go (`go.mod`), Python (`pyproject.toml`/`requirements.txt`), Flutter (`pubspec.yaml`), Rust (`Cargo.toml`), docs (`README.md`, `CLAUDE.md`, `design/`, `docs/`), session state (`.arcane/session-state/active.md`).

## Step 2: Determine the stage

| Stage | Signals |
|--------|---------|
| **A) Greenfield** | Empty directory or only the Arcane base |
| **B) Idea/concept** | Preliminary design docs, no implementation |
| **C) Design** | GDDs, specs, architecture docs, little code |
| **D) Development** | Existing code, active tickets, sprint in progress |
| **E) Mature** | Production deployed, multiple milestones, active users |

## Step 3: Adaptive questions

Multi-tab AskUserQuestion:
- **"Project" tab:** Start new / Work on existing / Explore Arcane / Ask about tools
- **"Type" tab:** Game / Web app / API-backend / Mobile app / Internal tool / Other
- **"Role" tab:** Developer / Product manager / Designer / PM-Scrum Master / Mix

## Step 4: Route to division

Several of these skills ship with other profiles and may not be installed: before recommending one, check that `.claude/skills/<name>/` exists, and if it is missing offer `/arcane-add <name>` instead of running it.

| Type | Role | Division | Key skills |
|------|-----|----------|-------------|
| Game | Dev | Game Dev | `/brainstorm`, `/scaffold-unity` (Unity) or `/ue-project-context` (Unreal), `/design-system` |
| Web app | Dev | Software Eng | `/nextjs-scaffold`, `/architecture-decision` |
| API | Dev | Software Eng | `/scaffold-go`, `/scaffold-fastify-ts` |
| Mobile | Dev | Software Eng | `/scaffold-react-native` |
| Game | Designer | Game Dev | `/brainstorm`, `/quick-design`, `/doc-gdd` |
| Web | Designer | Product | `/ux-design`, `/design-handoff` |
| Any | PM | PMO | `/sprint-plan`, `/clickup`, `/jira-tickets` |

## Step 5: Set session state

Create `.arcane/session-state/active.md`: project name, division, stage, user role, next action, stack detected, existing artifacts, recommended flow (3 commands).

## Step 6: First action

AskUserQuestion: primary recommendation (Recommended), secondary option, "See all skills", "Just exploring — bye".

## Routing Cheatsheet

- Game from scratch: `/start` → `/brainstorm` → `/scaffold-unity` (Unity) or `/ue-project-context` (Unreal) → `/art-bible` → `/design-system`
- Web app: `/start` → `/nextjs-scaffold` → `/architecture-decision` → `/api-design`
- Sprint in progress: `/start` → `/clickup status` → `/standup-report`

## Rules

- Always run first in a new session
- Never assume — ask if the context is ambiguous
- At most 3 questions
- Actionable output — the user knows what to do next
- Save preferences in session state
- Escape hatch: the user says "I just want X" → skip onboarding
