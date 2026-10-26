#!/usr/bin/env node
/**
 * Session watch: cheap, deterministic signals the model should not have to remember.
 *
 * `session-watch.mjs post-tool` (PostToolUse, every tool):
 *   - records each file Claude edits, for the Stop check below;
 *   - warns when the same tool runs with the same input 5 times in a row (a loop);
 *   - warns once when a session has edited 15 files (scope drift);
 *   - warns when the context passes 70% and 85% of the real window, so active.md is
 *     brought up to date before a compaction. The window size comes from the status
 *     line (statusline.sh caches what Claude Code reports); without it, no warning,
 *     since guessing the window would warn far too early on 1M-token sessions.
 *
 * `session-watch.mjs stop` (Stop): formats the files edited this turn and type-checks
 * them with the project's own tools (Prettier or Biome + tsc, gofmt + go vet,
 * dotnet format). Only errors in files edited this turn block the stop, once, so
 * errors the project already had never trap a session.
 *
 * State lives in .claude/session-state/watch-<session>.json, which ignores itself.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const LOOP_LENGTH = 5;
export const SCOPE_FILES = 15;
const CONTEXT_WARNINGS = [70, 85];
const FILE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);
const IGNORED_INPUT_KEYS = new Set(["description", "timeout"]);
const CHECK_TIMEOUT_MS = 90_000;
const MAX_REPORT_LINES = 25;
const WINDOWS = process.platform === "win32";

// --- state -------------------------------------------------------------------

function stateDir(project) {
  const dir = path.join(project, ".claude", "session-state");
  fs.mkdirSync(dir, { recursive: true });
  const ignore = path.join(dir, ".gitignore");
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, "*\n");
  return dir;
}

function safe(session) {
  return (session || "default").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64) || "default";
}

export function loadState(project, session) {
  try {
    return JSON.parse(fs.readFileSync(path.join(stateDir(project), `watch-${safe(session)}.json`), "utf-8"));
  } catch {
    return {};
  }
}

function saveState(project, session, state) {
  fs.writeFileSync(path.join(stateDir(project), `watch-${safe(session)}.json`), JSON.stringify(state));
}

/** JSON with sorted keys, so the same input always hashes the same. */
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

// --- post-tool -----------------------------------------------------------------

/** Update the session state and return the warnings to show Claude. */
export function postTool(payload, project) {
  const session = payload.session_id ?? "";
  const state = loadState(project, session);
  const warnings = [];
  const tool = payload.tool_name ?? "";
  const input = payload.tool_input ?? {};

  if (FILE_TOOLS.has(tool)) {
    const file = input.file_path || input.notebook_path;
    if (file) {
      const absolute = path.resolve(project, file);
      state.pending ??= [];
      if (!state.pending.includes(absolute)) state.pending.push(absolute);
      state.edited ??= [];
      if (!state.edited.includes(absolute)) state.edited.push(absolute);
      if (state.edited.length >= SCOPE_FILES && !state.scope_warned) {
        state.scope_warned = true;
        warnings.push(`This session has edited ${state.edited.length} files. Check the change is still `
          + "within the task's scope before going further.");
      }
    }
  }

  // The description is Claude's label for the call ("call 2 of 6"), not what runs.
  const action = Object.fromEntries(Object.entries(input).filter(([k]) => !IGNORED_INPUT_KEYS.has(k)));
  const digest = createHash("sha1").update(stable([tool, action])).digest("hex");
  const recent = [...(state.recent ?? []), digest].slice(-LOOP_LENGTH);
  state.recent = recent;
  if (recent.length === LOOP_LENGTH && new Set(recent).size === 1 && state.loop_warned !== digest) {
    state.loop_warned = digest;
    warnings.push(`${tool} ran ${LOOP_LENGTH} times in a row with the same input. Stop repeating it: `
      + "name the assumption that may be wrong, or ask the user one diagnostic question.");
  }

  const used = contextUsed(project, session);
  if (used !== null) {
    for (const level of CONTEXT_WARNINGS) {
      if (used >= level && (state.context_warned ?? 0) < level) {
        state.context_warned = level;
        warnings.push(`Context is at ${used.toFixed(0)}% of the window. At the next logical point `
          + "(a commit, a finished step), update .arcane/session-state/active.md if this "
          + "task has one, then suggest the user run /compact.");
        break;
      }
    }
  }

  saveState(project, session, state);
  return warnings;
}

/** Percent of the real context window in use, as the status line last saw it. */
function contextUsed(project, session) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path.join(project, ".claude", "session-state", "context.json"), "utf-8"));
  } catch {
    return null;
  }
  if (data?.session_id !== session) return null;
  const used = typeof data.used_percentage === "string" ? Number(data.used_percentage) : data.used_percentage;
  return typeof used === "number" && Number.isFinite(used) ? used : null;
}

// --- stop ----------------------------------------------------------------------

/** Nearest ancestor of `start` (up to `stopAt`) containing one of `names`. */
function findUp(start, names, stopAt) {
  let current = path.dirname(start);
  const limit = path.resolve(stopAt);
  for (;;) {
    if (names.some((n) => fs.existsSync(path.join(current, n)))) return current;
    if (path.resolve(current) === limit || path.dirname(current) === current) return null;
    current = path.dirname(current);
  }
}

