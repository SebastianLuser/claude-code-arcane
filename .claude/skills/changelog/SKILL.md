---
name: changelog
description: "Generates a changelog from git log between two tags/commits, grouped by type (feat/fix/refactor/docs/test/chore). Use when the user mentions: changelog, release notes, what changed, change history."
category: "documentation"
argument-hint: "[range: vX..vY | vX | last-week | N | empty]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write
---
# Changelog Generator

Generates a professional changelog from the git history.

## Input

Optional argument: `$ARGUMENTS`

Accepted formats:
- `v1.0.0..v1.1.0` — between two tags
- `v1.2.0` — from that tag to HEAD
- `last-week` / `last-month` — by date
- `10` — last N commits
- (empty) — from the last tag to HEAD

## Process

### 1. Determine the range

```bash
# If there are tags
git tag --sort=-v:refname | head -5

# If there are no tags, use the last 20 commits
git log --oneline -20
```

### 2. Extract commits

```bash
git log [range] --pretty=format:"%h|%s|%an|%ad" --date=short
```

### 3. Classify by type

Parse the commit message prefix (conventional commits):

| Prefix | Category |
|---------|-----------|
| `feat:` / `feature:` | New features |
| `fix:` / `bugfix:` | Bug fixes |
| `refactor:` | Refactoring |
| `docs:` | Documentation |
| `test:` | Tests |
| `chore:` / `ci:` / `build:` | Maintenance |
| `perf:` | Performance |
| `style:` | Code style |
| `BREAKING CHANGE` | Changes that break compatibility |
| No prefix | Other |

### 4. Generate the changelog

Output format:

```markdown
# Changelog — [project] — [date]
**Range:** [tag1] → [tag2/HEAD]
**Commits:** [N total]

## Breaking Changes
- [hash] description (@author)

## New features
- [hash] description (@author)

## Fixes
- [hash] description (@author)

## Refactoring
- [hash] description (@author)

## Performance
- [hash] description (@author)

## Documentation
- [hash] description (@author)

## Tests
- [hash] description (@author)

## Maintenance
- [hash] description (@author)

## Other
- [hash] description (@author)

---
**Statistics:**
- X files changed
- +Y lines / -Z lines
- N contributors
```

### 5. Output

- Show it on screen
- If the user asks to save it → write to `CHANGELOG.md` (prepend at the top)

## Rules
- Omit empty categories
- If the repo does not use conventional commits, try to classify by message content
- Include a link to each commit if the repo has a remote configured
- Write it in the user's language
