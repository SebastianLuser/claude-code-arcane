#!/usr/bin/env node
/**
 * Every hook an event needs, in one process.
 *
 * Claude Code starts a process for each hook it runs, and on Windows a start costs
 * 0.2-1.5 s at rest and several seconds on a loaded machine. Each Bash command used
 * to start seven: guard.sh and its node, validate-commit.sh with a second guard.sh and
 * node, and session-watch.sh with its node after the call. One handler per event:
 *
 *   pre-tool    PreToolUse, waits    the guard, the commit checks, logging a file edit
 *   post-tool   PostToolUse, async   the session watch and the skill frontmatter check
 *   stop        Stop, waits          the session log, the worktree exit check, formatting
 *   stop-check  Stop, asyncRewake    the type check; exit 2 wakes Claude with the errors
 *
 * The settings.json command is the same text in the global install and in every
 * project, so Claude Code runs it once when both list it. It runs the global copy
 * whenever there is one, so a cloned repository never gets its own code run by the
 * user's global hooks. What to run follows the project: its .claude/arcane-hooks.json
 * when it has one (data, never code), else this install's; the hook ids its profiles
 * list. Without either list only the guard runs.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STARTED = Date.now();
const HERE = path.dirname(fileURLToPath(import.meta.url));
const WINDOWS = process.platform === "win32";
const SHELL_TOOLS = new Set(["Bash", "PowerShell"]);
const FILE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);

/** The hook ids to run: the project's list when it has one, else this install's. */
export function enabledHooks(hooksDir = HERE, project = process.env.CLAUDE_PROJECT_DIR) {
  const lists = [project && path.join(project, ".claude", "arcane-hooks.json"), path.join(hooksDir, "..", "arcane-hooks.json")];
  for (const file of lists.filter(Boolean)) {
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));
      if (Array.isArray(data.hooks)) return new Set(data.hooks.filter((id) => typeof id === "string"));
    } catch {
      // Not there or not valid: the next one.
    }
  }
  // No list: the guard alone, the one hook that protects.
  return new Set(["guard.sh"]);
}

const normcase = (p) => (WINDOWS ? path.resolve(p).toLowerCase() : path.resolve(p));

/** Nearest folder from `start` up that holds a `.git` file or folder. */
function checkoutRoot(start) {
  let current = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(current, ".git"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

// --- pre-tool ------------------------------------------------------------------

/**
 * What validate-commit.sh checked: an empty commit message, and staged 3D exports
 * when the blender profile ships its validator. --no-verify is the guard's.
 */
export async function commitProblem(command, cwd) {
  if (!command.includes("git commit")) return null;
  if (command.includes('-m ""')) return "empty commit message not allowed";

  const validator = path.join(cwd, ".claude", "skills", "blender-export", "scripts", "validate_gltf.py");
  if (!fs.existsSync(validator)) return null;
  const staged = spawnSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACM"], { cwd, encoding: "utf-8" });
  const files = (staged.stdout ?? "").split(/\r?\n/).filter((f) => /\.(glb|gltf)$/i.test(f));
  if (!files.length) return null;
  const { which } = await import("./session-watch.mjs");
  const python = which("python3") ?? which("python");
  if (!python) return null;
  const failed = [];
  for (const file of files) {
    if (!fs.existsSync(path.join(cwd, file))) continue;
    const result = spawnSync(python, [validator, file], { cwd, encoding: "utf-8" });
    if (result.status !== 0) failed.push(((result.stdout ?? "") + (result.stderr ?? "")).trim());
  }
  if (!failed.length) return null;
  return "staged 3D exports fail validation.\n" + failed.join("\n")
    + "\nFix it in Blender and re-export (see /blender-export), or unstage the file";
}

async function preTool(payload, enabled, project) {
  const { decide } = await import("./guard.mjs");
  let [decision, reason] = decide(payload);
  let source = "Arcane guard";
  // Unless the guard already denies: the commit checks used to be their own hook, and
  // their block beat the guard's ask, so approving an ask never skipped them.
  if (decision !== "deny" && enabled.has("validate-commit.sh") && SHELL_TOOLS.has(payload.tool_name ?? "")) {
    let problem = null;
    try {
      problem = await commitProblem(payload.tool_input?.command ?? "", payload.cwd || process.cwd());
    } catch {
      // A check that breaks must not drop the guard's answer.
    }
    if (problem) [decision, reason, source] = ["deny", problem, "Arcane commit check"];
  }
  // An edit the guard lets through is logged now, before the tool runs: see recordEdit().
  const watched = enabled.has("session-watch.sh post-tool") || enabled.has("session-watch.sh stop");
  if (decision !== "deny" && watched && FILE_TOOLS.has(payload.tool_name ?? "")) {
    try {
      const { recordEdit } = await import("./session-watch.mjs");
      recordEdit(payload, project);
    } catch {
      // The log is a convenience; the guard's answer still goes out.
    }
  }
  if (!decision) return;
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: decision,
      permissionDecisionReason: `${source}: ${reason}.`,
    },
  }) + "\n");
}

// --- post-tool -----------------------------------------------------------------

