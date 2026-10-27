---
name: onboard
description: "Generate project onboarding guide: stack, setup instructions, structure, conventions, useful links."
category: "workflow"
argument-hint: "[project path, default .]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write
---
# Onboarding Guide Generator

Generates a complete guide so a new dev can start working on the project.

## Process

### 1. Scan the project

Read in parallel:
- README.md, CONTRIBUTING.md, CLAUDE.md
- Package manager config (go.mod, package.json, pyproject.toml, etc.)
- Docker config (Dockerfile, docker-compose.yml)
- CI config (.github/workflows/)
- .env.example
- Makefile / scripts/
- Folder structure (2-3 levels)

### 2. Generate the guide

```markdown
# Onboarding Guide — [Project]
**Last updated:** [date]

## What this project is
[1-2 paragraphs: what it does, who it is for, why it exists]

## Tech stack
| Component | Technology | Version |
|------------|------------|---------|
| Language | Go 1.26 | 1.26.1 |
| Framework | Gin | 1.12.0 |
| Database | PostgreSQL | 16 |
| ORM | GORM | 1.31.1 |

## Prerequisites
- [ ] [Tool 1] installed (link to docs)
- [ ] [Tool 2] installed
- [ ] Access to [service] (ask [person])

## Step-by-step setup

### 1. Clone and configure
```bash
git clone [repo-url]
cd [project]
cp .env.example .env
# Edit .env with your values
```

### 2. Start services
```bash
[command for DB, docker, etc.]
```

### 3. Install dependencies
```bash
[go mod download / npm install / etc.]
```

### 4. Run migrations
```bash
[migrations command]
```

### 5. Start the server
```bash
[command for development server]
```

### 6. Check that it works
```bash
curl http://localhost:[port]/health
# Should respond: {"status": "ok"}
```

## Project structure
```
[directory tree with a description of each folder]
```

## Code conventions
- [Naming, file structure, patterns used]

## Useful commands
| Command | What it does |
|---------|----------|
| `make test` | Run tests |
| `make lint` | Lint |
| `make build` | Build |

## Git workflow
- Branches: [convention]
- Commits: [format]
- PRs: [process]

## Useful links
- Jira: [link]
- Figma: [link]
- Staging: [link]
- Docs: [link]

## Contacts
| Area | Person | Contact |
|------|---------|----------|
```

### 3. Output

Save as `docs/ONBOARDING.md` or `ONBOARDING.md` at the root.

## Rules
- Only include info that can be verified from the current code
- If info is missing (like staging links), leave a placeholder with [TODO]
- Mentally walk through the setup steps to make sure they work in order
- Write the guide in the user's language
