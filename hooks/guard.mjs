#!/usr/bin/env node
/**
 * PreToolUse guard for Bash, PowerShell and file-writing tools.
 *
 * Reads the hook payload on stdin and answers with a permission decision:
 *   deny - actions the user runs by hand if they really want them (force push,
 *          bypassing git hooks, sudo, writing .env files ...)
 *   ask  - destructive or supply-chain-sensitive actions (rm -rf outside build
 *          output, dropping data, a new dependency, editing CI or lint configs ...)
 *   none - everything else; the normal permission rules decide.
 *
 * The command is parsed quote-aware and split on && || ; | so a chained or quoted
 * command cannot hide a match. On Windows Claude also runs commands through its
 * PowerShell tool, so the same rules cover it, plus PowerShell's own spellings
 * (Remove-Item -Recurse, Set-Content .env). This is a guard against mistakes, not
 * a sandbox: a script or an interpreter one-liner can still do anything.
 *
 * Node, not Python: Arcane is installed with npx, so Node is on every machine that
 * runs these hooks, and with no Python the old guard.py silently did nothing.
 * `guard.mjs --command` only prints the Bash command from the payload;
 * validate-commit.sh uses it instead of a regex.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DENY = "deny";
export const ASK = "ask";
export const NONE = null;
const RANK = { deny: 2, ask: 1, null: 0 };

// Build output that a command regenerates; rm -rf on these alone never asks.
const REGENERABLE = new Set([
  "node_modules", "dist", "build", ".next", "out", "coverage",
  "__pycache__", ".pytest_cache", "Library", "Temp", "obj",
  "Binaries", "Intermediate", "DerivedDataCache",
]);

const SEPARATORS = new Set(["&&", "||", ";", "|", "&", "(", ")", "|&", ";;"]);
const WRAPPERS = new Set(["command", "exec", "time", "nohup", "env", "builtin", "nice"]);
const DB_CLIENTS = new Set([
  "psql", "mysql", "mariadb", "sqlite3", "sqlcmd", "mongo", "mongosh",
  "redis-cli", "cockroach", "clickhouse-client", "duckdb",
]);
const DATA_LOSS_SQL = [
  [/\bDROP\s+(TABLE|DATABASE|SCHEMA)\b/i, "drops a table, database or schema"],
  [/\bTRUNCATE\b/i, "truncates a table"],
  [/\bFLUSH(ALL|DB)\b/i, "flushes Redis"],
  [/\.dropDatabase\s*\(/i, "drops a MongoDB database"],
];
// [programs that run it, pattern over the segment, reason]. Scoped to the program so
// a commit message that merely mentions "terraform destroy" does not match.
const TEXT_RULES = [
  [["prisma"], /\bmigrate\s+reset\b/i, "resets the database (prisma migrate reset)"],
  [["supabase"], /\bdb\s+reset\b/i, "resets the database (supabase db reset)"],
  [["dotnet"], /\bef\s+database\s+drop\b/i, "drops the database (dotnet ef database drop)"],
  [["php", "rails", "rake", "bundle", "knex", "sequelize", "sequelize-cli"],
    /\b(migrate|db):(rollback|reset|fresh|undo|drop)\b|\bdb:migrate:undo\b/i, "rolls back or drops the database"],
  [["alembic"], /\bdowngrade\b/i, "rolls back migrations (alembic downgrade)"],
  [["goose", "migrate"], /\sdown\b/i, "rolls back migrations"],
  [["docker"], /\bsystem\s+prune\b/i, "deletes Docker data (system prune)"],
  [["docker"], /\bvolume\s+(rm|prune)\b/i, "deletes Docker volumes"],
  [["docker", "docker-compose"], /\bdown\b.*\s(-v|--volumes)\b/i, "deletes the compose volumes (database data)"],
  [["terraform", "tofu", "pulumi"], /\bdestroy\b/i, "destroys infrastructure"],
  [["kubectl"], /\bdelete\b/i, "deletes Kubernetes resources"],
  [["helm"], /\b(uninstall|delete)\b/i, "uninstalls a Helm release"],
  [["npm", "pnpm", "yarn"], /^\S+\s+(publish|unpublish)\b/i, "publishes or unpublishes a package"],
];
// Launchers whose first argument is the real program (npx prisma ..., pnpm exec knex ...).
const LAUNCHERS = new Set(["npx", "pnpx", "bunx", "pnpm", "yarn", "npm", "bun", "uv", "uvx", "poetry"]);

const ENV_FILE = /^\.env(\..+)?$/;
const READERS = new Set(["cat", "type", "less", "more", "head", "tail", "bat", "nl", "strings", "grep", "rg",
  "get-content", "gc", "select-string", "sls"]);
// PowerShell's Remove-Item and its aliases; `rm` there is Remove-Item, not POSIX rm.
const PS_REMOVERS = new Set(["remove-item", "rm", "ri", "del", "erase", "rd", "rmdir"]);
const PS_WRITERS = new Set(["set-content", "add-content", "out-file", "sc", "ac", "tee-object"]);
const ENV_SAFE_SUFFIXES = [".example", ".sample", ".template", ".dist"];

// Write/Edit targets, matched against the path relative to the project root.
const ASK_ALWAYS = [
  [".github/workflows/*", "edits a CI workflow, which runs with the repo's secrets"],
  ["infra/*", "edits infrastructure code"],
  ["terraform/*", "edits infrastructure code"],
  ["*.tf", "edits infrastructure code"],
  ["*.tfvars", "edits infrastructure variables"],
];
const ASK_IF_EXISTS = [
  ["migrations/*", "edits an existing migration; shipped migrations are immutable"],
  ["*/migrations/*", "edits an existing migration; shipped migrations are immutable"],
  ["alembic/versions/*", "edits an existing migration; shipped migrations are immutable"],
  ["db/migrate/*", "edits an existing migration; shipped migrations are immutable"],
];
const MANIFESTS = new Set([
  "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb",
  "requirements.txt", "pyproject.toml", "poetry.lock", "uv.lock", "Pipfile", "Pipfile.lock",
  "go.mod", "go.sum", "Cargo.toml", "Cargo.lock", "Gemfile", "Gemfile.lock",
  "composer.json", "composer.lock", "packages.lock.json",
]);
const MANIFEST_GLOBS = ["requirements*.txt", "*.csproj", "Directory.Packages.props", "Packages/manifest.json"];
const CHECK_CONFIGS = [
  ".eslintrc*", "eslint.config.*", ".prettierrc*", "prettier.config.*", "tsconfig*.json",
  "biome.json", "biome.jsonc", ".golangci.y*ml", ".golangci.toml", "ruff.toml", ".ruff.toml",
  ".flake8", ".stylelintrc*", "stylelint.config.*", ".editorconfig",
];

// --- command parsing -------------------------------------------------------

/** The last path component, split on / and \ alike. */
function basename(p) {
  return p.split(/[\\/]/).pop() ?? "";
}

