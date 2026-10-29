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

/** The same, with the argument a script that serves two events takes. */
const ARCANE_ENTRY = /^bash "?(?:\$CLAUDE_PROJECT_DIR\/|[^"]*\/)?\.claude\/hooks\/([\w.-]+\.sh)"?(?: ([\w-]+))?$/;

/**
 * Scripts no longer shipped. The guard replaced validate-push and validate-secrets,
 * whose substring checks fired on text inside arguments (a prompt or a commit
 * message that mentions `git push --force ... main`); validate-assets was a
 * placeholder that never checked anything. detect-division, notify and the two
 * log-agent scripts only appended to files under session-state/ that nothing read.
 * The update removes the files, so their settings.json entries must go with them.
 */
const RETIRED_SCRIPTS = new Set([
  "validate-push.sh",
  "validate-secrets.sh",
  "validate-assets.sh",
  "detect-division.sh",
  "notify.sh",
  "log-agent.sh",
  "log-agent-stop.sh",
]);

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

/**
 * How installs before the Node hooks ran the session watch: Python, through run-py.sh, which
 * did nothing on a machine without a working Python. Rewritten in place.
 */
const PYTHON_WATCH = /run-py\.sh"?\s+session_watch\.py\s+(post-tool|stop)\s*$/;

interface Wiring {
  event: string;
  matcher: string;
  timeout: number;
  /** What healHooks() reports when it adds this hook to an existing install. */
  label?: string;
}

const SESSION_START: Wiring = { event: "SessionStart", matcher: "", timeout: 10 };
const STOP: Wiring = { event: "Stop", matcher: "", timeout: 10 };

/**
 * Every hook Arcane can wire, by the id profiles list under `hooks:`: the script,
 * plus its argument when one script serves two events. The order here is the order
 * in settings.json, so the guard runs before the other shell hooks.
 */
const WIRING: ReadonlyArray<[string, Wiring[]]> = [
  ["session-start.sh", [SESSION_START]],
  ["detect-unreal.sh", [SESSION_START]],
  ["detect-gaps.sh", [SESSION_START]],
  ["check-update.sh", [SESSION_START]],
  ["guard.sh", [
    { event: "PreToolUse", matcher: SHELL_TOOLS_MATCHER, timeout: 10 },
    { event: "PreToolUse", matcher: FILE_TOOLS_MATCHER, timeout: 10 },
  ]],
  ["validate-commit.sh", [{ event: "PreToolUse", matcher: SHELL_TOOLS_MATCHER, timeout: 15 }]],
  ["validate-skill-change.sh", [{ event: "PostToolUse", matcher: "Write|Edit", timeout: 5 }]],
  ["session-watch.sh post-tool", [{ event: "PostToolUse", matcher: "", timeout: 10, label: "session watch" }]],
  ["pre-compact.sh", [{ event: "PreCompact", matcher: "", timeout: 10 }]],
  ["post-compact.sh", [{ event: "PostCompact", matcher: "", timeout: 10 }]],
  ["session-stop.sh", [STOP]],
  ["worktree-stop.sh", [{ ...STOP, label: "worktree exit on stop" }]],
  ["session-watch.sh stop", [{ ...STOP, timeout: 120, label: "format and type check on stop" }]],
];

/** Every hook id a profile may list. */
export const HOOK_IDS: readonly string[] = WIRING.map(([id]) => id);

/** The ids a profile list asks for; a bare `session-watch.sh`, as content before 3.1 lists it, means both. */
function wantedIds(ids: readonly string[]): Set<string> {
  return new Set(ids.flatMap((id) => (id === "session-watch.sh" ? ["session-watch.sh post-tool", "session-watch.sh stop"] : [id])));
}

function entryFor(target: string, id: string, wiring: Wiring): HookEntry {
  const [script, args = ""] = id.split(" ");
  return hook(target, script, wiring.timeout, args);
}

/** The id of an entry Arcane wired, or null for a hook the user wrote. */
function hookId(command: unknown): string | null {
  const m = typeof command === "string" && command.match(ARCANE_ENTRY);
  if (!m) return null;
  const id = m[2] ? `${m[1]} ${m[2]}` : m[1];
  return HOOK_IDS.includes(id) ? id : null;
}

/** The hooks a fresh install wires into settings.json: those its profiles list. */
export function defaultHooks(target: string, ids: readonly string[] = HOOK_IDS): HookMap {
  const wanted = wantedIds(ids);
  const hooks: HookMap = {};
  for (const [id, wirings] of WIRING) {
    if (!wanted.has(id)) continue;
    for (const wiring of wirings) {
      const groups = (hooks[wiring.event] ??= []);
      let group = groups.find((g) => g.matcher === wiring.matcher);
      if (!group) groups.push((group = { matcher: wiring.matcher, hooks: [] }));
      group.hooks.push(entryFor(target, id, wiring));
    }
  }
  return hooks;
}

/**
 * Brings the hooks of an existing install up to date without regenerating them, so
 * hooks the user added or edited survive:
 *   - a command still in the exact legacy relative form moves to `hookCommand()`;
 *   - entries for retired scripts are dropped, and groups left empty with them;
 *   - the Python session watch moves to the Node one;
 *   - the guard is added where it is missing, ahead of the other Bash hooks, and the
 *     group that runs it also matches PowerShell, which skipped every check before;
 *   - the hooks the installed profiles list are added where missing, and those no
 *     profile lists any more (a workflow removed, a hook moved out of core) go.
 * Returns a description of each change; empty when nothing changed.
 */
export function healHooks(hooks: HookMap, target: string, ids: readonly string[] = HOOK_IDS): string[] {
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
    if (hooks[event].length === 0) delete hooks[event];
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

  // The guard stays whatever the profiles say: it is the one hook that protects.
  const wanted = wantedIds(ids);
  for (const [event, groups] of Object.entries(hooks)) {
    for (const group of groups ?? []) {
      const kept = (group.hooks ?? []).filter((entry) => {
        const id = hookId(entry.command);
        if (!id || id === "guard.sh" || wanted.has(id)) return true;
        changes.push(`unwired hook: ${id}`);
        return false;
      });
      if (kept.length !== (group.hooks ?? []).length) group.hooks = kept;
    }
    hooks[event] = (groups ?? []).filter((group) => (group.hooks ?? []).length > 0);
    if (hooks[event].length === 0) delete hooks[event];
  }

  for (const [id, wirings] of WIRING) {
    if (id === "guard.sh" || !wanted.has(id)) continue;
    for (const wiring of wirings) {
      ensureHook(hooks, wiring, entryFor(target, id, wiring), wiring.label ?? `hook: ${id}`, changes);
    }
  }

  return changes;
}

/**
 * Adds `entry` to the group of its event and matcher unless a hook with the same
 * script and arguments is already wired for that event.
 */
function ensureHook(hooks: HookMap, wiring: Wiring, entry: HookEntry, label: string, changes: string[]): void {
  const signature = entry.command.replace(/^bash "[^"]*\/hooks\//, "");
  const groups = (hooks[wiring.event] ??= []);
  const present = groups.some((g) => g.hooks?.some((h) => h.command?.endsWith(signature)));
  if (present) return;
  const group = groups.find((g) => (g.matcher ?? "") === wiring.matcher);
  if (group) group.hooks = [...(group.hooks ?? []), entry];
  else groups.push({ matcher: wiring.matcher, hooks: [entry] });
  changes.push(label);
}
