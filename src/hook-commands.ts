import fs from "node:fs";
import path from "node:path";

export interface HookEntry {
  type: string;
  command: string;
  timeout?: number;
  /** Runs in the background; the turn does not wait for it. */
  async?: boolean;
  /** Runs in the background and wakes Claude when it exits with code 2. */
  asyncRewake?: boolean;
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

/** Every tool the guard reviews, in the one PreToolUse handler. */
export const GUARDED_TOOLS_MATCHER = `${SHELL_TOOLS_MATCHER}|${FILE_TOOLS_MATCHER}`;

/**
 * The file beside settings.json listing the hook ids the install's profiles want.
 * The settings.json command is the same in every install, so the hooks read this
 * file to know what to run: the project's when it has one, else their own install's.
 */
export const HOOK_LIST_FILE = "arcane-hooks.json";

/**
 * One handler per event. Claude Code starts a process for every hook it runs, and on
 * Windows each start costs 0.2-1.5 s at rest and several seconds on a loaded machine;
 * a Bash command used to start seven. `ids` are the profile hook ids a handler
 * serves: it is wired when the install wants any of them, and arcane-hook.mjs or
 * session-start.sh runs only the parts the install wants.
 */
interface Handler {
  event: string;
  matcher: string;
  file: string;
  args?: string;
  timeout: number;
  async?: true;
  asyncRewake?: true;
  ids: readonly string[];
  /** Wired whatever the profiles say. */
  always?: true;
}

const HANDLERS: readonly Handler[] = [
  {
    event: "SessionStart", matcher: "", file: "session-start.sh", timeout: 30,
    ids: ["session-start.sh", "detect-unreal.sh", "detect-gaps.sh", "check-update.sh"],
  },
  // The guard is the one hook that protects, so it is wired whatever the profiles say.
  {
    event: "PreToolUse", matcher: GUARDED_TOOLS_MATCHER, file: "arcane-hook.mjs", args: "pre-tool", timeout: 15,
    ids: ["guard.sh", "validate-commit.sh"], always: true,
  },
  // Warnings only: the tool already ran, so nothing here is worth waiting for.
  {
    event: "PostToolUse", matcher: "", file: "arcane-hook.mjs", args: "post-tool", timeout: 30, async: true,
    ids: ["session-watch.sh post-tool", "validate-skill-change.sh"],
  },
  { event: "PreCompact", matcher: "", file: "pre-compact.sh", timeout: 10, async: true, ids: ["pre-compact.sh"] },
  { event: "PostCompact", matcher: "", file: "post-compact.sh", timeout: 10, async: true, ids: ["post-compact.sh"] },
  // Formatting stays in the foreground: in the background it could rewrite a file
  // Claude edits in the next turn. The type check does not write, so it waits for
  // nobody and wakes Claude only when the files it edited have errors.
  {
    event: "Stop", matcher: "", file: "arcane-hook.mjs", args: "stop", timeout: 120,
    ids: ["session-stop.sh", "worktree-stop.sh", "session-watch.sh stop"],
  },
  {
    event: "Stop", matcher: "", file: "arcane-hook.mjs", args: "stop-check", timeout: 300, asyncRewake: true,
    ids: ["session-watch.sh stop"],
  },
];

/** Every hook id a profile may list. */
export const HOOK_IDS: readonly string[] = [...new Set(HANDLERS.flatMap((h) => h.ids))];

/** The ids a profile list asks for; a bare `session-watch.sh`, as content before 3.1 lists it, means both. */
function wantedIds(ids: readonly string[]): Set<string> {
  return new Set(ids.flatMap((id) => (id === "session-watch.sh" ? ["session-watch.sh post-tool", "session-watch.sh stop"] : [id])));
}

/**
 * The command settings.json runs for one of Arcane's hook files.
 *
 * The same text in the global install and in every project: Claude Code runs a
 * handler once when several settings files define it, so a project with its own
 * install no longer runs each hook twice. It runs the global copy whenever there is
 * one, and the project's only on a machine without a global install: the global
 * settings must never run code a cloned repository ships, which would also let the
 * repository replace the guard. What runs still follows the project, through its
 * arcane-hooks.json, read as data. `$CLAUDE_PROJECT_DIR` names the directory the
 * session started in, so a worktree finds the scripts too. Hooks run under Git Bash
 * on Windows and sh elsewhere; `[` is a builtin there, so choosing starts no process.
 */
export function hookCommand(file: string, args = ""): string {
  const run = file.endsWith(".mjs") ? "node" : "bash";
  const suffix = args ? ` ${args}` : "";
  return `h=.claude/hooks/${file}; [ -f "$HOME/$h" ] && h="$HOME/$h" || h="$CLAUDE_PROJECT_DIR/$h"; ${run} "$h"${suffix}`;
}

function entryFor(handler: Handler): HookEntry {
  return {
    type: "command",
    command: hookCommand(handler.file, handler.args),
    timeout: handler.timeout,
    ...(handler.async ? { async: true } : {}),
    ...(handler.asyncRewake ? { asyncRewake: true } : {}),
  };
}

function handlersFor(ids: readonly string[]): Handler[] {
  const wanted = wantedIds(ids);
  return HANDLERS.filter((h) => h.always || h.ids.some((id) => wanted.has(id)));
}

const label = (h: Handler) => (h.args ? `${h.file} ${h.args}` : h.file);

/**
 * The hooks a fresh install wires into settings.json: a handler for each event its
 * profiles need. `target` no longer changes the command, which is the same everywhere.
 */
export function defaultHooks(_target: string, ids: readonly string[] = HOOK_IDS): HookMap {
  const hooks: HookMap = {};
  for (const handler of handlersFor(ids)) {
    const groups = (hooks[handler.event] ??= []);
    let group = groups.find((g) => g.matcher === handler.matcher);
    if (!group) groups.push((group = { matcher: handler.matcher, hooks: [] }));
    group.hooks.push(entryFor(handler));
  }
  return hooks;
}

/** The content of arcane-hooks.json for `ids`. */
export function hookList(ids: readonly string[] = HOOK_IDS): string {
  const known = [...wantedIds(ids)].filter((id) => HOOK_IDS.includes(id)).sort();
  return `${JSON.stringify({ hooks: known }, null, 2)}\n`;
}

/** Writes arcane-hooks.json into `claudeDir`; true when its content changed. */
export function writeHookList(claudeDir: string, ids: readonly string[] = HOOK_IDS): boolean {
  const file = path.join(claudeDir, HOOK_LIST_FILE);
  const content = hookList(ids);
  try {
    if (fs.readFileSync(file, "utf-8") === content) return false;
  } catch {
    // Not written yet.
  }
  fs.writeFileSync(file, content, "utf-8");
  return true;
}

// --- what earlier versions wrote -------------------------------------------------

/** What an install written before $CLAUDE_PROJECT_DIR wired into settings.json. */
const LEGACY_COMMAND = /^bash \.claude\/hooks\/([\w.-]+\.sh)$/;

/** One script per hook, before 3.4: `bash "<dir>/.claude/hooks/<script>" [argument]`. */
const SCRIPT_COMMAND = /^bash "?(?:\$CLAUDE_PROJECT_DIR\/|[^"]*\/)?\.claude\/hooks\/([\w.-]+\.sh)"?(?: [\w-]+)?$/;

