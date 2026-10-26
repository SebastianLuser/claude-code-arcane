import os from "node:os";
import path from "node:path";

export interface HookEntry {
  type: string;
  command: string;
  timeout?: number;
}

export interface HookGroup {
  matcher?: string;
  hooks: HookEntry[];
}

export type HookMap = Record<string, HookGroup[]>;

/** Matcher for the tools that run shell commands; on Windows Claude also uses PowerShell. */
export const SHELL_TOOLS_MATCHER = "Bash|PowerShell";

/** Matcher for the tools that write files; the guard reviews their target path. */
export const FILE_TOOLS_MATCHER = "Write|Edit|MultiEdit|NotebookEdit";

/** What an install written before $CLAUDE_PROJECT_DIR wired into settings.json. */
const LEGACY_COMMAND = /^bash \.claude\/hooks\/([\w.-]+\.sh)$/;

/** Any command Arcane wrote for one of its hook scripts, in any of its forms. */
const ARCANE_COMMAND = /^bash "?(?:\$CLAUDE_PROJECT_DIR\/|[^"]*\/)?\.claude\/hooks\/([\w.-]+\.sh)"?$/;

/**
 * Scripts no longer shipped. The guard replaced validate-push and validate-secrets,
 * whose substring checks fired on text inside arguments (a prompt or a commit
 * message that mentions `git push --force ... main`); validate-assets was a
 * placeholder that never checked anything. The update removes the files, so their
 * settings.json entries must go with them.
 */
const RETIRED_SCRIPTS = new Set(["validate-push.sh", "validate-secrets.sh", "validate-assets.sh"]);

/**
 * The command settings.json runs for an installed hook script.
 *
 * Claude Code runs project hooks from the session's working directory, which is the
 * worktree once a session enters one with EnterWorktree. A worktree whose
 * `.claude/hooks/` is not committed has no scripts, so a relative path failed there
 * and the hook was skipped without a word. `$CLAUDE_PROJECT_DIR` always names the
 * directory the session started in, so the script is found from any worktree; on
 * Windows hooks run under Git Bash, which expands it, spaces in the path included.
 *
 * The global install at `~/.claude` is the exception: there the variable names
 * whichever project is open, so it gets the absolute path of the file it owns.
 */
export function hookCommand(target: string, script: string, args = ""): string {
  const suffix = args ? ` ${args}` : "";
  if (path.resolve(target) === path.resolve(os.homedir())) {
    const absolute = path.join(target, ".claude", "hooks", script).replace(/\\/g, "/");
    return `bash "${absolute}"${suffix}`;
  }
  return `bash "$CLAUDE_PROJECT_DIR/.claude/hooks/${script}"${suffix}`;
}

function hook(target: string, script: string, timeout: number, args = ""): HookEntry {
  return { type: "command", command: hookCommand(target, script, args), timeout };
}

/** session-watch.sh runs session-watch.mjs with Node. */
const WATCH_POST_TOOL = ["session-watch.sh", "post-tool"] as const;
const WATCH_STOP = ["session-watch.sh", "stop"] as const;

/**
 * How installs before the Node hooks ran the session watch: Python, through run-py.sh, which
 * did nothing on a machine without a working Python. Rewritten in place.
 */
const PYTHON_WATCH = /run-py\.sh"?\s+session_watch\.py\s+(post-tool|stop)\s*$/;

/** The hooks a fresh install wires into settings.json. */
export function defaultHooks(target: string): HookMap {
  const one = (script: string, timeout: number): HookGroup[] => [
    { matcher: "", hooks: [hook(target, script, timeout)] },
  ];
  return {
    SessionStart: [
      {
        matcher: "",
        hooks: [
          hook(target, "session-start.sh", 10),
          hook(target, "detect-division.sh", 10),
          hook(target, "detect-unreal.sh", 10),
          hook(target, "detect-gaps.sh", 10),
          hook(target, "check-update.sh", 10),
        ],
      },
    ],
    PreToolUse: [
      {
        matcher: SHELL_TOOLS_MATCHER,
        hooks: [
          hook(target, "guard.sh", 10),
          hook(target, "validate-commit.sh", 15),
        ],
      },
      { matcher: FILE_TOOLS_MATCHER, hooks: [hook(target, "guard.sh", 10)] },
    ],
    PostToolUse: [
      {
        matcher: "Write|Edit",
        hooks: [hook(target, "validate-skill-change.sh", 5)],
      },
      { matcher: "", hooks: [hook(target, WATCH_POST_TOOL[0], 10, WATCH_POST_TOOL[1])] },
    ],
    Notification: one("notify.sh", 10),
    PreCompact: one("pre-compact.sh", 10),
    PostCompact: one("post-compact.sh", 10),
    Stop: [
      {
        matcher: "",
        hooks: [
          hook(target, "session-stop.sh", 10),
          hook(target, "worktree-stop.sh", 10),
          hook(target, WATCH_STOP[0], 120, WATCH_STOP[1]),
        ],
      },
    ],
    SubagentStart: one("log-agent.sh", 5),
    SubagentStop: one("log-agent-stop.sh", 5),
  };
}

