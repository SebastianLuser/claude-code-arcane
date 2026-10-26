import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import chalk from "chalk";
import { readManifest } from "../manifest.js";
import { cliInvocation } from "../self-update.js";
import type { ArcaneManifest } from "../types.js";

export type Verdict = "ok" | "warn" | "fail";

export interface DoctorCheck {
  name: string;
  verdict: Verdict;
  detail: string;
  fix?: string;
}

/** How the doctor reaches the machine; tests swap these for fakes. */
export interface Probes {
  /** A bash that can run the hooks, or null. */
  findBash(): string | null;
  /** Syntax-checks a script; returns the error, or null when it parses. */
  checkSyntax(bash: string, file: string): string | null;
}

/**
 * Allow rules that hand Claude a whole tool or a destructive command without asking.
 * Arcane's profiles never ship these; `Bash(gh *)` is what core allowed before 2.13.
 */
const DANGEROUS_ALLOWS = new Set([
  "Bash",
  "Bash(*)",
  "Bash(gh *)",
  "Bash(git *)",
  "Bash(git push*)",
  "Bash(git reset*)",
  "Bash(rm *)",
  "Bash(sudo *)",
  "Bash(bash *)",
  "Bash(sh *)",
  "Bash(eval *)",
  "PowerShell",
  "PowerShell(*)",
  "PowerShell(Remove-Item *)",
  "PowerShell(git *)",
]);

const SECRET_PATTERNS: Array<[string, RegExp]> = [
  ["Anthropic key", /sk-ant-[A-Za-z0-9_-]{20,}/],
  ["OpenAI key", /sk-(?:proj-)?[A-Za-z0-9]{32,}/],
  ["GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,})/],
  ["Slack token", /\bxox[abpr]-[A-Za-z0-9-]{10,}/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}/],
  ["Stripe live key", /\b[sr]k_live_[0-9A-Za-z]{20,}/],
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];

/** A literal value under a key that names a credential; `${VAR}` expansions are fine. */
const SECRET_KEY = /(?:TOKEN|SECRET|PASSWORD|PASSWD|API_?KEY|ACCESS_?KEY)$/i;

export const defaultProbes: Probes = {
  findBash,
  checkSyntax(bash, file) {
    const result = spawnSync(bash, ["-n", file.replace(/\\/g, "/")], { encoding: "utf-8" });
    if (result.error) return result.error.message;
    return result.status === 0 ? null : (result.stderr || "syntax error").trim();
  },
};

/**
 * Claude Code runs hooks with Git Bash on Windows. A plain `bash` lookup from Node
 * finds System32\bash.exe (WSL) first, which cannot read Windows paths, so skip it.
 */
