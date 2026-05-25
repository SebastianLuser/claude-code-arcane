import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import chalk from "chalk";
import { copyDirSync, getPackageRoot } from "../utils.js";

interface GlobalOpts {
  remove?: boolean;
  status?: boolean;
}

const CLAUDE_HOME = path.join(os.homedir(), ".claude");
const SCRIPTS_DIR = path.join(CLAUDE_HOME, "scripts", "worktree-isolation");
const SETTINGS_PATH = path.join(CLAUDE_HOME, "settings.json");

export async function globalCommand(opts: GlobalOpts): Promise<void> {
  if (opts.status) {
    showStatus();
    return;
  }

  if (opts.remove) {
    removeGlobal();
    return;
  }

  installGlobal();
}

function showStatus(): void {
  console.log(chalk.bold("\n=== Arcane Global Status ===\n"));

  const hasScripts = fs.existsSync(
    path.join(SCRIPTS_DIR, "apply.py"),
  );
  console.log(
    `  Worktree scripts: ${hasScripts ? chalk.green("installed") : chalk.dim("not installed")}`,
  );
  if (hasScripts) {
    console.log(`    ${chalk.dim(SCRIPTS_DIR)}`);
  }

  const hookInstalled = isHookInstalled();
  console.log(
    `  SessionStart hook: ${hookInstalled ? chalk.green("active") : chalk.dim("not configured")}`,
  );
  console.log(`    ${chalk.dim(SETTINGS_PATH)}`);
  console.log();
}

function installGlobal(): void {
  console.log(chalk.bold("\nInstalling Arcane global hooks...\n"));

  const root = getPackageRoot();
  const scriptsSrc = path.join(
    root,
    "skills",
    "worktree-isolation",
    "scripts",
  );

  if (!fs.existsSync(scriptsSrc)) {
    console.error(
      chalk.red("  worktree-isolation scripts not found in package."),
    );
    process.exit(1);
  }

  fs.mkdirSync(SCRIPTS_DIR, { recursive: true });
  for (const file of ["apply.py", "lib.py"]) {
    const src = path.join(scriptsSrc, file);
    const dst = path.join(SCRIPTS_DIR, file);
    if (!fs.existsSync(src)) {
      console.warn(chalk.yellow(`  WARN: ${file} not found, skipping`));
      continue;
    }
    if (
      fs.existsSync(dst) &&
      fs.readFileSync(src).equals(fs.readFileSync(dst))
    ) {
      console.log(chalk.dim(`  [skip] ${file} (already up-to-date)`));
    } else {
      fs.copyFileSync(src, dst);
      if (process.platform !== "win32") {
        fs.chmodSync(dst, 0o755);
      }
      console.log(chalk.green(`  [ok] ${file} -> ${SCRIPTS_DIR}`));
    }
  }

  if (isHookInstalled()) {
    console.log(
      chalk.dim("  [skip] SessionStart hook (already configured)"),
    );
  } else {
    addHookToSettings();
    console.log(
      chalk.green("  [ok] SessionStart hook added to ~/.claude/settings.json"),
    );
  }

  console.log(chalk.bold.green("\n  Global hooks installed."));
  console.log(
    chalk.dim(
      "  Worktree isolation will auto-apply on every new Claude Code session.\n",
    ),
  );
}

function removeGlobal(): void {
  console.log(chalk.bold("\nRemoving Arcane global hooks...\n"));

  if (fs.existsSync(SCRIPTS_DIR)) {
    fs.rmSync(SCRIPTS_DIR, { recursive: true, force: true });
    console.log(chalk.green("  [ok] Removed worktree-isolation scripts"));
  } else {
    console.log(chalk.dim("  [skip] Scripts not found"));
  }

  if (isHookInstalled()) {
    removeHookFromSettings();
    console.log(chalk.green("  [ok] Removed SessionStart hook"));
  } else {
    console.log(chalk.dim("  [skip] Hook not configured"));
  }

  console.log(chalk.bold.green("\n  Global hooks removed.\n"));
}

function readSettings(): Record<string, unknown> {
  if (!fs.existsSync(SETTINGS_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function writeSettings(settings: Record<string, unknown>): void {
  fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
  fs.writeFileSync(
    SETTINGS_PATH,
    JSON.stringify(settings, null, 2) + "\n",
    "utf-8",
  );
}

function isHookInstalled(): boolean {
  const settings = readSettings();
  const hooks = (settings.hooks ?? {}) as Record<string, unknown[]>;
  const sessionStart = (hooks.SessionStart ?? []) as Array<{
    hooks?: Array<{ command?: string }>;
  }>;

  for (const entry of sessionStart) {
    for (const hook of entry.hooks ?? []) {
      if (
        hook.command?.includes("worktree-isolation/apply.py") &&
        hook.command?.includes("--quiet")
      ) {
        return true;
      }
    }
  }
  return false;
}

function addHookToSettings(): void {
  const settings = readSettings();
  const hooks = ((settings.hooks as Record<string, unknown[]>) ??= {});
  const sessionStart = ((hooks.SessionStart ??= []) as Array<{
    matcher?: string;
    hooks?: Array<{ type: string; command: string }>;
  }>);

  const hookEntry = {
    type: "command" as const,
    command: `${SCRIPTS_DIR.replace(/\\/g, "/")}/apply.py --quiet`,
  };

  const existing = sessionStart.find(
    (e) => (e.matcher ?? "") === "",
  );
  if (existing) {
    (existing.hooks ??= []).push(hookEntry);
  } else {
    sessionStart.push({
      matcher: "",
      hooks: [hookEntry],
    });
  }

  writeSettings(settings);
}

function removeHookFromSettings(): void {
  const settings = readSettings();
  const hooks = (settings.hooks ?? {}) as Record<string, unknown[]>;
  const sessionStart = (hooks.SessionStart ?? []) as Array<{
    matcher?: string;
    hooks?: Array<{ type?: string; command?: string }>;
  }>;

  for (const entry of sessionStart) {
    if (!entry.hooks) continue;
    entry.hooks = entry.hooks.filter(
      (h) =>
        !(
          h.command?.includes("worktree-isolation/apply.py") &&
          h.command?.includes("--quiet")
        ),
    );
  }

  hooks.SessionStart = sessionStart.filter(
    (e) => (e.hooks?.length ?? 0) > 0,
  );

  writeSettings(settings);
}