/** A tool installed in the project; never one npx would download. */
function localBin(root, name) {
  for (const folder of [root, path.dirname(root)]) {
    const base = path.join(folder, "node_modules", ".bin", name);
    for (const candidate of WINDOWS ? [`${base}.cmd`, base] : [base]) {
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function which(name) {
  const exts = WINDOWS ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";") : [""];
  for (const dir of (process.env.PATH ?? "").split(path.delimiter)) {
    for (const ext of exts) {
      if (dir && fs.existsSync(path.join(dir, name + ext))) return path.join(dir, name + ext);
    }
  }
  return null;
}

/** Group edited files by project root and pick the format and check commands. */
export function planChecks(files, project) {
  const plans = new Map();
  const add = (key, cwd, format, check, file) => {
    const id = JSON.stringify(key);
    if (!plans.has(id)) plans.set(id, { cwd, format, check, files: [] });
    plans.get(id).files.push(file);
  };

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const ext = path.extname(file).toLowerCase();
    if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css", ".scss", ".md"].includes(ext)) {
      const root = findUp(file, ["package.json"], project);
      if (!root) continue;
      let format = null;
      const biome = localBin(root, "biome");
      const prettier = localBin(root, "prettier");
      if (biome && ["biome.json", "biome.jsonc"].some((n) => fs.existsSync(path.join(root, n)))) {
        format = [biome, "format", "--write"];
      } else if (prettier) format = [prettier, "--write", "--log-level", "warn"];
      let check = null;
      if (ext === ".ts" || ext === ".tsx") {
        const tsconfig = findUp(file, ["tsconfig.json"], project);
        const tsc = localBin(root, "tsc");
        if (tsconfig && tsc) check = [tsc, "--noEmit", "--pretty", "false", "-p", path.join(tsconfig, "tsconfig.json")];
      }
      add(["node", root, check ?? []], root, format, check, file);
    } else if (ext === ".go" && which("gofmt")) {
      const root = findUp(file, ["go.mod"], project);
      if (root) {
        const rel = "./" + path.relative(root, path.dirname(file)).replace(/\\/g, "/");
        add(["go", root, rel], root, ["gofmt", "-w"], which("go") ? ["go", "vet", rel] : null, file);
      }
    } else if (ext === ".cs" && which("dotnet")) {
      const root = findUp(file, [".editorconfig"], project) ?? project;
      add(["dotnet", root], root, ["dotnet", "format", "whitespace", ".", "--folder", "--include"], null, file);
    }
  }
  return [...plans.values()];
}

/** Runs a command; [exit code, output]. A tool that cannot start is skipped, never blocking. */
export function run(command, cwd) {
  // Node will not start a .cmd without a shell, and the shell needs every argument quoted.
  const shell = WINDOWS && /\.(cmd|bat)$/i.test(command[0]);
  const [file, args] = shell
    ? [command.map((a) => `"${a.replace(/"/g, '""')}"`).join(" "), []]
    : [command[0], command.slice(1)];
  const result = spawnSync(file, args, { cwd, shell, encoding: "utf-8", timeout: CHECK_TIMEOUT_MS });
  if (result.error) return [0, `skipped: ${result.error.message}`];
  return [result.status ?? 0, (result.stdout ?? "") + (result.stderr ?? "")];
}

function normcase(p) {
  return WINDOWS ? p.toLowerCase() : p;
}

/** Error lines that name one of `files`; errors elsewhere predate this turn. */
export function errorsIn(output, files, cwd) {
  const wanted = new Set(files.map((f) => normcase(path.resolve(f))));
  const lines = [];
  for (const raw of output.split(/\r?\n/)) {
    // go vet prefixes type errors with "vet: " ("vet.exe: " on Windows).
    const line = raw.trim().replace(/^vet(?:\.exe)?:\s+/, "");
    const match = line.match(/^(.+?)(?:\(\d+,\d+\)|:\d+:\d+)/);
    if (match && wanted.has(normcase(path.resolve(cwd, match[1].trim())))) lines.push(line.trim());
  }
  return lines;
}

export function stop(payload, project, runner = run) {
  const session = payload.session_id ?? "";
  const state = loadState(project, session);
  const files = state.pending ?? [];
  delete state.pending;
  saveState(project, session, state);
  if (!files.length || payload.stop_hook_active) return null;

  const problems = [];
  for (const plan of planChecks(files, project)) {
    if (plan.format) runner([...plan.format, ...plan.files], plan.cwd);
    if (plan.check) {
      const [code, output] = runner(plan.check, plan.cwd);
      if (code !== 0) problems.push(...errorsIn(output, plan.files, plan.cwd));
    }
  }
  if (!problems.length) return null;
  const shown = problems.slice(0, MAX_REPORT_LINES);
  const more = problems.length > shown.length ? `\n... and ${problems.length - shown.length} more` : "";
  return {
    decision: "block",
    reason: "The type check found errors in files you edited this turn. Fix them before finishing:\n"
      + shown.join("\n") + more,
  };
}

// --- entry point ---------------------------------------------------------------

function main() {
  const mode = process.argv[2] ?? "";
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(0, "utf-8") || "{}");
  } catch {
    return;
  }
  const project = process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd();
  if (mode === "post-tool") {
    const warnings = postTool(payload, project);
    if (warnings.length) {
      process.stdout.write(JSON.stringify({ hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: "Arcane session watch: " + warnings.join(" "),
      } }) + "\n");
    }
  } else if (mode === "stop") {
    const decision = stop(payload, project);
    if (decision) process.stdout.write(JSON.stringify(decision) + "\n");
  }
}

// By name, not path: in a worktree hooks/ is a symlink, and Node reports the real path.
if (process.argv[1] && path.basename(process.argv[1]) === path.basename(fileURLToPath(import.meta.url))) {
  try {
    main();
  } catch {
    // A watch bug must never break the session.
  }
  process.exitCode = 0;
}