function findBash(): string | null {
  if (process.platform !== "win32") {
    return spawnSync("bash", ["--version"]).error ? null : "bash";
  }
  const override = process.env.CLAUDE_CODE_GIT_BASH_PATH;
  if (override && fs.existsSync(override)) return override;
  const systemRoot = (process.env.SystemRoot ?? "C:\\Windows").toLowerCase();
  for (const dir of (process.env.PATH ?? "").split(path.delimiter)) {
    const lower = dir.toLowerCase();
    if (!dir || lower.startsWith(systemRoot) || lower.includes("windowsapps")) continue;
    const candidate = path.join(dir, "bash.exe");
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function readJson(file: string): { value?: unknown; error?: string } {
  try {
    return { value: JSON.parse(fs.readFileSync(file, "utf-8")) };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/** Every command settings.json runs: hooks and the status line. */
function commandsOf(settings: Record<string, unknown>): string[] {
  const commands: string[] = [];
  const hooks = (settings.hooks ?? {}) as Record<string, Array<{ hooks?: Array<{ command?: unknown }> }>>;
  for (const groups of Object.values(hooks)) {
    for (const group of Array.isArray(groups) ? groups : []) {
      for (const entry of group.hooks ?? []) {
        if (typeof entry.command === "string") commands.push(entry.command);
      }
    }
  }
  const status = settings.statusLine as { command?: unknown } | undefined;
  if (typeof status?.command === "string") commands.push(status.command);
  return commands;
}

/** The files under `.claude/` a command runs, relative to `.claude/`. */
function scriptsOf(command: string): string[] {
  const scripts = [...command.matchAll(/\.claude\/((?:hooks\/)?[\w.-]+\.(?:sh|py))/g)].map((m) => m[1]);
  // These wrappers only start Node; the logic lives in the .mjs beside them.
  for (const wrapper of ["guard", "session-watch"]) {
    if (scripts.includes(`hooks/${wrapper}.sh`)) scripts.push(`hooks/${wrapper}.mjs`);
  }
  return scripts;
}

function checkSettings(claudeDir: string, cli: string): { check: DoctorCheck; settings?: Record<string, unknown> } {
  const file = path.join(claudeDir, "settings.json");
  if (!fs.existsSync(file)) {
    return {
      check: { name: "settings.json", verdict: "fail", detail: "missing", fix: `Run \`${cli} update --here --force\`.` },
    };
  }
  const { value, error } = readJson(file);
  if (error || typeof value !== "object" || value === null || Array.isArray(value)) {
    return {
      check: {
        name: "settings.json",
        verdict: "fail",
        detail: `not valid JSON: ${error ?? "not an object"}`,
        fix: "Fix the syntax by hand, or restore it from .claude.bak/.",
      },
    };
  }
  return { check: { name: "settings.json", verdict: "ok", detail: "valid JSON" }, settings: value as Record<string, unknown> };
}

function checkHooks(claudeDir: string, settings: Record<string, unknown>, probes: Probes, cli: string): DoctorCheck[] {
  const commands = commandsOf(settings);
  const scripts = [...new Set(commands.flatMap(scriptsOf))];
  const checks: DoctorCheck[] = [];

  const missing = scripts.filter((s) => !fs.existsSync(path.join(claudeDir, s)));
  checks.push(
    missing.length
      ? {
          name: "hook scripts",
          verdict: "fail",
          detail: `settings.json runs files that are not there: ${missing.join(", ")}`,
          fix: `If Arcane ships them, \`${cli} update --here\` restores them; otherwise remove those hooks from settings.json.`,
        }
      : { name: "hook scripts", verdict: "ok", detail: `${scripts.length} scripts found` },
  );

  const relative = commands.filter((c) => /^bash \.claude\/hooks\//.test(c));
  if (relative.length) {
    checks.push({
      name: "hook paths",
      verdict: "warn",
      detail: `${relative.length} hooks use a relative path, which fails inside a worktree`,
      fix: `Run \`${cli} update --here\`: it rewrites them with $CLAUDE_PROJECT_DIR.`,
    });
  }

  const bash = probes.findBash();
  if (!bash) {
    checks.push({
      name: "bash",
      verdict: "fail",
      detail: "not found: no hook can run",
      fix: process.platform === "win32" ? "Install Git for Windows, or set CLAUDE_CODE_GIT_BASH_PATH." : "Install bash.",
    });
    return checks;
  }
  const broken = scripts
    .filter((s) => s.endsWith(".sh") && !missing.includes(s))
    .map((s) => [s, probes.checkSyntax(bash, path.join(claudeDir, s))] as const)
    .filter(([, error]) => error);
  checks.push(
    broken.length
      ? {
          name: "hook syntax",
          verdict: "fail",
          detail: broken.map(([s, error]) => `${s}: ${error}`).join("; "),
          fix: `Run \`${cli} update --here --force\` to restore the shipped version.`,
        }
      : { name: "hook syntax", verdict: "ok", detail: `bash parses every script (${bash})` },
  );
  return checks;
}

function checkContent(claudeDir: string, manifest: ArcaneManifest, cli: string): DoctorCheck {
  const missing = [
    ...(manifest.installed_skills ?? [])
      .filter((s) => !fs.existsSync(path.join(claudeDir, "skills", s, "SKILL.md")))
      .map((s) => `skill ${s}`),
    ...(manifest.installed_rules ?? [])
      .filter((r) => !fs.existsSync(path.join(claudeDir, "rules", `${r}.md`)))
      .map((r) => `rule ${r}`),
  ];
  if (!missing.length) {
    return { name: "installed content", verdict: "ok", detail: "every skill and rule in the manifest is on disk" };
  }
  const shown = missing.slice(0, 5).join(", ") + (missing.length > 5 ? ` and ${missing.length - 5} more` : "");
  return {
    name: "installed content",
    verdict: "fail",
    detail: `missing from disk: ${shown}`,
    fix: `Run \`${cli} update --here\` to restore them.`,
  };
}

function checkPermissions(claudeDir: string, settings: Record<string, unknown>, cli: string): DoctorCheck {
  const found: string[] = [];
  for (const [file, data] of [
    ["settings.json", settings],
    ["settings.local.json", readJson(path.join(claudeDir, "settings.local.json")).value],
  ] as const) {
    const permissions = (data as { permissions?: { allow?: unknown; defaultMode?: unknown } } | undefined)?.permissions;
    const allow = Array.isArray(permissions?.allow) ? permissions.allow : [];
    for (const rule of allow) {
      if (typeof rule === "string" && DANGEROUS_ALLOWS.has(rule.trim())) found.push(`${file}: ${rule}`);
    }
    if (permissions?.defaultMode === "bypassPermissions") found.push(`${file}: defaultMode bypassPermissions`);
  }
  return found.length
    ? {
        name: "permissions",
        verdict: "warn",
        detail: `rules that skip every confirmation: ${found.join(", ")}`,
        fix: found.some((f) => f.endsWith("Bash(gh *)"))
          ? `Run \`${cli} update --here\` to narrow the old \`Bash(gh *)\`; narrow any other by hand, unless you mean it.`
          : "Narrow them by hand (e.g. `Bash(npm test*)` instead of `Bash(*)`), unless you mean it.",
      }
    : { name: "permissions", verdict: "ok", detail: "no allow rule covers a whole tool or a destructive command" };
}

/** Every string in a JSON value, with the key it sits under. */
function* strings(value: unknown, key = ""): Generator<[string, string]> {
  if (typeof value === "string") yield [key, value];
  else if (Array.isArray(value)) for (const item of value) yield* strings(item, key);
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) yield* strings(v, k);
  }
}

function secretsIn(value: unknown): string[] {
  const found = new Set<string>();
  for (const [key, text] of strings(value)) {
    for (const [label, pattern] of SECRET_PATTERNS) if (pattern.test(text)) found.add(label);
    if (SECRET_KEY.test(key) && text.length >= 8 && !/\$\{?[A-Za-z_]/.test(text)) found.add(`literal ${key}`);
  }
  return [...found];
}

function checkSecrets(target: string, claudeDir: string): DoctorCheck {
  const committed: string[] = [];
  const local: string[] = [];
  for (const [file, bucket] of [
    [path.join(claudeDir, "settings.json"), committed],
    [path.join(target, ".mcp.json"), committed],
    [path.join(claudeDir, "settings.local.json"), local],
  ] as const) {
    const { value } = readJson(file);
    for (const label of secretsIn(value)) bucket.push(`${path.relative(target, file).replace(/\\/g, "/")} (${label})`);
  }
  if (committed.length) {
    return {
      name: "secrets",
      verdict: "fail",
      detail: `credentials in files that get committed: ${committed.join(", ")}`,
      fix: "Move them to environment variables and reference them as ${VAR}; rotate any that were pushed.",
    };
  }
  if (local.length) {
    return {
      name: "secrets",
      verdict: "warn",
      detail: `credentials in settings.local.json: ${local.join(", ")}`,
      fix: "It is not committed, but an environment variable keeps it out of backups and shares.",
    };
  }
  return { name: "secrets", verdict: "ok", detail: "no credentials found in settings or .mcp.json" };
}

/** Runs every check against the Arcane install in `target`. */
export function diagnose(target: string, probes: Probes = defaultProbes): DoctorCheck[] {
  const claudeDir = path.join(target, ".claude");
  const cli = cliInvocation();
  const manifest = readManifest(target);
  if (!manifest) {
    return [
      {
        name: "installation",
        verdict: "fail",
        detail: "no .claude/arcane-manifest.json",
        fix: `Run \`${cli} install <profile>\`.`,
      },
    ];
  }
  const checks: DoctorCheck[] = [
    { name: "installation", verdict: "ok", detail: `Arcane ${manifest.arcane_version}, ${manifest.profiles.join(" + ")}` },
  ];
  const { check, settings } = checkSettings(claudeDir, cli);
  checks.push(check);
  if (settings) checks.push(...checkHooks(claudeDir, settings, probes, cli));
  checks.push(checkContent(claudeDir, manifest, cli));
  if (settings) checks.push(checkPermissions(claudeDir, settings, cli));
  checks.push(checkSecrets(target, claudeDir));
  return checks;
}

const ICONS: Record<Verdict, string> = { ok: chalk.green("✓"), warn: chalk.yellow("!"), fail: chalk.red("✗") };

export async function doctorCommand(opts: { target?: string } = {}): Promise<void> {
  const target = path.resolve(opts.target ?? process.cwd());
  const checks = diagnose(target);
  console.log(chalk.bold(`\n=== Arcane Doctor: ${target} ===\n`));
  for (const check of checks) {
    console.log(`  ${ICONS[check.verdict]} ${chalk.bold(check.name)}: ${check.detail}`);
    if (check.fix && check.verdict !== "ok") console.log(chalk.dim(`      fix: ${check.fix}`));
  }
  const fails = checks.filter((c) => c.verdict === "fail").length;
  const warns = checks.filter((c) => c.verdict === "warn").length;
  console.log(
    `\n  ${fails ? chalk.red(`${fails} failed`) : chalk.green("nothing failed")}${warns ? chalk.yellow(`, ${warns} warnings`) : ""}\n`,
  );
  if (fails) process.exitCode = 1;
}