/** Drop heredoc bodies: their text is data (a commit message), not commands. */
export function stripHeredocBodies(command) {
  return command.replace(/<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?\n\s*\2\s*(?=\n|$|\))/g, "<<$2$3");
}

/**
 * Turn newlines outside quotes into `;` and drop comments.
 *
 * A comment runs to the end of its line, so it has to go before the newlines do:
 * guard.py converted them first and let shlex treat `#` as a comment to the end
 * of the whole command, so `echo hi # note` followed by `git push --force` on the
 * next line was never checked.
 */
export function newlinesToSeparators(command) {
  let out = "";
  let quote = null;
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (quote) {
      if (ch === quote) quote = null;
      out += ch;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      out += ch;
    } else if (ch === "#" && (i === 0 || /[\s;&|()]/.test(command[i - 1]))) {
      while (i + 1 < command.length && command[i + 1] !== "\n") i++;
    } else {
      out += ch === "\n" ? ";" : ch;
    }
  }
  return out;
}

const WHITESPACE = " \t\r\n";
const QUOTES = "'\"";
const PUNCTUATION = "();<>|&";

/**
 * Split like Python's shlex in POSIX mode with punctuation_chars and
 * whitespace_split, which guard.py used: quotes group and are removed, a run of
 * ();<>|& is its own token, and `\` escapes the next character (not in PowerShell,
 * where it is a path separator). Throws on an unclosed quote or a trailing escape.
 */