/** How installs before the Node hooks ran the session watch: Python, through run-py.sh. */
const PYTHON_WATCH = /run-py\.sh"?\s+session_watch\.py\s+(?:post-tool|stop)\s*$/;

/** A command hookCommand() writes: the file and the argument. */
const CURRENT_COMMAND =
  /^h=\.claude\/hooks\/([\w.-]+); \[ -f "\$HOME\/\$h" \] && h="\$HOME\/\$h" \|\| h="\$CLAUDE_PROJECT_DIR\/\$h"; (?:node|bash) "\$h"(?: ([\w-]+))?$/;

/**
 * Scripts no longer shipped. The guard replaced validate-push and validate-secrets;
 * validate-assets never checked anything; detect-division, notify and the two
 * log-agent scripts only appended to files nothing read.
 */
const RETIRED_SCRIPTS = ["validate-push.sh", "validate-secrets.sh", "validate-assets.sh", "detect-division.sh", "notify.sh", "log-agent.sh", "log-agent-stop.sh"];

/** Every script an earlier version wired one by one; a user's own .claude/hooks script is none of these. */
const ARCANE_SCRIPTS = new Set([...HOOK_IDS.map((id) => id.split(" ")[0]), ...RETIRED_SCRIPTS]);

/** What an entry is: a handler of this version, one an earlier version wrote, or the user's own (null). */
function arcaneEntry(command: unknown): { current: true; file: string; args: string } | { current: false; script: string } | null {
  if (typeof command !== "string") return null;
  const current = command.match(CURRENT_COMMAND);
  if (current) return { current: true, file: current[1], args: current[2] ?? "" };
  const script = command.match(SCRIPT_COMMAND) ?? command.match(LEGACY_COMMAND);
  if (script && ARCANE_SCRIPTS.has(script[1])) return { current: false, script: script[1] };
  if (PYTHON_WATCH.test(command)) return { current: false, script: "run-py.sh session_watch.py" };
  return null;
}