/** What validate-skill-change.sh warned about: a SKILL.md written without frontmatter. */
export function skillWarning(payload) {
  if (!["Write", "Edit"].includes(payload.tool_name ?? "")) return null;
  const file = payload.tool_input?.file_path ?? "";
  if (!/\/skills\/.+\/skill\.md$/i.test(file.replace(/\\/g, "/"))) return null;
  let head;
  try {
    head = fs.readFileSync(file, "utf-8").split(/\r?\n/).slice(0, 3);
  } catch {
    return null;
  }
  return head.includes("---") ? null : `The skill file ${file} may be missing its frontmatter.`;
}

async function postTool(payload, enabled, project) {
  const warnings = [];
  if (enabled.has("session-watch.sh post-tool")) {
    const { postTool: watch } = await import("./session-watch.mjs");
    warnings.push(...watch(payload, project));
  }
  if (enabled.has("validate-skill-change.sh")) {
    const warning = skillWarning(payload);
    if (warning) warnings.push(warning);
  }
  if (!warnings.length) return;
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: "Arcane session watch: " + warnings.join(" ") },
  }) + "\n");
}

// --- stop ----------------------------------------------------------------------

/** What session-stop.sh did: one line in the session log, when the project keeps one. */
function logStop(cwd) {
  const dir = path.join(checkoutRoot(cwd) ?? cwd, ".claude", "session-state");
  if (!fs.existsSync(dir)) return;
  // Claude creates the folder the first time it writes there; keep it out of commits.
  const ignore = path.join(dir, ".gitignore");
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, "*\n");
  const stamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  fs.appendFileSync(path.join(dir, "sessions.log"), `[${stamp}] Session stopped\n`);
}

/**
 * What worktree-stop.sh did. When a session that entered a worktree with
 * EnterWorktree ends a turn there with everything committed, block the stop once per
 * commit and ask Claude to leave with ExitWorktree (keep), or to say the task goes on.
 * Outside `.claude/worktrees/` it returns before starting git.
 */
export function worktreeExit(payload, sessionDir, cwd) {
  if (payload.stop_hook_active || !sessionDir) return null;
  // The checkout the session started in, also when it started in a subdirectory.
  const project = checkoutRoot(sessionDir) ?? sessionDir;
  const base = normcase(path.join(project, ".claude", "worktrees")) + path.sep;
  if (!(normcase(cwd) + path.sep).startsWith(base)) return null;
  const top = checkoutRoot(cwd);
  if (!top || !(normcase(top) + path.sep).startsWith(base)) return null;

  // One git call: the porcelain v2 header carries the commit and the branch.
  const status = spawnSync("git", ["status", "--porcelain=v2", "--branch"], { cwd: top, encoding: "utf-8" });
  if (status.status !== 0) return null;
  const lines = (status.stdout ?? "").split(/\r?\n/).filter(Boolean);
  if (lines.some((l) => !l.startsWith("#"))) return null;
  const header = (key) => lines.find((l) => l.startsWith(`# branch.${key} `))?.slice(`# branch.${key} `.length);
  const head = header("oid");
  const branch = header("head") ?? "HEAD";
  if (!head) return null;

  const dir = path.join(project, ".claude", "session-state");
  const marker = path.join(dir, ".worktree-stop");
  const stamp = `${top} ${head}`;
  try {
    if (fs.readFileSync(marker, "utf-8").trim() === stamp) return null;
  } catch {
    // First stop in this worktree.
  }
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(path.join(dir, ".gitignore"))) fs.writeFileSync(path.join(dir, ".gitignore"), "*\n");
  fs.writeFileSync(marker, stamp + "\n");
  return {
    decision: "block",
    reason: `You are still inside the worktree ${top.replace(/\\/g, "/")} (branch ${branch}) and its changes are committed. `
      + "If the task is finished, push the branch if the task included pushing, then leave with ExitWorktree "
      + "(action: keep) and tell the user the worktree path and branch. If the task continues, say so in one line and stop.",
  };
}

async function stop(payload, enabled, project) {
  const cwd = payload.cwd || process.cwd();
  if (enabled.has("session-stop.sh")) logStop(cwd);
  const block = enabled.has("worktree-stop.sh") ? worktreeExit(payload, process.env.CLAUDE_PROJECT_DIR, cwd) : null;
  if (enabled.has("session-watch.sh stop")) {
    const { formatPending } = await import("./session-watch.mjs");
    formatPending(payload, project);
  }
  if (block) process.stdout.write(JSON.stringify(block) + "\n");
}

async function stopCheck(payload, enabled, project) {
  if (!enabled.has("session-watch.sh stop")) return;
  const { checkPending } = await import("./session-watch.mjs");
  const message = await checkPending(payload, project, undefined, STARTED);
  if (!message) return;
  // asyncRewake: exit 2 wakes Claude, even after the turn ended, with stderr as a reminder.
  process.stderr.write(message + "\n");
  process.exitCode = 2;
}

// --- entry point ---------------------------------------------------------------

const MODES = { "pre-tool": preTool, "post-tool": postTool, stop, "stop-check": stopCheck };

async function main() {
  const handler = MODES[process.argv[2] ?? ""];
  if (!handler) return;
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(0, "utf-8") || "{}");
  } catch {
    return;
  }
  const project = process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd();
  await handler(payload, enabledHooks(), project);
}

// By name, not path: in a worktree hooks/ is a symlink, and Node reports the real path.
if (process.argv[1] && path.basename(process.argv[1]) === path.basename(fileURLToPath(import.meta.url))) {
  main().catch(() => {
    // A hook bug must never break the user's tool call or turn.
    process.exitCode = 0;
  });
}
