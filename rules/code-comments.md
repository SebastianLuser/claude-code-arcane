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

**The default is no comment.** The code says what it does and the commit says why it changed.
A new comment has to earn its place; it is never the neutral choice.

The whole list of exceptions:

- **Doc comments on public APIs** consumed from outside the module, one line. Private ones
  need none.
- **Workarounds**, with a link to the upstream bug.
- **`TODO(@owner, YYYY-MM-DD): description`.** Never a bare `TODO`.

A comment shaped as a comparison with what used to be there — "X and not Y", "no longer X",
"now uses X" — is session narration wearing a technical disguise. It belongs in the commit.

## Shape

One line, unless the reason honestly needs two. A comment that needs a paragraph to explain
the code beneath it is a signal to fix the code instead.