/**
 * Brings the hooks of an existing install up to date without regenerating them, so
 * hooks the user added or edited survive:
 *   - a command still in the exact legacy relative form moves to `hookCommand()`;
 *   - entries for retired scripts are dropped, and groups left empty with them;
 *   - the Python session watch moves to the Node one;
 *   - the guard is added where it is missing, ahead of the other Bash hooks, and the
 *     group that runs it also matches PowerShell, which skipped every check before;
 *   - the worktree exit check and the session watch are added where missing.
 * Returns a description of each change; empty when nothing changed.
 */
export function healHooks(hooks: HookMap, target: string): string[] {
  const changes: string[] = [];

  for (const [event, groups] of Object.entries(hooks)) {
    if (!Array.isArray(groups)) continue;
    for (const group of groups) {
      const kept = (group.hooks ?? []).filter((entry) => {
        const script = typeof entry.command === "string" && entry.command.match(ARCANE_COMMAND);
        if (script && RETIRED_SCRIPTS.has(script[1])) {
          changes.push(`retired hook: ${script[1]}`);
          return false;
        }
        return true;
      });
      if (kept.length !== (group.hooks ?? []).length) group.hooks = kept;
    }
    hooks[event] = groups.filter((group) => (group.hooks ?? []).length > 0);
  }

  for (const groups of Object.values(hooks)) {
    for (const group of groups ?? []) {
      for (const entry of group.hooks ?? []) {
        const legacy = typeof entry.command === "string" && entry.command.match(LEGACY_COMMAND);
        if (legacy) {
          entry.command = hookCommand(target, legacy[1]);
          changes.push(`hook path: ${legacy[1]}`);
        }
      }
    }
  }

  for (const groups of Object.values(hooks)) {
    for (const group of groups ?? []) {
      for (const entry of group.hooks ?? []) {
        const watch = typeof entry.command === "string" && entry.command.match(PYTHON_WATCH);
        if (watch) {
          entry.command = hookCommand(target, "session-watch.sh", watch[1]);
          changes.push(`session watch on Node: ${watch[1]}`);
        }
      }
    }
  }

  const pre = (hooks.PreToolUse ??= []);
  const hasGuard = (group: HookGroup) => group.hooks?.some((h) => h.command?.includes("guard.sh"));

  const shell =
    pre.find((g) => g.matcher === SHELL_TOOLS_MATCHER) ??
    pre.find((g) => g.matcher === "Bash" && hasGuard(g)) ??
    pre.find((g) => g.matcher === "Bash");
  if (!shell) {
    pre.unshift({ matcher: SHELL_TOOLS_MATCHER, hooks: [hook(target, "guard.sh", 10)] });
    changes.push("guard for Bash and PowerShell");
  } else {
    if (!hasGuard(shell)) {
      shell.hooks = [hook(target, "guard.sh", 10), ...(shell.hooks ?? [])];
      changes.push("guard for Bash");
    }
    if (shell.matcher === "Bash") {
      shell.matcher = SHELL_TOOLS_MATCHER;
      changes.push("guard for PowerShell");
    }
  }

  if (!pre.some((g) => g.matcher === FILE_TOOLS_MATCHER && hasGuard(g))) {
    pre.push({ matcher: FILE_TOOLS_MATCHER, hooks: [hook(target, "guard.sh", 10)] });
    changes.push("guard for file edits");
  }

  ensureHook(hooks, "Stop", hook(target, "worktree-stop.sh", 10), "worktree exit on stop", changes);
  ensureHook(hooks, "Stop", hook(target, WATCH_STOP[0], 120, WATCH_STOP[1]), "format and type check on stop", changes);
  ensureHook(hooks, "PostToolUse", hook(target, WATCH_POST_TOOL[0], 10, WATCH_POST_TOOL[1]), "session watch", changes);

  return changes;
}

/**
 * Adds `entry` to the matcher-less group of `event` unless a hook with the same
 * script and arguments is already wired there.
 */
function ensureHook(hooks: HookMap, event: string, entry: HookEntry, label: string, changes: string[]): void {
  const signature = entry.command.replace(/^bash "[^"]*\/hooks\//, "");
  const groups = (hooks[event] ??= []);
  const present = groups.some((g) => g.hooks?.some((h) => h.command?.endsWith(signature)));
  if (present) return;
  const group = groups.find((g) => !g.matcher);
  if (group) group.hooks = [...(group.hooks ?? []), entry];
  else groups.push({ matcher: "", hooks: [entry] });
  changes.push(label);
}
