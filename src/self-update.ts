import { spawnSync } from "node:child_process";
import { getPackageRoot, getPackageVersion } from "./utils.js";

const PACKAGE_NAME = "claude-code-arcane";

export interface SelfUpdateOptions {
  quiet?: boolean;
  dryRun?: boolean;
  /** Set false to skip the npm self-update entirely (--no-self-update). */
  selfUpdate?: boolean;
}

export interface SelfUpdateResult {
  /** Whether `npm install -g` was actually run and succeeded. */
  updated: boolean;
  /** True when the step was intentionally not performed. */
  skipped: boolean;
  reason?: string;
  fromVersion?: string;
}

/**
 * Heuristic: is this CLI running from a globally-installed npm package (vs an
 * ephemeral `npx` run or a local dev checkout)? `npx` extracts packages under a
 * `_npx` cache dir; dev/CI runs from the repo (no node_modules ancestor).
 */
export function isGloballyInstalled(): boolean {
  const root = getPackageRoot().replace(/\\/g, "/");

  if (root.includes("/_npx/")) return false;
  if (!root.includes("/node_modules/")) return false;

  return true;
}

/**
 * Update the globally-installed Arcane npm package to the latest version.
 *
 * Skips automatically (returning a reason) when: explicitly disabled, running
 * under tests (VITEST) or a pinned content source (ARCANE_SOURCE), or when not
 * running from a global install. In dry-run mode it reports the intended action
 * without spawning npm.
 */
export async function selfUpdateNpm(
  opts: SelfUpdateOptions = {},
): Promise<SelfUpdateResult> {
  const fromVersion = safeVersion();

  if (opts.selfUpdate === false) {
    return { updated: false, skipped: true, reason: "disabled (--no-self-update)", fromVersion };
  }
  if (process.env.VITEST || process.env.ARCANE_SOURCE) {
    return { updated: false, skipped: true, reason: "dev/test environment", fromVersion };
  }
  if (!isGloballyInstalled()) {
    return { updated: false, skipped: true, reason: "not a global npm install", fromVersion };
  }
  if (opts.dryRun) {
    return { updated: false, skipped: true, reason: "dry-run", fromVersion };
  }

  const npm = npmInstallCommand();
  const result = spawnSync(npm.command, npm.args, {
    stdio: opts.quiet ? "ignore" : "inherit",
    encoding: "utf-8",
    timeout: 120_000,
    shell: npm.shell,
  });

  if (result.status === 0) {
    return { updated: true, skipped: false, fromVersion };
  }

  const reason = result.error
    ? result.error.message
    : `npm exited with code ${result.status ?? "unknown"}`;
  return { updated: false, skipped: false, reason, fromVersion };
}

/**
 * How to invoke npm for the self-update.
 *
 * On Windows `npm` is a `.cmd` shim, and since the fix for CVE-2024-27980 Node
 * refuses to spawn one without a shell: `spawnSync` fails outright with EINVAL,
 * which is why self-update silently never worked there. `shell: true` is the
 * way through, and the whole invocation goes in the command string because
 * passing an args array alongside `shell: true` is deprecated (DEP0190). The
 * args are fixed literals, so routing them via cmd.exe adds no injection
 * surface. Everywhere else npm is a real executable and needs no shell.
 */
export function npmInstallCommand(
  platform: NodeJS.Platform = process.platform,
): { command: string; args: string[]; shell: boolean } {
  const args = ["install", "-g", `${PACKAGE_NAME}@latest`];

  if (platform === "win32") {
    return { command: ["npm", ...args].join(" "), args: [], shell: true };
  }
  return { command: "npm", args, shell: false };
}

function safeVersion(): string | undefined {
  try {
    return getPackageVersion();
  } catch {
    return undefined;
  }
}
