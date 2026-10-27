# Coding Standards (Core Universal)

Standards that apply to any code (software or gamedev). For specific standards:
- Software (backend / frontend / APIs / infra): see `.claude/docs/software/coding-standards.md`
- Game dev (engines, shaders, gameplay): see `.claude/docs/gamedev/coding-standards.md`

Path-scoped rules live in `.claude/rules/`.

---

## General Principles

1. **Simplicity first:** code that reads without comments beats clever code with comments.
2. **Clear boundaries:** validate input at the boundaries (API endpoints, form handlers, player input). Trust internal code.
3. **No premature optimization:** optimize only with evidence (profiling, metrics).
4. **Test what matters:** high coverage on business logic / gameplay systems, not on getters/setters.
5. **Verification-driven development:** tests first when adding critical logic. For visual changes, verify with screenshots. Compare expected vs actual output before marking work complete.

---

## Language in this repo

**Everything in this repo is English**: skills, agents, rules, docs, code, comments, script output and data contracts (folder names, frontmatter keys, JSON fields, status values). The language of a file never decides the language of the conversation: Claude replies in the language the user writes in, and writes files for the user (notes, CVs, letters) in the language the user uses or asks for. `rules/user-language.md` ships that rule to every project.

Knowledge that only exists in one language (injection phrases, AI-tell lexicons, stopwords) is data, not prose: it lives in a `*.<lang>.json` pack next to the script, the code stays language-agnostic, and a language without a pack falls back to the language-neutral checks instead of applying another language's data. `src/__tests__/language.test.ts` enforces this.

---

## Choosing a programming language in this repo

The **runtime context** picks the language, not preference. There are four contexts and one language each:

| Context | Language | Why | CI guarantee |
|---|---|---|---|
| Installer (`src/`) | **TypeScript** | It is the published npm package: the only code with a build (`tsup`) and a typechecker | `npm run build`, `tsc --noEmit`, `vitest` |
| Lifecycle hooks (`hooks/`, `skills/*/hooks/`) | **Bash**; logic that does not fit Bash goes in **JavaScript `.mjs`** behind a `.sh` wrapper | Claude Code invokes them by path. Node is guaranteed because Arcane installs through npx; Python is not, and without it the guard did nothing | `bash -n` and `node --check` on all of them; specs in `src/__tests__/hook-*.test.ts` |
| Skill scripts (`skills/*/scripts/`) | **Python 3, stdlib only** | Copied into the user's project and run there: no build, no `package.json`, no `node_modules` | Specs in `tests/` (see Testing) |
| Templates (`*/templates/`) | **The target project's** | Content emitted into the user's project; the repo never runs it | N/A |

**TypeScript outside `src/` is not a language choice: it is a runtime requirement in disguise.** Without a build step, a `.ts` only runs with Node 24+'s native type stripping, which the CI matrix (20 and 22) does not cover. If the script has to run on the user's machine, it is Python.

**Optional dependencies:** allowed only with explicit degradation. Reference: `cv-ats-export` uses `pypdf` when present and reports `[ATS SKIP]` when not, without breaking the export.

### Escape hatch

Another language **only when a required dependency imposes it** — never by taste or familiarity. It needs a one-line justification in the skill's SKILL.md. Current cases:

- `pdf-generator/scripts/render_cover.js` → Node, because **Playwright is a Node library**.
- `docx-generator/scripts/` (`.cs`, `.slnx`, `setup.ps1`) → .NET, because it **vendors a .NET project** (MiniMaxAIDocx); the `.ps1` is its Windows setup.
- `worktree-isolation/scripts/apply.mjs` → Node, because **it is also a hook**: `arcane global` installs it as a global `SessionStart` and `arcane worktree --isolate` runs it, and Python with PyYAML is guaranteed in neither. Spec in `src/__tests__/worktree-isolation.test.ts`.

If the Python stdlib can do it, the escape hatch does not apply.

---

## Naming

- **Variables/functions:** camelCase (JS/TS/Java/C#), snake_case (Python/Rust) or PascalCase (Go exports)
- **Classes/types:** PascalCase in every language
- **Constants:** UPPER_SNAKE_CASE
- **Files:** kebab-case for web/scripts, PascalCase for components/classes, snake_case for Python/Go

---

## Comments

The rule lives in `.claude/rules/code-comments.md` and is the only authority.
Do not duplicate criteria here: two lists about comments always end up
contradicting each other, and the permissive one wins.

---

## Error Handling

- **Fail fast at boundaries, fail soft in UX.** Error on invalid input; the UX degrades gracefully.
- **Do not swallow errors.** Log them or propagate them.
- **Error types, not strings.** They make programmatic handling possible.
- **Logs with context:** userID/sessionID/requestID for traceability.

---

## Security

- **Never secrets in code** — environment variables or secret managers.
- **Input validation at the boundary** — even when it comes from your own frontend/client.
- **Prepared statements for SQL.** String concatenation = SQL injection.
- **CSRF tokens for state-changing operations** (web).
- **Rate limiting on public endpoints.**
- **Validate incoming URLs** before fetching them (SSRF).

---

## Git

- **Atomic commits:** one logical change per commit.
- **Conventional commits:** `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `style:`
- **Message in imperative English:** "fix auth bug", not "fixed" or "fixes".
- **Reference the ticket if there is one:** `feat(auth): add OAuth (TUNI-123)`
- **Commits reference the ADR/design doc when relevant:** `feat(combat): implement hitbox system per ADR-0012`

---

## Testing (Universal)

### AAA Pattern
Arrange / Act / Assert. Every test has setup, action and verification — kept apart.

```
test_damage_calculator_reduces_health_correctly:
  # Arrange
  player = Player(health=100)
  
  # Act
  player.take_damage(25)
  
  # Assert
  assert player.health == 75
```

### Naming
`test_should_[expected_behavior]_when_[condition]` or `test_[system]_[scenario]_[expected]`

### Determinism
- Tests give the same result on every run
- No unpinned random seeds, no time-dependent assertions
- Isolation: each test has its own setup+teardown and never depends on order

### Mocking
- Mocks only at external boundaries (network, filesystem, DB, engine APIs)
- For internal code, prefer fakes/stubs
- No hardcoded magic numbers in fixtures (exception: boundary value tests)

### Regression tests
Every bug fix carries a test that would have caught the original bug.

### CI/CD
- The test suite runs on every push to main and every PR
- No merge while tests fail — tests are a blocking gate
- Never disable/skip tests to make CI pass — fix the root cause

---

## Verification-Driven Development

Before marking work complete:

1. **If you added logic:** is there an automated test that verifies it?
2. **If you changed UI/visuals:** do you have a before/after screenshot or video?
3. **If it is an integration:** did you run it end-to-end at least once?
4. **If it is performance:** did you measure before/after with metrics?

"Looks like it works" is not verification. You must be able to show concrete evidence.

---

## Comments / Docs

See `.claude/rules/code-comments.md`.
