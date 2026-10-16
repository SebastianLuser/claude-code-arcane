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

/** Matcher for the tools that write files; the guard reviews their target path. */
export const FILE_TOOLS_MATCHER = "Write|Edit|MultiEdit|NotebookEdit";

/** What an install written before $CLAUDE_PROJECT_DIR wired into settings.json. */
const LEGACY_COMMAND = /^bash \.claude\/hooks\/([\w.-]+\.sh)$/;

/** Any command Arcane wrote for one of its hook scripts, in any of its forms. */
const ARCANE_COMMAND = /^bash "?(?:\$CLAUDE_PROJECT_DIR\/|[^"]*\/)?\.claude\/hooks\/([\w.-]+\.sh)"?$/;

/**
 * Scripts the guard replaced. Their substring checks fired on text inside arguments
 * (a prompt or a commit message that mentions `git push --force ... main`). The
 * update removes the files, so their settings.json entries must go with them.
 */
const RETIRED_SCRIPTS = new Set(["validate-push.sh", "validate-secrets.sh"]);

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
export function hookCommand(target: string, script: string): string {
  if (path.resolve(target) === path.resolve(os.homedir())) {
    const absolute = path.join(target, ".claude", "hooks", script).replace(/\\/g, "/");
    return `bash "${absolute}"`;
  }
  return `bash "$CLAUDE_PROJECT_DIR/.claude/hooks/${script}"`;
}

function hook(target: string, script: string, timeout: number): HookEntry {
  return { type: "command", command: hookCommand(target, script), timeout };
}

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
        matcher: "Bash",
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
        hooks: [hook(target, "validate-assets.sh", 10), hook(target, "validate-skill-change.sh", 5)],
      },
    ],
    Notification: one("notify.sh", 10),
    PreCompact: one("pre-compact.sh", 10),
    PostCompact: one("post-compact.sh", 10),
    Stop: one("session-stop.sh", 10),
    SubagentStart: one("log-agent.sh", 5),
    SubagentStop: one("log-agent-stop.sh", 5),
  };
}

/**
 * Brings the hooks of an existing install up to date without regenerating them, so
 * hooks the user added or edited survive:
 *   - a command still in the exact legacy relative form moves to `hookCommand()`;
 *   - entries for retired scripts are dropped, and groups left empty with them;
 *   - the guard is added where it is missing, ahead of the other Bash hooks.
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

  const pre = (hooks.PreToolUse ??= []);
  const hasGuard = (group: HookGroup) => group.hooks?.some((h) => h.command?.includes("guard.sh"));

  const bash = pre.find((g) => g.matcher === "Bash");
  if (!bash) {
    pre.unshift({ matcher: "Bash", hooks: [hook(target, "guard.sh", 10)] });
    changes.push("guard for Bash");
  } else if (!hasGuard(bash)) {
    bash.hooks = [hook(target, "guard.sh", 10), ...(bash.hooks ?? [])];
    changes.push("guard for Bash");
  }

  if (!pre.some((g) => g.matcher === FILE_TOOLS_MATCHER && hasGuard(g))) {
    pre.push({ matcher: FILE_TOOLS_MATCHER, hooks: [hook(target, "guard.sh", 10)] });
    changes.push("guard for file edits");
  }

  return changes;
}
