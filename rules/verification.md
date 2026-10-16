# Verification Rule

Every claim about the state of the work rests on evidence produced in this session.

- **No claim without a run.** "Tests pass", "it builds" and "it works" each need the command you ran in this session and its result. If you did not run it, say so.
- **Read before you edit.** Never change or overwrite a file you have not read in this session: the user may have changed it.
- **Search, don't guess.** Before you use a path, function, flag or config key you are not sure exists, find it (Grep, Glob, `--help`, the source).
- **The installed version beats memory.** Before you use a library API from memory, check its version in the lockfile; when in doubt, read the installed types or source.
- **Fix the code, not the check.** Never edit a test, a lint/format/type config or a CI step to make it pass, unless the task is about that test or config. If you think the test is wrong, say so and ask.
- **Filter long output.** Pipe it through `tail`, `grep` or a quiet flag instead of pouring thousands of lines into the context.
- **Close with what was not verified.** End a task by naming what you could not check: a platform, a manual flow, a visual result.

Domain rules add a `## How to verify` section with what counts as evidence in that kind of code.
