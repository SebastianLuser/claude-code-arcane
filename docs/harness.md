# The Arcane Harness

The model writes the code; the harness is everything around it that Arcane installs into `.claude/`: what sits in the context, what runs on every event without the model having to remember it, and who checks the work. This page maps the layers, the roles and the life of one task through them.

**The principle:** anything that must happen every time is a hook (deterministic, cannot be forgotten); anything that needs judgement is a rule or a skill (in the context, followed by the model). A rule that says "always" with no hook behind it is an intention, not a guarantee.

## Layers

| Layer | Lives in | Active when | Job |
|---|---|---|---|
| **Profile** | `profiles/*.yaml` | `arcane install` / `update` | Decides what reaches the project: nothing installs unless a profile lists it |
| **Rules** | `.claude/rules/` | Always in the context | How to work: workflow, verification, delegation, worktrees, domain conventions |
| **Output style** | `.claude/output-styles/arcane.md` | Always, once selected | The shape of the answers: action first, tables to compare, short lists |
| **Skills** | `.claude/skills/<name>/SKILL.md` | The description always; the body when invoked | Procedures for one kind of task, with their scripts and references |
| **Agents** | `.claude/agents/<division>/` | When delegated to | Work that needs a fresh context or other tools; read-only consultants and writing executors |
| **Hooks** | `.claude/hooks/` + `settings.json` | On Claude Code events | Guards and signals that must not depend on the model's memory |
| **State on disk** | `.arcane/` and `.claude/session-state/` | Across compactions and sessions | The memory the conversation loses |
| **CLI** | `arcane doctor`, `arcane update` | When the user runs them | Checks that the installed harness is whole, and keeps it current |

## Hooks by event

Each profile lists the hooks it brings under `hooks:` (core the session and guard hooks, `code-flow` the coding ones). The installer writes those ids to `.claude/arcane-hooks.json` and wires **one handler per event** into `settings.json` (`HANDLERS` in `src/hook-commands.ts`); the handler runs only the parts the list names. Claude Code starts a process for every hook, and on Windows a start costs 0.2-1.5 s at rest and seconds on a loaded machine: one script per hook made each Bash command start seven. Every script is copied, listed or not.

| Event | Handler | What it runs, when the list names it |
|---|---|---|
| `SessionStart` (startup, resume, clear, compact) | `session-start.sh` | Shows branch, recent commits and the first lines of `.arcane/session-state/active.md`; moves a legacy progress file. Then sources `detect-unreal.sh` and `detect-gaps.sh` (flag an Unreal project, point out missing docs) and `check-update.sh` (a newer Arcane, cached for 4 hours) |
| `PreToolUse` (`Bash\|PowerShell`, file tools) | `arcane-hook.mjs pre-tool` | The guard (`guard.mjs`, always): **deny** what the user should run by hand (force push, `--no-verify`, `sudo`, writing `.env`); **ask** before destructive or supply-chain actions (`rm -rf`, `rd /s`, `find -delete` or `xargs rm` outside build output, dropping data, a new dependency, a session against production such as `railway ssh -e production` or `ssh`/`psql` to a `prod` host, editing CI or lint configs). Then the commit checks (`validate-commit.sh`): empty messages, staged 3D exports. Logs a file edit it lets through, so the turn's Stop formats it even when the background PostToolUse finishes late |
| `PostToolUse`, in the background | `arcane-hook.mjs post-tool` | The session watch (`session-watch.sh post-tool`): records edited files; warns on a tool loop (same call 5 times), on scope drift (15 files) and at 70% / 85% of the context window. The frontmatter check of an edited `SKILL.md` (`validate-skill-change.sh`). Warnings reach Claude on the next turn |
| `Stop` | `arcane-hook.mjs stop` | Logs the stop (`session-stop.sh`); asks a finished task inside an `EnterWorktree` worktree to leave it (`worktree-stop.sh`); formats the files edited this turn (`session-watch.sh stop`) |
| `Stop`, in the background | `arcane-hook.mjs stop-check` | Type-checks what `stop` formatted, with the project's own tools. Errors in those files wake Claude (`asyncRewake`), once per set of errors |
| `PreCompact`, `PostCompact`, in the background | `pre-compact.sh`, `post-compact.sh` | Log only, to `.claude/session-state/` |

The `settings.json` command is the same text in every install, so when the global install and a project both list it Claude Code runs it once: the global copy, with the project's hook list (see [directory-structure](directory-structure.md#hooks-how-they-are-wired)). Formatting stays in the foreground on purpose: in the background it could rewrite a file Claude edits in the next turn. The guard, the session watch, the update check and the status line are Node scripts; Arcane is installed with npx, so Node is on the machine.

## Roles

