---
paths:
  - "**/*.cs"
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.py"
  - "**/*.go"
  - "**/*.java"
  - "**/*.kt"
  - "**/*.swift"
  - "**/*.rb"
  - "**/*.rs"
  - "**/*.php"
  - "**/*.dart"
  - "**/*.c"
  - "**/*.cpp"
  - "**/*.cc"
  - "**/*.h"
  - "**/*.hpp"
  - "**/*.sh"
  - "**/*.sql"
  - "**/*.shader"
  - "**/*.hlsl"
  - "**/*.glsl"
  - "**/*.gd"
  - "**/*.lua"
---

# Code Comments Rule

Comments are written in **English**, whatever language the conversation is in.

## Never write

- **Session narration.** No comment records what was decided, changed, tried or removed
  while working. Not `// removed the old validation`, not `// now uses a dictionary instead
  of a list`, not `// moved above the null check as discussed`, not `// changed from 30 to
  50`. The commit message carries the story; the code carries the result.
- **WHAT restated.** The code already says what it does. `// increment the counter` above
  `counter++` is noise.
- **Ticket, task or doc references.** No `// added for JIRA-123`, no `// part of sprint04`,
  no `// implements the boss design doc`. Traceability lives in the commit and the PR, where
  it stays accurate and searchable.
- **Attribution or dates.** No `// author:`, no `// created 2026-09-04`. Git owns that and
  never goes stale.
- **Multi-paragraph docstrings on simple functions.**
- **`// used by X`.** Tooling answers that better and this rots the first time X moves.

## Write

- **The WHY that the code cannot show.** A constant that looks arbitrary, an ordering that
  matters, a deliberate break from the surrounding pattern.
- **Workarounds**, with a link to the upstream bug.
- **Non-obvious invariants or preconditions** a caller has to respect.
- **Doc comments on public APIs** consumed from outside the module. Private ones need none.
- **`TODO(@owner, YYYY-MM-DD): description`.** Never a bare `TODO`.

## Shape

One line, unless the reason honestly needs two. A comment that needs a paragraph to explain
the code beneath it is a signal to fix the code instead.