/**
 * Brings the hooks of an existing install up to date without regenerating them, so
 * hooks the user added or edited survive:
 *   - every entry an earlier version wired, one script per hook in any of its path
 *     forms, goes, and the handler that took its place comes in;
 *   - a handler the profiles no longer need goes, and one they need is added;
 *   - a handler's timeout and background flags follow this version.
 * Returns a description of each change; empty when nothing changed.
 */
export function healHooks(hooks: HookMap, _target: string, ids: readonly string[] = HOOK_IDS): string[] {
  const changes: string[] = [];
  const handlers = handlersFor(ids);
  const isWanted = (event: string, matcher: string, file: string, args: string) =>
    handlers.some((h) => h.event === event && h.matcher === matcher && h.file === file && (h.args ?? "") === args);

  for (const [event, groups] of Object.entries(hooks)) {
    if (!Array.isArray(groups)) continue;
    for (const group of groups) {
      const kept = (group.hooks ?? []).filter((entry) => {
        const found = arcaneEntry(entry.command);
        if (!found) return true;
        if (found.current && isWanted(event, group.matcher ?? "", found.file, found.args)) return true;
        changes.push(found.current ? `unwired hook: ${found.file}${found.args ? ` ${found.args}` : ""}` : `replaced hook: ${found.script}`);
        return false;
      });
      if (kept.length !== (group.hooks ?? []).length) group.hooks = kept;
    }
    hooks[event] = groups.filter((group) => (group.hooks ?? []).length > 0);
    if (hooks[event].length === 0) delete hooks[event];
  }

  for (const handler of handlers) {
    const wanted = entryFor(handler);
    const groups = (hooks[handler.event] ??= []);
    let group = groups.find((g) => (g.matcher ?? "") === handler.matcher && g.hooks?.some((e) => e.command === wanted.command));
    const present = group?.hooks.find((e) => e.command === wanted.command);
    if (present) {
      if (present.timeout !== wanted.timeout || !!present.async !== !!wanted.async || !!present.asyncRewake !== !!wanted.asyncRewake) {
        Object.assign(present, { timeout: wanted.timeout });
        for (const flag of ["async", "asyncRewake"] as const) {
          if (wanted[flag]) present[flag] = true;
          else delete present[flag];
        }
        changes.push(`hook settings: ${label(handler)}`);
      }
      continue;
    }
    group = groups.find((g) => (g.matcher ?? "") === handler.matcher);
    if (group) group.hooks = [...(group.hooks ?? []), wanted];
    else groups.push({ matcher: handler.matcher, hooks: [wanted] });
    changes.push(`hook: ${label(handler)}`);
  }

  return changes;
}