| Role | Who | Decides | Never |
|---|---|---|---|
| **User** | The person | The work mode, every approval, destructive actions, force pushes, deleting worktrees | — |
| **Maker** | The main session | How to implement, within the chosen mode; delegates and collects | Declares its own work done in Plan + Goal or Goal-driven |
| **Goal reviewer** | A fresh `general-purpose` subagent | `PASS` or `FAIL` against the goal's criteria, running every check itself | Sees the maker's reasoning or the conversation |
| **Domain agents** | `agents/<division>/` | Analysis (consultants, read-only) or delegated work (executors) | Ask the user: they state an `ASSUMPTION:` and go on |
| **Document reviewers** | `cv-reviewer`, `hiring-manager` and the other fresh-context reviewers | Whether a CV, cover letter or proposal holds up before it is sent | Review a draft they wrote |
| **Hooks** | Scripts | Allow, ask or deny one tool call; warn | Judge whether the work is good |

The maker-checker split is the core of it: whoever did the work does not grade it. In code that is the goal review in `rules/implementation-workflow.md`; in documents, `rules/drafter-reviewer.md`. **One agent by default** (`rules/agent-delegation.md`): a second agent is worth it only when the work does not fit one context, or the second one needs something the first must not have (a clean context, other tools, another model).

## Workflows and loops

A workflow is a profile with `category: workflow` that other profiles bring through `workflows: [...]`; `mergeProfiles()` loads it after them. Its loops are run by the main session, never by a subagent, and each has a written limit: `code-flow` stops after 2 FAIL reviews, `review-flow` reviews once, `improve-skill-flow` reverts a change that lowers the score. The table and how to write one: [README](../README.md#5-workflows-and-loops).

## The life of a task

1. **Session start.** `session-start.sh` prints the state, including an open `active.md`, so a new session or a compaction resumes from the file, not from memory.
2. **Work mode.** For non-trivial work the maker asks once: Plan + Goal, Action Plan, Goal-driven or Direct (`rules/implementation-workflow.md`).
3. **Goal and progress file.** In Plan + Goal and Goal-driven, the goal and its criteria go into `.arcane/session-state/active.md`, updated at every checkpoint.
4. **Before writing code.** Search the codebase, then the standard library, then installed dependencies; a new dependency is the last option, and the guard asks before adding one.
5. **Every tool call.** the guard screens shell commands and file writes; the session watch watches for loops, scope drift and context use.
6. **Evidence.** `rules/verification.md`: no "it works" without a command run in this session; domain rules say what counts as evidence (a `curl`, a migration up and down, Playwright screenshots at four widths).
7. **Goal review.** When the goal looks met, a fresh reviewer runs the checks and answers `PASS` or `FAIL`. The user sees the verdict first. Two `FAIL`s in a row go back to the user.
8. **Stop.** The Stop hook formats what changed and type-checks it in the background, waking Claude only for errors in those files; the worktree check gets the session out of a finished worktree.
9. **Long sessions.** At 70% of the window the maker updates `active.md` and suggests `/compact` at a logical point; after the compaction, step 1 runs again.

## State on disk

| Path | Written by | Holds |
|---|---|---|
| `.arcane/session-state/active.md` | The model | The task's goal, plan, decisions and what is not verified yet. Outside `.claude/` because Claude Code asks before every edit there |
| `.claude/session-state/` | Hooks only | Logs, the session watch state, the context window cached by the status line |
| `.claude/arcane-manifest.json` | The installer | What was installed and the hash of every file, so `update` can tell your edits from stale content |
| `~/.arcane/installations.json` | The installer | Every project Arcane is installed in, for `arcane update` |

Both session-state folders carry a `.gitignore` with `*`, so they never land in a commit.

## Where to change what

| You want to | Edit |
|---|---|
| Ship or drop a skill, rule or agent for a stack | The profile in `profiles/` (and its bridge file if it was renamed) |
| Change how the model works everywhere | A universal rule in `rules/` (listed in `core.yaml`) |
| Block or ask before a command | `hooks/guard.mjs`, with a spec in `src/__tests__/hook-guard.test.ts` |
| Change what the session watch warns about | The constants at the top of `hooks/session-watch.mjs` |
| Change how answers look | `output-styles/arcane.md` |
| Add a workflow | A profile with `category: workflow`, `entry:` and its rules, skills and hooks; `workflows: [<name>]` in the profiles that bring it |
| Add a hook to an event | The script in `hooks/`, its entry in `WIRING` (`src/hook-commands.ts`), and the `hooks:` of the profile that brings it |
| Check an installed project | `arcane doctor`: hook scripts and paths, bash, installed content, broad or destructive allow rules, secrets in config |

## Limits

- **The guard is not a sandbox.** It catches mistakes in commands it can parse; a script or an interpreter one-liner can still do anything.
- **Hooks need bash, and the guard and the session watch need Node.** Without Node they do nothing.
- **The context warnings need the status line**, which reports the real window size; without it there is no warning, rather than a wrong one.
- **Subagents cannot start subagents**, so the goal reviewer and the document reviewers are always started by the main session.
- **Rules are followed, not enforced.** The work mode, the search order and the verification rule rely on the model; the goal review is what catches the misses.
