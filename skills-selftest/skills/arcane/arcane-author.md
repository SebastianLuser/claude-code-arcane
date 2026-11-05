# Skill Test Spec: /arcane-author

## Skill Summary

`/arcane-author` adds one skill or one profile to the Arcane repository with every registration the repo's tests require. It settles kind, name, purpose, category and profile with the user (or takes them from the arguments), reads the test files and docs its "Sources" table names, writes the content and the registrations, and runs the tests that cover the change. It is contributor-only: it lives in `maintainers/skills/` and is mirrored into the repo's `.claude/skills/`. It never adds `model:` to what it creates.

---

## Static Assertions (Structural)

Verified automatically by `/skill-test static` and `src/__tests__/skill-static.test.ts`.

- [ ] Has required frontmatter fields: `name`, `description`, `argument-hint`, `user-invocable`, `allowed-tools`
- [ ] Has at least two `##` sections
- [ ] Final section names the next step (`/skill-test spec`, `/commit`)
- [ ] `argument-hint` lists both modes: `skill <name>` and `profile <name>`
- [ ] No `model:` field

---

## Director Gate Checks

None. `/arcane-author` is a contributor utility; no director gates apply.

---

## Test Cases

### Case 1: New skill with full arguments — writes every registration without asking

**Fixture:**
- A clean checkout of the Arcane repo; no skill named `todo-digest` in `skills/` or `maintainers/skills/`

**Input:** `/arcane-author skill todo-digest "Summarize the TODO and FIXME markers of a repository by folder", category utility, listed in the testing profile`

**Expected behavior:**
1. Restates the plan in one line and does not ask, since the arguments answer every question
2. Reads the sources it needs (`CLAUDE.md`, `skill-static.test.ts`, `doc-counts.test.ts`, the catalogs)
3. Writes `skills/todo-digest/SKILL.md` with the six frontmatter keys in order and no `model:`
4. Lists it in the profile, adds the `catalog.yaml` entry with `spec: null`, the `SKILLS-CATALOG.md` row and every count
5. Runs the vitest command from its "Verify" section and reports the real result

**Assertions:**
- [ ] No question is asked before writing
- [ ] `skill-static`, `doc-counts`, `skill-links`, `agents-integrity` and `language` pass without manual fixes
- [ ] The created SKILL.md has no `model:` field
- [ ] The report lists the files changed and the test result

---

### Case 2: New profile — category, workflows and the profiles table

**Fixture:**
- A clean checkout; no profile named `backend-elixir`

**Input:** `/arcane-author profile backend-elixir "Backend Elixir: Phoenix, Ecto, OTP"`

**Expected behavior:**
1. Asks only for what the arguments leave open: the category, the skills and the agents
2. With `backend` as the answer, writes `profiles/backend-elixir.yaml` with `category: backend` and `workflows: [code-flow]`
3. Lists only skills, agents and hooks that exist
4. Adds the row to the README "Available Profiles" table with the count of its own `skills:`
5. Runs the tests and reports the result

**Assertions:**
- [ ] `profiles`, `workflows`, `doc-counts` and `agents-integrity` pass without manual fixes
- [ ] The profile has `workflows: [code-flow]`
- [ ] No `model:` anywhere in the profile

---

### Case 3: Name already taken — stops before writing

**Fixture:**
- `skills/commit/SKILL.md` exists

**Input:** `/arcane-author skill commit "Another commit helper"`

**Expected behavior:**
1. Finds `commit` already in `skills/`
2. Says so and asks for another name; writes nothing

**Assertions:**
- [ ] No file is created or changed
- [ ] The answer names the existing skill

---

### Case 4: Name of a Claude Code command — refuses it

**Fixture:**
- `native-command-names.test.ts` lists `review`

**Input:** `/arcane-author skill review "Review the open pull request"`

**Expected behavior:**
1. Checks the name against `src/__tests__/native-command-names.test.ts`
2. Explains that a skill named `review` hides the native command and proposes another name

**Assertions:**
- [ ] No file is created
- [ ] The answer explains the collision with the native command

---

### Case 5: No arguments — settles everything before writing

**Fixture:**
- A clean checkout

**Input:** `/arcane-author`

**Expected behavior:**
1. Asks for the kind and name, the purpose, the category and the profile (the "Before writing" table)
2. Writes nothing until those are settled

**Assertions:**
- [ ] The questions cover every row of the "Before writing" table that applies
- [ ] No file is written before the answers

---

## Protocol Compliance

- [ ] Reads the sources the change touches instead of relying on memory
- [ ] Fixes content, never a test, when a test fails
- [ ] Reports only test results it ran in the session
- [ ] Never adds `model:` or a model id

---

## Coverage Notes

- Cases 1 and 2 are the ones that matter most: they are the "no manual fixes" promise.
- Not covered: renaming a profile (the skill sends the user to `PROFILE_RENAMES`), skills with `context: fork` and an `agent:`, and agents, rules or hooks, which the skill does not create.