function shlexSplit(input, escapes) {
  const tokens = [];
  let i = 0;
  let state = " ";
  let token = "";
  let quoted = false;
  let escapedState = " ";
  const pushback = [];
  const next = () => (pushback.length ? pushback.pop() : i < input.length ? input[i++] : "");

  for (;;) {
    const ch = next();
    let done = false;
    if (state === " ") {
      if (!ch) {
        state = null;
        done = true;
      } else if (WHITESPACE.includes(ch)) {
        if (token || quoted) done = true;
      } else if (escapes.includes(ch)) {
        escapedState = "a";
        state = ch;
      } else if (PUNCTUATION.includes(ch)) {
        token = ch;
        state = "c";
      } else if (QUOTES.includes(ch)) {
        state = ch;
      } else {
        token = ch;
        state = "a";
      }
    } else if (QUOTES.includes(state)) {
      quoted = true;
      if (!ch) throw new Error("No closing quotation");
      if (ch === state) state = "a";
      else if (escapes.includes(ch) && state === '"') {
        escapedState = state;
        state = ch;
      } else token += ch;
    } else if (escapes.includes(state)) {
      if (!ch) throw new Error("No escaped character");
      // Inside double quotes a backslash only escapes " and itself.
      if (QUOTES.includes(escapedState) && ch !== state && ch !== escapedState) token += state;
      token += ch;
      state = escapedState;
    } else if (state === "a" || state === "c") {
      if (!ch) {
        state = null;
        done = true;
      } else if (WHITESPACE.includes(ch)) {
        state = " ";
        if (token || quoted) done = true;
      } else if (state === "c") {
        if (PUNCTUATION.includes(ch)) token += ch;
        else {
          pushback.push(ch);
          state = " ";
          done = true;
        }
      } else if (QUOTES.includes(ch)) {
        state = ch;
      } else if (escapes.includes(ch)) {
        escapedState = "a";
        state = ch;
      } else if (!PUNCTUATION.includes(ch)) {
        token += ch;
      } else {
        pushback.push(ch);
        state = " ";
        if (token || quoted) done = true;
      }
    }
    if (done || state === null) {
      if (token || quoted) tokens.push(token);
      token = "";
      quoted = false;
      if (state === null) return tokens;
    }
  }
}

export function tokenize(command, shell = "bash") {
  try {
    return shlexSplit(command, shell === "powershell" ? "" : "\\");
  } catch {
    // Unbalanced quotes: fall back to a plain split.
    return command.match(/&&|\|\||[;|&()]|[^\s;|&()]+/g) ?? [];
  }
}

export function segments(command, shell = "bash") {
  const result = [];
  let current = [];
  for (const token of tokenize(newlinesToSeparators(stripHeredocBodies(command)), shell)) {
    if (SEPARATORS.has(token)) {
      if (current.length) result.push(current);
      current = [];
    } else current.push(token);
  }
  if (current.length) result.push(current);
  return result;
}

