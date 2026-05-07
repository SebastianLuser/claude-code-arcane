---
name: tdd-guide
description: "Test-driven development skill for writing unit tests, generating test fixtures and mocks, analyzing coverage gaps, and guiding red-green-refactor workflows across Jest, Pytest, JUnit, Vitest, and Mocha."
category: "testing"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# TDD Guide

Test-driven development skill for generating tests, analyzing coverage, and guiding red-green-refactor workflows across Jest, Pytest, JUnit, and Vitest.

> **Note:** This skill may create or modify files in your project. It will ask before writing.

## Workflows

### Generate Tests from Code

1. Provide source code (TypeScript, JavaScript, Python, Java)
2. Specify target framework (Jest, Pytest, JUnit, Vitest)
3. Run `test_generator.py` with requirements
4. Review generated test stubs
5. **Validation:** Tests compile and cover happy path, error cases, edge cases

### Analyze Coverage Gaps

1. Generate coverage report from test runner (`npm test -- --coverage`)
2. Run `coverage_analyzer.py` on LCOV/JSON/XML report
3. Review prioritized gaps (P0/P1/P2)
4. Generate missing tests for uncovered paths
5. **Validation:** Coverage meets target threshold (typically 80%+)

### TDD New Feature

1. Write failing test first (RED)
2. Run `tdd_workflow.py --phase red` to validate
3. Implement minimal code to pass (GREEN)
4. Run `tdd_workflow.py --phase green` to validate
5. Refactor while keeping tests green (REFACTOR)
6. **Validation:** All tests pass after each cycle

## Key Tools

| Tool | Purpose | Usage |
|------|---------|-------|
| `test_generator.py` | Generate test cases from code/requirements | `python scripts/test_generator.py --input source.py --framework pytest` |
| `coverage_analyzer.py` | Parse and analyze coverage reports | `python scripts/coverage_analyzer.py --report lcov.info --threshold 80` |
| `tdd_workflow.py` | Guide red-green-refactor cycles | `python scripts/tdd_workflow.py --phase red --test test_auth.py` |
| `fixture_generator.py` | Generate test data and mocks | `python scripts/fixture_generator.py --entity User --count 5` |

Additional scripts: `framework_adapter.py` (convert between frameworks), `metrics_calculator.py` (quality metrics), `format_detector.py` (detect language/framework), `output_formatter.py` (CLI/desktop/CI output).

## Spec-First Workflow

TDD is most effective when driven by a written spec. The flow:

1. **Write or receive a spec** -- stored in `specs/<feature>.md`
2. **Extract acceptance criteria** -- each criterion becomes one or more test cases
3. **Write failing tests (RED)** -- one test per acceptance criterion
4. **Implement minimal code (GREEN)** -- satisfy each test in order
5. **Refactor** -- clean up while all tests stay green

### Extracting Tests from Specs

Each acceptance criterion in a spec maps to at least one test:

| Spec Criterion | Test Case |
|---------------|-----------|
| "User can log in with valid credentials" | `test_login_valid_credentials_returns_token` |
| "Invalid password returns 401" | `test_login_invalid_password_returns_401` |
| "Account locks after 5 failed attempts" | `test_login_locks_after_five_failures` |

**Tip:** Number your acceptance criteria in the spec. Reference the number in the test docstring for traceability (`# AC-3: Account locks after 5 failed attempts`).

## Bounded Autonomy Rules

### Stop and Ask When

- **Ambiguous requirements** -- the spec has conflicting or unclear acceptance criteria
- **Missing edge cases** -- you cannot determine boundary values without domain knowledge
- **Test count exceeds 50** -- large test suites need human review before committing
- **External dependencies unclear** -- third-party APIs with undocumented behavior
- **Security-sensitive logic** -- auth, encryption, or payment flows require human sign-off

### Continue Autonomously When

- **Clear spec with numbered acceptance criteria** -- each criterion maps directly to tests
- **Straightforward CRUD operations** -- well-defined models
- **Well-defined API contracts** -- OpenAPI spec or typed interfaces available
- **Pure functions** -- deterministic input/output with no side effects
- **Existing test patterns** -- the codebase already has similar tests to follow

## Code Examples and Advanced Patterns

> See references/tdd-code-examples.md for complete examples covering Pytest, Jest, Go table-driven tests, property-based testing (Hypothesis, fast-check), mutation testing, and coverage analysis output.

## Cross-References

| Skill | Relationship |
|-------|-------------|
| `engineering/spec-driven-workflow` | Spec --> acceptance criteria --> test extraction pipeline |
| `engineering-team/focused-fix` | Phase 5 (Verify) uses TDD to confirm the fix with a regression test |
| `engineering-team/senior-qa` | Broader QA strategy; TDD is one layer in the test pyramid |

## Limitations

| Scope | Details |
|-------|---------|
| Unit test focus | Integration and E2E tests require different patterns |
| Static analysis | Cannot execute tests or measure runtime behavior |
| Language support | Best for TypeScript, JavaScript, Python, Java |
| Report formats | LCOV, JSON, XML only; other formats need conversion |
| Generated tests | Provide scaffolding; require human review for complex logic |