/** [command, shell] pairs run by this segment: bash -c "...", pwsh -c "...", eval, iex, $(...). */
function nestedCommands(tokens, shell = "bash") {
  const found = [];
  tokens.forEach((token, i) => {
    const name = basename(token).toLowerCase();
    const flag = i + 1 < tokens.length ? tokens[i + 1].toLowerCase() : "";
    if (["bash", "sh", "zsh"].includes(name) && i + 2 < tokens.length && flag === "-c") {
      found.push([tokens[i + 2], "bash"]);
    }
    if (["pwsh", "pwsh.exe", "powershell", "powershell.exe"].includes(name) && i + 2 < tokens.length
      && (flag === "-c" || flag === "-command")) {
      found.push([tokens[i + 2], "powershell"]);
    }
    if (token === "eval" && i + 1 < tokens.length) found.push([tokens.slice(i + 1).join(" "), "bash"]);
    if ((name === "iex" || name === "invoke-expression") && i + 1 < tokens.length) {
      found.push([tokens.slice(i + 1).join(" "), "powershell"]);
    }
    for (const m of token.matchAll(/\$\(([^()]*)\)/g)) found.push([m[1], shell]);
    // In PowerShell a backtick is an escape, not command substitution.
    if (shell === "bash") for (const m of token.matchAll(/`([^`]*)`/g)) found.push([m[1], shell]);
  });
  return found;
}

/** Strip env assignments and wrappers; return [basename, args]. */
function program(tokens) {
  let i = 0;
  while (i < tokens.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i]) || WRAPPERS.has(basename(tokens[i])))) i++;
  if (i >= tokens.length) return ["", []];
  let name = basename(tokens[i]).toLowerCase();
  if (name.endsWith(".exe")) name = name.slice(0, -4);
  return [name, tokens.slice(i + 1)];
}

/** `npx prisma migrate reset` runs prisma; `php artisan migrate:fresh` runs php. */
function effectiveProgram(name, args) {
  if (!LAUNCHERS.has(name)) return name;
  let rest = args.filter((a) => !a.startsWith("-"));
  if (["exec", "dlx", "run", "x"].includes(rest[0])) rest = rest.slice(1);
  return rest.length ? basename(rest[0]).toLowerCase() : name;
}

function shortFlags(args) {
  const letters = new Set();
  for (const arg of args) {
    if (arg.startsWith("-") && !arg.startsWith("--") && arg.length > 1) for (const c of arg.slice(1)) letters.add(c);
  }
  return letters;
}

function positional(args, takesValue = new Set()) {
  const out = [];
  let skip = false;
  for (const arg of args) {
    if (skip) {
      skip = false;
      continue;
    }
    if (takesValue.has(arg)) {
      skip = true;
      continue;
    }
    if (!arg.startsWith("-")) out.push(arg);
  }
  return out;
}

// --- rules -----------------------------------------------------------------

function checkGit(args) {
  let i = 0;
  while (i < args.length && args[i].startsWith("-")) {
    if (args[i] === "-c" && i + 1 < args.length) {
      if (args[i + 1].toLowerCase().startsWith("core.hookspath")) {
        return [DENY, "git -c core.hooksPath= bypasses the repository's git hooks"];
      }
      i += 2;
    } else if (["-C", "--git-dir", "--work-tree"].includes(args[i]) && i + 1 < args.length) i += 2;
    else i += 1;
  }
  if (i >= args.length) return [NONE, ""];
  const sub = args[i];
  const rest = args.slice(i + 1);
  const flags = shortFlags(rest);

  if (rest.includes("--no-verify") && ["commit", "push", "merge", "rebase", "cherry-pick", "am"].includes(sub)) {
    return [DENY, "--no-verify skips the git hooks; fix what they report instead"];
  }
  if (sub === "commit" && flags.has("n")) return [DENY, "git commit -n skips the git hooks; fix what they report instead"];
  if (sub === "push") {
    const forced = rest.some((a) => a === "--force" || a.startsWith("--force-")) || flags.has("f");
    if (forced || rest.some((a) => a.startsWith("+"))) {
      return [DENY, "Force push is blocked. If it is really needed, ask the user to run it "
        + "themselves: `! git push --force-with-lease`"];
    }
    if (rest.includes("--delete") || flags.has("d") || rest.some((a) => a.startsWith(":") && a.length > 1)) {
      return [ASK, "deletes a remote branch or tag"];
    }
  }
  if (sub === "reset" && rest.includes("--hard")) {
    return [DENY, "git reset --hard throws away uncommitted work; the user runs it by hand"];
  }
  if (sub === "clean" && (flags.has("f") || rest.includes("--force"))) {
    return [DENY, "git clean -f deletes untracked files; the user runs it by hand"];
  }
  const wholeTree = rest.some((a) => [".", ":/", "*", ":/*"].includes(a));
  if (sub === "checkout" && (wholeTree || flags.has("f") || rest.includes("--force"))) {
    return [ASK, "discards uncommitted changes (git checkout)"];
  }
  if (sub === "restore" && wholeTree && !(rest.includes("--staged") && !rest.includes("--worktree"))) {
    return [ASK, "discards uncommitted changes (git restore)"];
  }
  if (sub === "stash" && ["drop", "clear"].includes(rest[0])) return [ASK, "deletes stashed work"];
  if (sub === "branch" && (flags.has("D") || (rest.includes("--delete") && rest.includes("--force")))) {
    return [ASK, "force-deletes a branch without checking it is merged"];
  }
  if (sub === "tag" && (flags.has("d") || rest.includes("--delete"))) return [ASK, "deletes a tag"];
  if (sub === "filter-repo" || sub === "filter-branch") return [ASK, "rewrites the repository history"];
  return [NONE, ""];
}

function checkRm(args) {
  const flags = shortFlags(args);
  const recursive = flags.has("r") || flags.has("R") || args.includes("--recursive");
  const force = flags.has("f") || args.includes("--force");
  if (!(recursive && force)) return [NONE, ""];
  return deleteDecision(positional(args));
}

/** Remove-Item -Recurse deletes a whole tree without a prompt, -Force or not. */
function checkRemoveItem(args) {
  const params = args.map((a) => (a.startsWith("-") ? a.toLowerCase() : a)); // parameters ignore case
  if (!params.some((a) => a.length >= 2 && "-recurse".startsWith(a))) return [NONE, ""];
  const paths = positional(params, new Set(["-filter", "-include", "-exclude", "-stream"]));
  return deleteDecision(paths.flatMap((p) => p.split(",")).filter(Boolean)); // `a, b` is an array
}

/** Ask before a recursive delete, unless every target is regenerable build output. */
function deleteDecision(targets) {
  const safe = targets.length > 0 && targets.every((t) =>
    !t.startsWith("/") && !t.startsWith("~") && !/^[A-Za-z]:/.test(t)
    && !t.split(/[/\\]/).includes("..") && !t.includes("*")
    && REGENERABLE.has(basename(t.replace(/\\/g, "/").replace(/\/+$/, ""))));
  if (safe) return [NONE, ""];
  return [ASK, `recursively force-deletes ${targets.join(", ") || "files"}`];
}

function checkNewDependency(name, args) {
  let packages = [];
  const starts = (...words) => words.every((w, k) => args[k] === w);
  if (["npm", "pnpm", "yarn", "bun"].includes(name) && args.length) {
    const [sub, ...rest] = args;
    if (sub === "add" || (["npm", "pnpm"].includes(name) && ["install", "i", "in", "ins"].includes(sub))) {
      packages = positional(rest);
    }
  } else if (["pip", "pip3"].includes(name) && starts("install")) packages = pipPackages(args.slice(1));
  else if (["python", "python3", "py"].includes(name) && starts("-m", "pip", "install")) packages = pipPackages(args.slice(3));
  else if (name === "uv" && starts("pip", "install")) packages = pipPackages(args.slice(2));
  else if (["uv", "poetry", "cargo"].includes(name) && starts("add")) packages = positional(args.slice(1));
  else if (name === "go" && starts("get")) packages = positional(args.slice(1)).filter((p) => !p.startsWith("."));
  else if (name === "dotnet" && starts("add", "package")) packages = positional(args.slice(2));
  if (!packages.length) return [NONE, ""];
  return [ASK, `adds a new dependency: ${packages.join(", ")}. Check the exact name before `
    + "installing: a one-letter typo can install a malicious package"];
}

function pipPackages(args) {
  const takesValue = new Set(["-r", "--requirement", "-c", "--constraint", "-e", "--editable", "-i",
    "--index-url", "--extra-index-url", "-t", "--target", "--prefix", "-f", "--find-links"]);
  return positional(args, takesValue).filter((p) =>
    !(p.startsWith(".") || p.startsWith("/") || p.endsWith(".whl") || p.endsWith(".tar.gz") || p.endsWith(".zip")));
}

function writesEnvFile(tokens) {
  const targets = [];
  tokens.forEach((token, i) => {
    if ((token === ">" || token === ">>") && i + 1 < tokens.length) targets.push(tokens[i + 1]);
  });
  const [name, args] = program(tokens);
  if (name === "tee") targets.push(...positional(args));
  return targets.some(isEnvFile);
}

function isEnvFile(p) {
  const base = basename(p.replace(/\\/g, "/"));
  return ENV_FILE.test(base) && !ENV_SAFE_SUFFIXES.some((s) => base.endsWith(s));
}

function checkSegment(tokens, depth = 0, shell = "bash") {
  const [name, args] = program(tokens);
  const text = tokens.join(" ");
  const decisions = [];

  if (name === "sudo") decisions.push([DENY, "sudo is blocked; the user runs privileged commands by hand"]);
  if (name === "chmod" && args.some((a) => a === "777" || a === "0777")) {
    decisions.push([DENY, "chmod 777 makes files writable by everyone"]);
  }
  if (writesEnvFile(tokens) || (PS_WRITERS.has(name) && positional(args).some(isEnvFile))) {
    decisions.push([DENY, "writing a .env file is blocked; the user edits secrets by hand"]);
  }
  if (READERS.has(name) && positional(args).some(isEnvFile)) {
    decisions.push([DENY, "reading a .env file would put its secrets in the conversation"]);
  }
  if (name === "git") decisions.push(checkGit(args));
  if (shell === "powershell" && PS_REMOVERS.has(name)) decisions.push(checkRemoveItem(args));
  else if (name === "rm") decisions.push(checkRm(args));
  if (name === "gh") {
    const pair = args.slice(0, 2).join(" ");
    if (["repo delete", "release delete", "secret delete", "secret remove"].includes(pair)) {
      decisions.push([ASK, `gh ${pair} deletes data on GitHub`]);
    }
    if (args[0] === "api" && /(-X|--method)[ =]?\s*DELETE\b/i.test(text)) decisions.push([ASK, "gh api DELETE request"]);
  }
  decisions.push(checkNewDependency(name, args));
  if (tokens.some((t) => DB_CLIENTS.has(basename(t).toLowerCase()))) {
    for (const [pattern, reason] of DATA_LOSS_SQL) if (pattern.test(text)) decisions.push([ASK, reason]);
    if (/\bDELETE\s+FROM\b/i.test(text) && !/\bWHERE\b/i.test(text)) {
      decisions.push([ASK, "DELETE without WHERE removes every row"]);
    }
  }
  const runs = new Set([name, effectiveProgram(name, args)]);
  for (const [programs, pattern, reason] of TEXT_RULES) {
    if (programs.some((p) => runs.has(p)) && pattern.test(text)) decisions.push([ASK, reason]);
  }
  if (depth < 3) {
    for (const [inner, innerShell] of nestedCommands(tokens, shell)) {
      decisions.push(checkCommand(inner, depth + 1, innerShell));
    }
  }
  return worst(decisions);
}

export function checkCommand(command, depth = 0, shell = "bash") {
  return worst(segments(command, shell).map((seg) => checkSegment(seg, depth, shell)));
}

function worst(decisions) {
  let best = [NONE, ""];
  for (const decision of decisions) if (RANK[decision[0]] > RANK[best[0]]) best = decision;
  return best;
}

/** fnmatch as Python does it: `*` crosses `/`, and case is ignored on Windows. */
function fnmatch(name, pattern) {
  let source = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*") source += ".*";
    else if (c === "?") source += ".";
    else if (c === "[" && pattern.indexOf("]", i + 2) !== -1) {
      const end = pattern.indexOf("]", i + 2);
      let set = pattern.slice(i + 1, end).replace(/\\/g, "\\\\");
      if (set.startsWith("!")) set = "^" + set.slice(1);
      source += `[${set}]`;
      i = end;
    } else source += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${source}$`, process.platform === "win32" ? "si" : "s").test(name);
}

export function checkFile(file, root) {
  if (!file) return [NONE, ""];
  const absolute = path.resolve(root, file);
  let rel = path.relative(path.resolve(root), absolute).replace(/\\/g, "/");
  if (rel.startsWith("../") || rel === ".." || path.isAbsolute(rel)) return [NONE, ""];
  rel = rel.replace(/^\.claude\/worktrees\/[^/]+\//, "");
  const base = basename(rel);

  if (isEnvFile(base)) return [DENY, "writing a .env file is blocked; the user edits secrets by hand"];
  for (const [pattern, reason] of ASK_ALWAYS) if (fnmatch(rel, pattern)) return [ASK, reason];
  if (!fs.existsSync(absolute)) return [NONE, ""];
  for (const [pattern, reason] of ASK_IF_EXISTS) if (fnmatch(rel, pattern)) return [ASK, reason];
  if (MANIFESTS.has(base) || MANIFEST_GLOBS.some((g) => fnmatch(rel, g) || fnmatch(base, g))) {
    return [ASK, "edits a dependency manifest or lockfile"];
  }
  if (CHECK_CONFIGS.some((g) => fnmatch(base, g))) {
    return [ASK, "edits a lint, format or type-check config; fix the code instead of loosening the check"];
  }
  return [NONE, ""];
}

// --- entry point -----------------------------------------------------------

export function decide(payload) {
  const tool = payload.tool_name ?? "";
  const input = payload.tool_input ?? {};
  if (tool === "Bash") return checkCommand(input.command ?? "");
  if (tool === "PowerShell") return checkCommand(input.command ?? "", 0, "powershell");
  if (["Write", "Edit", "MultiEdit", "NotebookEdit"].includes(tool)) {
    const root = process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd();
    return checkFile(input.file_path || input.notebook_path || "", root);
  }
  return [NONE, ""];
}

function main() {
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(0, "utf-8") || "{}");
  } catch {
    return;
  }
  if (process.argv.slice(2).includes("--command")) {
    process.stdout.write(`${payload.tool_input?.command ?? ""}\n`);
    return;
  }
  const [decision, reason] = decide(payload);
  if (decision) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: decision,
        permissionDecisionReason: `Arcane guard: ${reason}.`,
      },
    }) + "\n");
  }
}

// By name, not path: in a worktree hooks/ is a symlink, and Node reports the real path.
if (process.argv[1] && path.basename(process.argv[1]) === path.basename(fileURLToPath(import.meta.url))) {
  try {
    main();
  } catch {
    // A guard bug must never break the user's tool call.
  }
  process.exitCode = 0;
}
